
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

async function check() {
    try {
        await client.connect();
        const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user'");
        console.log('Columns in "user" table:');
        console.table(res.rows);

        const res2 = await client.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'comment_like'");
        console.log('Table "comment_like" exists:', res2.rows.length > 0);
    } catch (err) {
        console.error('Error during check:', err);
    } finally {
        await client.end();
    }
}

check();
