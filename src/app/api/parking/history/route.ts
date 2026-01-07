
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getUserFromSession } from '@/lib/auth-jwt';

export async function GET() {
    try {
        const user = await getUserFromSession();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = await getDb();
        const historyCollection = db.collection('parkingHistory');

        const history = await historyCollection
            .find({ userId: user.uid })
            .sort({ createdAt: -1 })
            .limit(20)
            .toArray();

        return NextResponse.json(history);
    } catch (error) {
        console.error('History API GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
