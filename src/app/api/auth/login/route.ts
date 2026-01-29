
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { signToken } from '@/lib/auth-jwt';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {

    const body = await request.json();
    const { identification: rawId, password, email, carNumber } = body;

    const identification = (rawId || email || carNumber)?.trim();

    if (!identification || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }
    const db = await getDb();

    // Search by email (lowercase) OR car number (uppercase)
    const user = await db.collection('users').findOne({
      $or: [
        { email: identification.toLowerCase() },
        { carNumber: identification.toUpperCase() }
      ]
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = signToken({ uid: user._id.toString(), email: user.email });

    (await cookies()).set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365 // 1 year
    });

    return NextResponse.json({
      success: true,
      user: {
        uid: user._id.toString(),
        displayName: user.displayName,
        email: user.email,
        carNumber: user.carNumber
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
