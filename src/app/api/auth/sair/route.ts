import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  await destroySession();
  return NextResponse.redirect(new URL('/', req.url), { status: 303 });
}

export async function GET(req: Request) {
  return POST(req);
}
