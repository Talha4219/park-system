
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value;
    const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');
    const isUserDashboard = request.nextUrl.pathname.startsWith('/user');

    if ((isDashboard || isUserDashboard) && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    const isAuthPage = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup';
    if (isAuthPage && token) {
        // Redirection logic if already logged in will be handled by client for now
        // to avoid complexity of decoding token here, but we can redirect to root.
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/user/:path*', '/login', '/signup'],
};
