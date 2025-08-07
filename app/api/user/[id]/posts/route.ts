import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";import { connectDB } from '@/lib/db/db';
import { Posts } from '@/lib/db/post';
import { Users } from '@/lib/db/users';
import mongoose from 'mongoose';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const userId = (await params).id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Get current user to check likes
    const currentUser = await Users.findOne({ email: session.user.email });
    
    // Get posts by this user
    const posts = await Posts.find({ 
      author: new mongoose.Types.ObjectId(userId),
      isDeleted: { $ne: true },
      isPublished: true 
    })
    .populate('author', 'name email _id')
    .sort({ createdAt: -1 })
    .limit(50);

    // Process posts to add isLiked flags
    const processedPosts = posts.map((post: any) => ({
      ...post.toObject(),
      isLiked: currentUser ? (post.likes?.some((likeId: any) => likeId.toString() === currentUser._id.toString()) || false) : false,
      isBookmarked: false // Add bookmark logic later
    }));

    return NextResponse.json({ posts: processedPosts });

  } catch (error) {
    console.error('Error fetching user posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
