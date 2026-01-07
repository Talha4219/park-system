// This file is no longer needed as logic is handled directly with Firestore in the components.
// You can delete this file.
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json({ error: 'This endpoint is deprecated. Please use the Firestore directly.' }, { status: 410 });
}
