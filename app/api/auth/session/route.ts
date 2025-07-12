import { NextRequest, NextResponse } from 'next/server';
import {auth} from '@/lib/auth'; // Adjust the import path as necessary
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get the session using getSession
    const data = await auth.api.getSession({
        headers: await headers(),
    });

    if (!data || !data.session || !data.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check session expiration
    const expiresAt = new Date(data.session.expiresAt).getTime();
    const currentTime = Date.now();
    const isSessionValid = expiresAt > currentTime;

    if (!isSessionValid) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        image: data.user.image,
      },
      session: {
        id: data.session.id,
        expiresAt: data.session.expiresAt,
      }
    });

  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
