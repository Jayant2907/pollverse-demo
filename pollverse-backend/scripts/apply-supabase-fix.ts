
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '6543'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: { rejectUnauthorized: false }
});

async function applyFix() {
    try {
        await client.connect();
        console.log('Connected to Supabase. Applying schema fixes...');

        const queries = [
            'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "phoneNumber" character varying',
            'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "bio" text',
            'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "location" character varying',
            'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "website" character varying',
            'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "profession" character varying',
            'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "interests" text',
            'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "dateOfBirth" timestamp without time zone',
            'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "socialLinks" text',
            'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "pollsCount" integer DEFAULT 0',
            'ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "trustLevel" integer DEFAULT 1',
            'ALTER TABLE "comment" ADD COLUMN IF NOT EXISTS "parentId" integer',
            'ALTER TABLE "comment" ADD COLUMN IF NOT EXISTS "replyCount" integer DEFAULT 0',
            `CREATE TABLE IF NOT EXISTS "comment_like" (
                "id" SERIAL PRIMARY KEY,
                "userId" integer NOT NULL,
                "commentId" integer NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now()
            )`
        ];

        for (const query of queries) {
            try {
                await client.query(query);
                console.log(`Success: ${query.substring(0, 50)}...`);
            } catch (err) {
                console.warn(`Already exists or error: ${query.substring(0, 50)}...`, err.message);
            }
        }

        console.log('Schema update complete.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

applyFix();
