import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.ADMIN_SESSION_SECRET || 'default-secret-change-in-production-32ch'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/admin')) return NextResponse.next();
  if (pathname === '/admin/login') return NextResponse.next();

  const token = request.cookies.get('cvmsbci_admin_session')?.value;
  if (!token) {
    const login = new URL('/admin/login', request.url);
    login.searchParams.set('from', pathname);
    return NextResponse.redirect(login);
  }
  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    const login = new URL('/admin/login', request.url);
    login.searchParams.set('from', pathname);
    const res = NextResponse.redirect(login);
    res.cookies.delete('cvmsbci_admin_session');
    return res;
  }
}

export const config = {
  matcher: '/admin/:path*',
};
