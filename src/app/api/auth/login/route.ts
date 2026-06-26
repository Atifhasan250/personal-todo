import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    if (username !== ADMIN_USER || password !== ADMIN_PASS) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const alg = 'HS256';

    const jwt = await new SignJWT({ 'urn:example:claim': true, username })
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setIssuer('todo:app')
      .setAudience('todo:admin')
      .setExpirationTime('15d') // 15 days expiration
      .sign(secret);

    const response = NextResponse.json({ success: true }, { status: 200 });

    // 15 days in seconds = 15 * 24 * 60 * 60 = 1296000
    response.cookies.set({
      name: 'auth_token',
      value: jwt,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1296000,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
