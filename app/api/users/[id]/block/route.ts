import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db/db';
import { Users } from '@/lib/db/users';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const userToBlockId = (await params).id;
    const currentUserEmail = session.user.email;

    // Find current user
    const currentUser = await Users.findOne({ email: currentUserEmail });
    if (!currentUser) {
      return NextResponse.json({ error: 'Current user not found' }, { status: 404 });
    }

    // Find user to block
    const userToBlock = await Users.findById(userToBlockId);
    if (!userToBlock) {
      return NextResponse.json({ error: 'User to block not found' }, { status: 404 });
    }

    // Cannot block yourself
    if (currentUser._id.toString() === userToBlockId) {
      return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
    }

    // Initialize blockedUsers array if it doesn't exist
    if (!currentUser.blockedUsers) {
      currentUser.blockedUsers = [];
    }

    // Check if user is already blocked
    const isAlreadyBlocked = currentUser.blockedUsers.some(
      (blockedUserId: any) => blockedUserId.toString() === userToBlockId
    );

    if (isAlreadyBlocked) {
      return NextResponse.json({ error: 'User is already blocked' }, { status: 400 });
    }

    // Add user to blocked list
    currentUser.blockedUsers.push(userToBlockId);
    await currentUser.save();

    return NextResponse.json({
      message: 'User blocked successfully'
    });
  } catch (error) {
    console.error('Error blocking user:', error);
    return NextResponse.json({ error: 'Failed to block user' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const userToUnblockId = (await params).id;
    const currentUserEmail = session.user.email;

    // Find current user
    const currentUser = await Users.findOne({ email: currentUserEmail });
    if (!currentUser) {
      return NextResponse.json({ error: 'Current user not found' }, { status: 404 });
    }

    // Remove user from blocked list
    if (currentUser.blockedUsers) {
      currentUser.blockedUsers = currentUser.blockedUsers.filter(
        (blockedUserId: any) => blockedUserId.toString() !== userToUnblockId
      );
      await currentUser.save();
    }

    return NextResponse.json({
      message: 'User unblocked successfully'
    });
  } catch (error) {
    console.error('Error unblocking user:', error);
    return NextResponse.json({ error: 'Failed to unblock user' }, { status: 500 });
  }
}
