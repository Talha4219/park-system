import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import type { ParkingSpot } from '@/lib/types';
import { getUserFromSession } from '@/lib/auth-jwt';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const db = await getDb();
  const spot = await db
    .collection('parkingSpots')
    .findOne({ _id: params.id }, { projection: { _id: 0 } });

  if (!spot) {
    return NextResponse.json({ error: 'Spot not found' }, { status: 404 });
  }

  return NextResponse.json(spot);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromSession();
    const updates = await request.json();

    // Allow users to reserve spots, but only managers can modify other fields
    if (updates.status === 'booked' || updates.status === 'in-use') {
      // Users can reserve/occupy spots
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized. Login required.' }, { status: 403 });
      }
    } else {
      // Only managers can modify other fields or delete spots
      if (!user || user.role !== 'manager') {
        return NextResponse.json({ error: 'Unauthorized. Managers only.' }, { status: 403 });
      }
    }
    const db = await getDb();
    const collection = db.collection('parkingSpots');

    // Normalize car numbers
    if (updates.reservedBy?.carNumber) {
      updates.reservedBy.carNumber = updates.reservedBy.carNumber.toUpperCase().trim();
    }
    if (updates.occupiedBy?.licensePlate) {
      updates.occupiedBy.licensePlate = updates.occupiedBy.licensePlate.toUpperCase().trim();
    }

    const set: Record<string, unknown> = {};
    const unset: Record<string, ''> = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        unset[key] = '';
      } else {
        set[key] = value;
      }
    });

    const updateOperations: Record<string, Record<string, unknown>> = {};
    if (Object.keys(set).length) updateOperations.$set = set;
    if (Object.keys(unset).length) updateOperations.$unset = unset;
    if (!Object.keys(updateOperations).length) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    const result = await collection.findOneAndUpdate(
      { _id: params.id },
      updateOperations,
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 });
    }

    const { _id, ...updatedSpot } = result.value as ParkingSpot & { _id: string };
    return NextResponse.json(updatedSpot);
  } catch (error) {
    console.error('Update spot error:', error);
    return NextResponse.json(
      { error: 'Failed to update parking spot' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromSession();
    if (!user || user.role !== 'manager') {
      return NextResponse.json({ error: 'Unauthorized. Managers only.' }, { status: 403 });
    }

    const db = await getDb();
    const collection = db.collection('parkingSpots');
    const result = await collection.deleteOne({ _id: params.id });

    if (!result.deletedCount) {
      return NextResponse.json({ error: 'Spot not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete spot error:', error);
    return NextResponse.json(
      { error: 'Failed to delete parking spot' },
      { status: 500 }
    );
  }
}

