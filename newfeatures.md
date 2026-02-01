Step 1: Verify the "Command Center"
Navigate to the Admin Page (/admin).
Look for the "⚙️ System Configuration" card.
Test: Change Weight: Likes to 10.0 and click "Save." Go to the Trending feed; polls with even 1 like should now jump to the top.
Step 2: Verify Paid Poll Creation
Go to Add Poll.
Open "Advanced Settings".
Test: Toggle "🚀 Promote as Paid Poll". Select "Paid Users Only" visibility.
Post the poll. Verify (via the backend or database) that isPaid is true and visibilityCategory is PAID_ONLY.
Step 3: Verify the Moderation Queue UI
Create a poll as a regular user (it enters PENDING status).
Switch to a Moderator/Admin account and open the Review Queue.
Test: You should see a status badge like "Tier 1" and "23h 59m left" (or less if you scheduled the poll for sooner).
Click the new "Escalate" (blue) button. Verify the poll moves to the next tier or shows the "Pushed" toast.
Step 4: Verify the SLA Background Worker (The "Sheriff")
Since waiting 24 hours is hard, you can manually trigger a penalty/escalation:

Open your Database terminal.
Run this SQL to "age" a pending poll:
sql
UPDATE poll SET "moderationDeadline" = NOW() - INTERVAL '1 hour', "assignedModeratorId" = 1 WHERE id = [POLL_ID];
Within 60 seconds, the background worker will:
Deduct points from User 1.
Log a PUSH_NEXT_TIER action.
Reset the deadline for the next set of moderators.
Check the Moderation Logs or the user's Points to see the deduction!