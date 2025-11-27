import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Set a test cookie
  const response = NextResponse.json({ message: 'Test cookie set' });
  response.cookies.set('test_cookie', 'test_value', {
    httpOnly: false, // Make it visible in browser for testing
    secure: false,
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
    path: '/',
  });
  
  // Also read existing cookies
  const allCookies = request.cookies.getAll();
  
  return NextResponse.json({
    message: 'Test cookie set',
    cookiesReceived: allCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
  });
}

