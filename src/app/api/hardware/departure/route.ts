
import { NextResponse } from 'next/server';
import { formatDistance, differenceInHours } from 'date-fns';
import { getDb } from '@/lib/mongodb';

const HOURLY_RATE = 5; // $5 per hour

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { licensePlate: rawPlate } = body;

    if (!rawPlate) {
      return NextResponse.json(
        { error: 'License plate is required' },
        { status: 400 }
      );
    }

    const licensePlate = rawPlate.toUpperCase().trim();

    const db = await getDb();
    const collection = db.collection('parkingSpots');

    const spot = await collection.findOne({
      'occupiedBy.licensePlate': licensePlate,
      status: 'in-use',
    });

    if (!spot) {
      return NextResponse.json(
        { error: `No active parking session found for vehicle ${licensePlate}.` },
        { status: 404 }
      );
    }

    const startTime = new Date(spot.occupiedBy.startTime);
    const endTime = new Date();

    const durationString = formatDistance(endTime, startTime);
    const durationInHours = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60));
    const totalCost = Math.max(durationInHours, 1) * HOURLY_RATE;
    const isPaid = spot.occupiedBy.isPaid === true;

    if (isPaid) {
      // Gate Authorized to Open

      // Save to History before clearing
      try {
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({ carNumber: licensePlate });

        if (user) {
          const historyCollection = db.collection('parkingHistory');
          await historyCollection.insertOne({
            userId: user.uid,
            carNumber: licensePlate,
            spotId: spot.id,
            spotType: spot.type,
            startTime: spot.occupiedBy.startTime,
            endTime: endTime.toISOString(),
            totalCost: spot.occupiedBy.totalBill || totalCost,
            duration: durationString,
            createdAt: new Date()
          });
        }
      } catch (historyError) {
        console.error('Failed to save parking history:', historyError);
        // Continue anyway to allow departure
      }

      await collection.updateOne(
        { _id: spot.id },
        { $set: { status: 'available' }, $unset: { occupiedBy: '' } }
      );

      console.log(
        `[HARDWARE] Vehicle ${licensePlate} PAID & DEPARTED from spot ${spot.id}.`
      );

      return NextResponse.json({
        success: true,
        gateOpen: true,
        message: 'Payment verified. Gate opening. Travel safe!',
        licensePlate,
        spotId: spot.id
      });
    } else {
      // Payment Required - User is at the exit gate
      await collection.updateOne(
        { _id: spot.id },
        {
          $set: {
            'occupiedBy.totalBill': totalCost,
            'occupiedBy.isAtExit': true
          }
        }
      );

      console.log(
        `[HARDWARE] Vehicle ${licensePlate} departure BLOCKED (Unpaid). Bill: $${totalCost.toFixed(2)}. Flagged at Exit.`
      );

      return NextResponse.json({
        success: false,
        gateOpen: false,
        message: `Payment of $${totalCost.toFixed(2)} is required to open the gate.`,
        licensePlate,
        duration: durationString,
        totalCost: totalCost.toFixed(2),
        spotId: spot.id,
        isAtExit: true
      });
    }
  } catch (error) {
    console.error('API Error (Hardware Departure):', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown server error occurred.';
    return NextResponse.json(
      { error: 'Invalid request', details: errorMessage },
      { status: 500 }
    );
  }
}
