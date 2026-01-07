
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { spotId, occupied } = body;

        if (!spotId) {
            return NextResponse.json(
                { error: 'Spot ID is required' },
                { status: 400 }
            );
        }

        const db = await getDb();
        const collection = db.collection('parkingSpots');

        const updateData: any = {
            status: occupied ? 'in-use' : 'available',
        };

        const updateQuery: any = { $set: updateData };

        // If clearing a spot, also clear occupant data
        if (!occupied) {
            updateQuery.$unset = { occupiedBy: '', reservedBy: '' };
        } else {
            // If marking as occupied from hardware but no car data provided, 
            // we add a placeholder to indicate hardware detection.
            updateData.occupiedBy = {
                licensePlate: "HARDWARE_DETECTED",
                startTime: new Date().toISOString()
            };
        }

        const result = await collection.updateOne(
            { id: spotId },
            updateQuery
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { error: `Spot ${spotId} not found.` },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Spot ${spotId} is now ${occupied ? 'in-use' : 'available'}.`,
        });
    } catch (error) {
        console.error('API Error (Hardware Status):', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
