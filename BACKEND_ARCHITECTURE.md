# PollVerse Backend Architecture & Schema Design

## 1. Executive Summary
This document outlines the technical architecture for **PollVerse**, a scalable polling and social platform. The system is designed to handle high-concurrency voting events, diverse poll types (including complex surveys and swipe interactions), and a real-time social feed.

The architecture prioritizes **read scalability** for the feed and **write throughput** for voting, utilizing a polyglot persistence layer where appropriate.

---

## 2. High-Level Architecture

### 2.1 Core Components
*   **API Gateway**: Entry point for all client requests (GraphQL or REST). Handles rate limiting and routing.
*   **Auth Service**: Manages user identity, OAuth providers (Google, Twitter), and session tokens (JWT).
*   **Poll Service**: Core logic for creating polls, validating constraints (expiration, max votes), and serving poll details.
*   **Vote Engine**: High-throughput service specifically specialized in ingesting votes and processing real-time stats.
*   **Social Graph Service**: Manages user relationships (followers/following) and feed composition.
*   **Notification Worker**: Async processing for push notifications (e.g., "Poll ending soon", "Someone replied").

### 2.2 Infrastructure Stack (Recommended)
*   **Compute**: Serverless Containers (e.g., AWS Fargate, Google Cloud Run) for auto-scalability.
*   **Primary Database**: **PostgreSQL** (version 16+). Chosen for strict relational integrity and JSONB support for flexible poll schemas.
*   **Cache / Fast Store**: **Redis**. Used for:
    *   Real-time vote counters.
    *   "Trending" algorithm leaderboards (Sorted Sets).
    *   User session caching.
*   **Message Queue**: **Kafka** or **RabbitMQ**. Used to decouple the *Vote Ingestion* from *Database Persistence* during traffic spikes.

---

## 3. Data Entities & Schema (PostgreSQL)

### 3.1 Users & Graph
**Table: `users`**
*   `id` (UUID, PK): Unique identifier.
*   `username` (String, UQ): Display handle.
*   `email` (String, UQ): Private contact.
*   `avatar_url` (String): Profile picture blob path.
*   `reputation_score` (Int): Calculated gamification score.
*   `created_at` (Timestamp).

**Table: `user_follows`**
*   `follower_id` (UUID, FK -> users.id).
*   `followee_id` (UUID, FK -> users.id).
*   *Index*: Composite `(follower_id, followee_id)` for quick lookup.

### 3.2 Polls Core
**Table: `polls`**
*   `id` (BigInt/Snowflake, PK): Sortable by time unique ID.
*   `creator_id` (UUID, FK -> users.id).
*   `type` (Enum): `MULTIPLE_CHOICE`, `IMAGE`, `SWIPE`, `RANKING`, `SLIDER`, `SURVEY`.
*   `question` (Text).
*   `description` (Text).
*   `category` (String): e.g., "Sports", "Tech".
*   `tags` (Array<String>): Viral hashtags e.g. ["#worldcup", "#viral"].
*   `settings` (JSONB): Flexible configuration.
    *   *Example*: `{ "swipe_labels": {"left": "Nay", "right": "Yay"}, "allow_anonymous": false }`.
*   `constraints` (JSONB): Rules for closing.
    *   *Example*: `{ "expires_at": "2024-12-31T...", "max_votes": 1000 }`.
*   `status` (Enum): `ACTIVE`, `ENDED`, `ARCHIVED`.
*   `aggregates` (JSONB): Denormalized counters for fast feed rendering.
    *   *Example*: `{ "total_votes": 142, "likes": 50, "comments": 12 }`.

### 3.3 Poll Inputs
**Table: `poll_options`**
*   `id` (Int, PK).
*   `poll_id` (BigInt, FK -> polls.id).
*   `label` (String): Text displayed to user.
*   `media_url` (String, Opt): For Image polls.
*   `position` (Int): Display order.
*   `survey_config` (JSONB, Opt): If part of a multi-step survey.

### 3.4 Interactions (The "Hot" Tables)
**Table: `votes`**
*   `id` (BigInt, PK).
*   `poll_id` (BigInt, FK -> polls.id).
*   `user_id` (UUID, FK -> users.id).
*   `selection_data` (JSONB): Stores the value of the vote.
    *   *Choice*: `{"option_id": 5}`
    *   *Ranking*: `{"order": [3, 1, 2]}`
    *   *Slider*: `{"value": 75}`
*   `created_at` (Timestamp).
*   *Constraint*: Unique `(poll_id, user_id)` to prevent double voting (unless allowed by settings).

**Table: `comments`**
*   `id` (BigInt, PK).
*   `poll_id` (BigInt, FK).
*   `user_id` (UUID, FK).
*   `content` (Text).
*   `parent_id` (BigInt, Opt): For threaded replies.

---

## 4. Storage & Access Patterns

### 4.1 The "Feed" Pattern (Read-Heavy)
The most critical performance path. Users request "For You" or "Trending".

**Strategy:**
1.  **Hybrid Querying**:
    *   Fetch latest polls from `polls` table.
    *   Join with `users` (creator).
    *   **Optimization**: Do *not* COUNT(*) votes on read. Use the `polls.aggregates` denormalized column.
2.  **Pagination**: Cursor-based pagination using `polls.id` (Snowflake IDs allow time-ordering) rather than `OFFSET/LIMIT`.

**Algorithm - Trending Feed**:
*   Formula: `Score = (Votes * 1.0 + Comments * 2.0 + Likes * 0.5) / (HoursSinceCreation + 2)^1.5`
*   **Implementation**: A background worker runs every 5 minutes to calculate scores and push top 1000 Poll IDs to a **Redis Sorted Set**. The API simply fetches IDs from Redis and hydrates data from Postgres.

### 4.2 The "Vote" Pattern (Write-Heavy)
Handling sudden viral polls where thousands vote per second.

**Strategy:**
1.  **Ingestion**: API accepts vote -> Pushes to Message Queue (Kafka/SQS) immediately to respond "200 OK" to client.
2.  **Processing**:
    *   Worker pulls vote batch.
    *   **Validation**: Check `isPollClosed`, `hasUserVoted`.
    *   **Persistence**: `INSERT` into `votes`.
    *   **Aggregation**: `UPDATE polls SET aggregates['total_votes'] = aggregates['total_votes'] + 1`.

### 4.3 Real-Time Updates
*   Use **WebSockets** (or Server-Sent Events) for the active poll page.
*   When a vote is processed, publish an event to a Redis Pub/Sub channel `poll:{id}:updates`.
*   Connected clients receive the new vote count instantly.

---

## 5. Security & Validation Rules
1.  **Immutable History**: Once a poll has votes, its `question` and `options` cannot be edited.
2.  **Expiration Enforcement**:
    *   *Soft Check*: Frontend checks `expires_at`.
    *   *Hard Check*: Backend middleware rejects votes where `NOW() > polls.constraints->>'expires_at'`.
3.  **Rate Limiting**:
    *   Global: 100 req/min per user.
    *   Creation: 5 polls/hour per user to prevent spam.

## 6. Scalability Roadmap
*   **Phase 1 (MVP)**: Monolithic API + Single Postgres Instance.
*   **Phase 2 (Growth)**: Split "Vote Processing" into separate worker service. Add Read Replicas to Postgres.
*   **Phase 3 (Hyper-Scale)**: Shard the `votes` table by `poll_id` (all votes for one poll live on one node). Move `aggregates` entirely to Redis for sub-millisecond writes.
