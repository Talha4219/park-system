import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from './mongodb';
import { UserProfile } from './types';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('CRITICAL: JWT_SECRET environment variable is required for authentication');
}

export function signToken(payload: any) {
    return jwt.sign(payload, JWT_SECRET as string, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
    try {
        return jwt.verify(token, JWT_SECRET as string);
    } catch (error) {
        return null;
    }
}

export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    const decoded = verifyToken(token) as any;
    if (!decoded || !decoded.uid) return null;

    return decoded;
}

export async function getUserFromSession() {
    const session = await getSession();
    if (!session) return null;

    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: new ObjectId(session.uid) });

    if (!user) return null;

    return {
        uid: user._id.toString(),
        displayName: user.displayName,
        email: user.email,
        carNumber: user.carNumber,
        role: user.role || 'user',
        ...user
    } as UserProfile;
}
