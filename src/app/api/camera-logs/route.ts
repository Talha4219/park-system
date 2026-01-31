import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET() {
    try {
        const db = await getDb();
        const logs = await db.collection('cameraLogs')
            .find({})
            .sort({ timestamp: -1 })
            .limit(50)
            .toArray();

        return NextResponse.json(logs);
    } catch (error) {
        console.error('Failed to fetch camera logs:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
