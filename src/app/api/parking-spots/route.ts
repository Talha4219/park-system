import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import type { ParkingSpot } from '@/lib/types';
import { getUserFromSession } from '@/lib/auth-jwt';

const baseSpots: ParkingSpot[] = [
  { id: 'A-1', spotNumber: 1, type: 'regular', status: 'available' },
  { id: 'A-2', spotNumber: 2, type: 'regular', status: 'available' },
  {
    id: 'A-3',
    spotNumber: 3,
    type: 'accessible',
    status: 'in-use',
    occupiedBy: {
      licensePlate: 'FAST-CAR',
      startTime: new Date(Date.now() - 3600 * 1000).toISOString(),
    },
  },
  { id: 'A-4', spotNumber: 4, type: 'ev', status: 'available' },
  { id: 'B-1', spotNumber: 1, type: 'regular', status: 'booked' },
  { id: 'B-2', spotNumber: 2, type: 'regular', status: 'unavailable' },
  { id: 'B-3', spotNumber: 3, type: 'ev', status: 'available' },
];

const mapSpot = (spot: any): ParkingSpot => {
  const { _id, ...rest } = spot;
  return rest as ParkingSpot;
};

export async function GET() {
  try {
    const db = await getDb();
    const spots = await db
      .collection('parkingSpots')
      .find({})
      .sort({ spotNumber: 1 })
      .toArray();

    return NextResponse.json(spots.map(mapSpot));
  } catch (error) {
    console.error('Parking spots GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parking spots', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromSession();
    if (!user || user.role !== 'manager') {
      return NextResponse.json({ error: 'Unauthorized. Managers only.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { action, zoneId = 'A', type = 'regular', quantity = 1 } = body;
    const db = await getDb();
    const spotsCollection = db.collection('parkingSpots');

    if (action === 'seed') {
      const existingCount = await spotsCollection.countDocuments();
      if (existingCount > 0) {
        return NextResponse.json(
          { error: 'Database already seeded.' },
          { status: 409 }
        );
      }

      const docs = baseSpots.map((spot) => ({ ...spot, _id: spot.id }));
      await spotsCollection.insertMany(docs);
      return NextResponse.json({ success: true, spots: baseSpots });
    }

    // Validate quantity
    const spotQuantity = Math.max(1, Math.min(50, parseInt(quantity)));

    const latestSpot = await spotsCollection
      .find({})
      .sort({ spotNumber: -1 })
      .limit(1)
      .toArray();

    const startingSpotNumber =
      latestSpot.length > 0 ? (latestSpot[0] as ParkingSpot).spotNumber + 1 : 1;

    const newSpots: ParkingSpot[] = [];
    const docsToInsert = [];

    for (let i = 0; i < spotQuantity; i++) {
      const spotNumber = startingSpotNumber + i;
      const newSpotId = `${zoneId}-${spotNumber}`;

      const newSpot: ParkingSpot = {
        id: newSpotId,
        spotNumber,
        type,
        status: 'available',
      };

      newSpots.push(newSpot);
      docsToInsert.push({ ...newSpot, _id: newSpotId });
    }

    await spotsCollection.insertMany(docsToInsert);

    return NextResponse.json({
      spots: newSpots,
      count: spotQuantity,
      message: `Successfully created ${spotQuantity} parking spot${spotQuantity > 1 ? 's' : ''}`
    }, { status: 201 });
  } catch (error) {
    console.error('Parking spot POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create parking spot' },
      { status: 500 }
    );
  }
}


