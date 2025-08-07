import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";import { connectDB } from '@/lib/db/db';
import { Users } from '@/lib/db/users';
import mongoose from 'mongoose';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id: targetUserId } = await params;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Get current user
    const currentUser = await Users.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: 'Current user not found' }, { status: 404 });
    }

    // Get target user
    const targetUser = await Users.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Can't follow yourself
    if (currentUser._id.toString() === targetUserId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Check if already following
    const isFollowing = targetUser.followersArray?.some(
      (followerId: any) => followerId.toString() === currentUser._id.toString()
    ) || false;
    
    if (isFollowing) {
      // Unfollow
      await Users.findByIdAndUpdate(targetUserId, {
        $pull: { followersArray: currentUser._id },
        $inc: { followers: -1 }
      });
      await Users.findByIdAndUpdate(currentUser._id, {
        $pull: { followingArray: new mongoose.Types.ObjectId(targetUserId) },
        $inc: { following: -1 }
      });
    } else {
      // Follow
      await Users.findByIdAndUpdate(targetUserId, {
        $addToSet: { followersArray: currentUser._id },
        $inc: { followers: 1 }
      });
      await Users.findByIdAndUpdate(currentUser._id, {
        $addToSet: { followingArray: new mongoose.Types.ObjectId(targetUserId) },
        $inc: { following: 1 }
      });
    }

    // Get updated follower count
    const updatedTargetUser = await Users.findById(targetUserId);
    
    return NextResponse.json({
      message: isFollowing ? 'Unfollowed user' : 'Followed user',
      isFollowing: !isFollowing,
      followersCount: updatedTargetUser?.followers || 0
    });

  } catch (error) {
    console.error('Error toggling follow:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
