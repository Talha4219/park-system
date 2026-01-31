import { getDb } from './mongodb';
import { ParkingSpot } from './types';

export async function assignSpotToVehicle(licensePlate: string, entryImage?: string) {
    const db = await getDb();
    const spotsCollection = db.collection('parkingSpots');
    const usersCollection = db.collection('users');

    // 1. Verify User
    const user = await usersCollection.findOne({ carNumber: licensePlate });
    if (!user) {
        return { success: false, message: 'Please sign up to Park Smart', status: 404 };
    }

    // 2. Check if already parked
    const existingActiveSpot = await spotsCollection.findOne({
        'occupiedBy.licensePlate': licensePlate,
        status: 'in-use'
    });

    if (existingActiveSpot) {
        return {
            success: false,
            message: `Vehicle ${licensePlate} is already parked in spot ${existingActiveSpot.id}.`,
            spotId: existingActiveSpot.id,
            status: 409
        };
    }

    // 3. Check for Reservation
    const reservedSpot = await spotsCollection.findOne({
        'reservedBy.carNumber': licensePlate,
        status: 'booked'
    });

    let assignedSpot;
    const startTime = new Date().toISOString();

    if (reservedSpot) {
        assignedSpot = reservedSpot;
    } else {
        // Assign a random available spot
        const availableSpots = await spotsCollection
            .find({ status: 'available' })
            .toArray();

        if (!availableSpots.length) {
            return { success: false, message: 'No available parking spots found.', status: 404 };
        }
        assignedSpot = availableSpots[Math.floor(Math.random() * availableSpots.length)];
    }

    // 4. Update Spot to Occupied
    const updatePayload: any = {
        status: 'in-use',
        occupiedBy: {
            licensePlate,
            startTime,
        },
    };

    if (entryImage) {
        updatePayload.occupiedBy.entryImage = entryImage;

        // Log to cameraLogs collection for the dedicated captures page
        try {
            await db.collection('cameraLogs').insertOne({
                licensePlate,
                spotId: assignedSpot.id,
                image: entryImage, // Store full image string
                timestamp: startTime,
                userDisplayName: user.displayName
            });
        } catch (logError) {
            console.error('Failed to log camera capture:', logError);
        }
    }

    await spotsCollection.updateOne(
        { _id: assignedSpot._id },
        {
            $set: updatePayload,
            $unset: { reservedBy: '' },
        }
    );

    return {
        success: true,
        message: `Welcome ${user.displayName}! Please park at spot: ${assignedSpot.id}`,
        spotId: assignedSpot.id,
        startTime,
        userDisplayName: user.displayName,
        status: 200
    };
}
