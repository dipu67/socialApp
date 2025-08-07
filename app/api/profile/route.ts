import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";import { connectDB } from '@/lib/db/db';
import { Users } from '@/lib/db/users';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const body = await request.json();
    const { profileImage, coverImage } = body;

    // Find the user
    const user = await Users.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update the fields that are provided
    const updateData: any = {};
    if (profileImage !== undefined) {
      updateData.avatar = profileImage;
    }
    if (coverImage !== undefined) {
      updateData.coverImage = coverImage;
    }

    // Update the user
    const updatedUser = await Users.findByIdAndUpdate(
      user._id,
      updateData,
      { new: true, select: 'name email avatar coverImage' }
    );

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
