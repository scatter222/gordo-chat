import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Add custom middleware logic here if needed
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Protect /dashboard routes
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          return !!token;
        }
        // Protect /api routes except auth
        if (req.nextUrl.pathname.startsWith('/api') &&
            !req.nextUrl.pathname.startsWith('/api/auth')) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
    '/((?!auth|_next/static|_next/image|favicon.ico).*)',
  ],
};