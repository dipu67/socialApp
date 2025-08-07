import { NextRequest, NextResponse } from 'next/server';
import { fixDatabaseIndexes } from '@/scripts/fix-database-indexes';

export async function POST(request: NextRequest) {
  try {
    // Add some basic protection - you might want to add authentication here
    const { authorization } = Object.fromEntries(request.headers.entries());
    
    // Simple protection - only allow if specific header is provided
    if (authorization !== 'Bearer fix-database-indexes') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔧 Database index fix requested...');
    
    await fixDatabaseIndexes();
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Database indexes fixed successfully' 
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('❌ Database fix API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database fix failed',
        details: error?.message || error
      },
      { status: 500 }
    );
  }
}
