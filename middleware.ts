import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const { token } = req.nextauth;

    // Redirect authenticated users away from auth pages
    if (token && (pathname === '/login' || pathname === '/register' || pathname === '/')) {
      return NextResponse.redirect(new URL('/feed', req.url));
    }

    // Redirect unauthenticated users to login from protected routes
    if (!token && (
      pathname.startsWith('/feed') ||
      pathname.startsWith('/post') ||
      pathname.startsWith('/profile') ||
      pathname.startsWith('/chat') ||
      pathname.startsWith('/explore') ||
      pathname.startsWith('/settings')
    )) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow access to public routes
        if (pathname === '/' || pathname === '/login' || pathname === '/register') {
          return true;
        }
        
        // Require token for protected routes
        if (
          pathname.startsWith('/feed') ||
          pathname.startsWith('/post') ||
          pathname.startsWith('/profile') ||
          pathname.startsWith('/chat') ||
          pathname.startsWith('/explore') ||
          pathname.startsWith('/settings')
        ) {
          return !!token;
        }
        
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
