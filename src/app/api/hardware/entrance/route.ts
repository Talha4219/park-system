import { NextResponse } from 'next/server';
import { assignSpotToVehicle } from '@/lib/parking-logic';

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

    const result = await assignSpotToVehicle(licensePlate);

    if (!result.success) {
      // Determine efficient status code based on result or default to 400
      const status = result.status || 400;
      return NextResponse.json(
        { success: false, message: result.message, spotId: result.spotId },
        { status }
      );
    }

    // Log success
    console.log(`[HARDWARE] Vehicle ${licensePlate} assigned to spot ${result.spotId} at ${result.startTime}.`);

    return NextResponse.json({
      success: true,
      message: result.message,
      spotId: result.spotId,
      startTime: result.startTime,
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
