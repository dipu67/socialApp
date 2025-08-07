import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db/db';
import { Users } from '@/lib/db/users';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Quick return since we're using Socket.IO for real-time functionality
    // This endpoint is kept for backwards compatibility but returns immediately
    return NextResponse.json({
      notifications: [],
      timestamp: new Date().toISOString(),
      hasUpdates: false,
      message: 'Using Socket.IO for real-time functionality'
    });
    
  } catch (error) {
    console.error('Notifications polling error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
