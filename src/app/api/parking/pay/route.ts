
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getUserFromSession } from '@/lib/auth-jwt';

export async function POST(request: Request) {
    try {
        const user = await getUserFromSession();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { spotId } = body;

        if (!spotId) {
            return NextResponse.json({ error: 'Spot ID is required' }, { status: 400 });
        }

        const db = await getDb();
        const collection = db.collection('parkingSpots');

        const spot = await collection.findOne({ _id: spotId });

        if (!spot) {
            return NextResponse.json({ error: 'Spot not found' }, { status: 404 });
        }

        // Verify it's actually occupied by this user
        if (spot.occupiedBy?.licensePlate !== user.carNumber) {
            return NextResponse.json({ error: 'Unauthorized to pay for this spot' }, { status: 403 });
        }

        await collection.updateOne(
            { _id: spotId },
            { $set: { 'occupiedBy.isPaid': true } }
        );

        return NextResponse.json({
            success: true,
            message: 'Payment settled. The gate will now open upon departure.',
        });
    } catch (error) {
        console.error('Payment API Error:', error);
        return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
    }
}
