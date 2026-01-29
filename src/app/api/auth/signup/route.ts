
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { signToken } from '@/lib/auth-jwt';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email: rawEmail, password, displayName, carNumber: rawCarNumber, ...rest } = body;

    // Normalize inputs
    const email = rawEmail?.toLowerCase().trim();
    const carNumber = rawCarNumber?.toUpperCase().trim();

    if (!email || !password || !displayName || !carNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await getDb();
    const existingUser = await db.collection('users').findOne({
      $or: [{ email }, { carNumber }]
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email or car number already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      email,
      password: hashedPassword,
      displayName,
      carNumber,
      role: 'user',
      createdAt: new Date(),
      ...rest
    };

    const result = await db.collection('users').insertOne(newUser);
    const userId = result.insertedId.toString();

    const token = signToken({ uid: userId, email });

    (await cookies()).set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365 // 1 year
    });

    return NextResponse.json({ success: true, user: { uid: userId, email, displayName, carNumber } });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
