import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { UserProfile } from './types';

const TOKEN_NAME = 'parksmart_session';

type SessionPayload = Pick<UserProfile, 'uid' | 'role'>;

const getAuthSecret = () => {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('Missing AUTH_SECRET environment variable');
  }
  return secret;
};

export const hashPassword = async (password: string) => bcrypt.hash(password, 10);

export const verifyPassword = async (password: string, hash: string) =>
  bcrypt.compare(password, hash);

export const createSessionToken = (payload: SessionPayload) =>
  jwt.sign(payload, getAuthSecret(), { expiresIn: '365d' });

export const verifySessionToken = (token: string): SessionPayload =>
  jwt.verify(token, getAuthSecret()) as SessionPayload;

export const readSession = (): SessionPayload | null => {
  const token = cookies().get(TOKEN_NAME)?.value;
  if (!token) return null;
  try {
    return verifySessionToken(token);
  } catch (error) {
    console.error('Session verification failed', error);
    return null;
  }
};

export const setSessionCookie = (response: NextResponse, token: string) => {
  response.cookies.set({
    name: TOKEN_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
};

export const clearSessionCookie = (response: NextResponse) => {
  response.cookies.set({
    name: TOKEN_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
  });
};


