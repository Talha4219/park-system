
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

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
    const spotsCollection = db.collection('parkingSpots');
    const usersCollection = db.collection('users');

    // 1. Verify User (Camera reads plate, check if registered)
    const user = await usersCollection.findOne({ carNumber: licensePlate });
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'Please sign up to Park Smart',
      }, { status: 404 });
    }

    // 2. Check if already parked
    const existingActiveSpot = await spotsCollection.findOne({
      'occupiedBy.licensePlate': licensePlate,
      status: 'in-use'
    });

    if (existingActiveSpot) {
      return NextResponse.json({
        success: false,
        message: `Vehicle ${licensePlate} is already parked in spot ${existingActiveSpot.id}.`,
        spotId: existingActiveSpot.id
      }, { status: 409 });
    }

    // 3. Check for Reservation
    const reservedSpot = await spotsCollection.findOne({
      'reservedBy.carNumber': licensePlate,
      status: 'booked'
    });

    let assignedSpot;
    const startTime = new Date().toISOString();

    if (reservedSpot) {
      // Use their specific reserved spot
      assignedSpot = reservedSpot;
    } else {
      // Assign a random available spot
      const availableSpots = await spotsCollection
        .find({ status: 'available' })
        .toArray();

      if (!availableSpots.length) {
        return NextResponse.json(
          { error: 'No available parking spots found.' },
          { status: 404 }
        );
      }
      assignedSpot = availableSpots[Math.floor(Math.random() * availableSpots.length)];
    }

    // 4. Update Spot to Occupied
    await spotsCollection.updateOne(
      { _id: assignedSpot._id },
      {
        $set: {
          status: 'in-use',
          occupiedBy: {
            licensePlate,
            startTime,
          },
        },
        $unset: { reservedBy: '' },
      }
    );

    console.log(
      `[HARDWARE] Vehicle ${licensePlate} assigned to spot ${assignedSpot.id} at ${startTime}.`
    );

    return NextResponse.json({
      success: true,
      message: `Welcome ${user.displayName}! Please park at spot: ${assignedSpot.id}`,
      spotId: assignedSpot.id,
      startTime,
    });
  } catch (error) {
    console.error('API Error (Hardware Entrance):', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown server error occurred.';
    return NextResponse.json(
      { error: 'Invalid request', details: errorMessage },
      { status: 500 }
    );
  }
}
