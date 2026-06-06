import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * Runs before every request. With Clerk keys present it protects the app pages
 * (redirecting signed-out users to sign-in). Without keys (preview/dev-bypass
 * mode) it lets everything through so you can view the UI.
 */
const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const isProtected = createRouteMatcher([
  '/get-started(.*)',
  '/welcome(.*)',
  '/dashboard(.*)',
  '/service-desk(.*)',
  '/assistant(.*)',
  '/sales(.*)',
  '/social(.*)',
  '/customer-support(.*)',
  '/finance(.*)',
  '/finance-analysis(.*)',
  '/marketing(.*)',
]);

export default hasClerk
  ? clerkMiddleware(async (auth, req) => {
      if (isProtected(req)) await auth.protect();
    })
  : () => NextResponse.next();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|gif|png|svg|ico|webp|woff2?)).*)',
    '/(api|trpc)(.*)',
  ],
};
