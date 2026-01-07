
import { MongoClient } from 'mongodb';
import { config } from 'dotenv';
import path from 'path';

// Load env vars explicitly since we are running this script directly
// Try loading .env.local first
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error('❌ MONGODB_URI is not defined in .env');
    process.exit(1);
}

console.log('Testing MongoDB connection...');
// Hide credentials when printing
console.log(`URI: ${uri.replace(/:([^@]+)@/, ':****@')}`);

async function testConnection() {
    const client = new MongoClient(uri!);
    try {
        await client.connect();
        console.log('✅ Successfully connected to MongoDB!');
        const db = client.db();
        console.log(`Database Name: ${db.databaseName}`);
        await client.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to connect:', error);
        process.exit(1);
    }
}

testConnection();
