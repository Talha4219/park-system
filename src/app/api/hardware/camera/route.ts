import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { detectLicensePlate } from '@/lib/ocr';
import { assignSpotToVehicle } from '@/lib/parking-logic';

export async function POST(request: Request) {
    try {
        // Parse JSON body
        const body = await request.json();
        const base64Image = body.image;

        if (!base64Image) {
            return NextResponse.json({ error: 'No image data received in JSON body.' }, { status: 400 });
        }

        // Decode Base64 to Buffer
        const buffer = Buffer.from(base64Image, 'base64');

        if (!buffer || buffer.length === 0) {
            return NextResponse.json({ error: 'Invalid start buffer.' }, { status: 400 });
        }

        // 1. Save File
        const timestamp = Date.now();
        const filename = `cam-${timestamp}.jpg`;
        const uploadDir = path.join(process.cwd(), 'public/cam-uploads');
        const filepath = path.join(uploadDir, filename);

        try {
            await writeFile(filepath, buffer);
            console.log(`[CAMERA] Image saved to ${filepath}`);
        } catch (saveError) {
            console.error('Failed to save image:', saveError);
            // Continue anyway? Or fail? Let's continue but warn.
        }

        // 2. Perform OCR
        console.log('[CAMERA] Starting OCR processing...');
        const detectedPlate = await detectLicensePlate(buffer);
        console.log(`[CAMERA] OCR Result: ${detectedPlate}`);

        if (!detectedPlate) {
            return NextResponse.json({
                success: false,
                message: 'No license plate detected in the image.',
                imagePath: `/cam-uploads/${filename}`
            }, { status: 422 });
        }

        // 3. Trigger Entry Logic
        const imagePath = `/cam-uploads/${filename}`;
        const result = await assignSpotToVehicle(detectedPlate, imagePath);

        if (!result.success) {
            const status = result.status || 400;
            return NextResponse.json(
                {
                    success: false,
                    message: result.message,
                    spotId: result.spotId,
                    carNumber: detectedPlate,
                    imagePath: `/cam-uploads/${filename}`
                },
                { status }
            );
        }

        // Success
        console.log(`[CAMERA] Vehicle ${detectedPlate} entry processed successfully.`);
        return NextResponse.json({
            success: true,
            message: result.message,
            spotId: result.spotId,
            carNumber: detectedPlate,
            startTime: result.startTime,
            userDisplayName: result.userDisplayName,
            imagePath: `/cam-uploads/${filename}`
        });

    } catch (error) {
        console.error('API Error (Hardware Camera):', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
