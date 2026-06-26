import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Define which routes to protect or allow
const PUBLIC_FILE = /\.(.*)$/;
const PUBLIC_ROUTES = ['/login', '/api/auth/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to public files (like images, css, manifest, sw.js) and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('/api/auth/') || // Let auth routes pass, specific protection is in the route
    PUBLIC_FILE.test(pathname)
  ) {
    // Exception: block direct access to internal API routes except auth if they don't have token
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
        // Handled below
    } else {
        return NextResponse.next();
    }
  }

  // Allow access to public routes without token
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    // If it's an API route, return 401
    if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Otherwise redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    // Verify the JWT token
    await jwtVerify(token, secret);
    
    // Valid token, allow access
    return NextResponse.next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    
    // Clear the invalid cookie and redirect
    const response = pathname.startsWith('/api/') 
      ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) 
      : NextResponse.redirect(new URL('/login', request.url));
      
    response.cookies.delete('auth_token');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.png, icon.svg, etc. (handled by regex in code)
     */
    '/((?!_next/static|_next/image).*)',
  ],
};
