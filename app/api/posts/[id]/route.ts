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
    const postId = (await params).id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    // Get current user to check likes
    const currentUser = await Users.findOne({ email: session.user.email });
    
    // Get post with populated author
    const post = await Posts.findById(postId)
      .populate('author', 'name email _id')
      .populate('comments.user', 'name email avatar _id');

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if current user liked the post
    const isLiked = currentUser ? (post.likes?.some((likeId: any) => likeId.toString() === currentUser._id.toString()) || false) : false;

    // Format the post data
    const formattedPost = {
      ...post.toObject(),
      isLiked,
      isBookmarked: false // Add bookmark logic later
    };

    return NextResponse.json({ post: formattedPost });

  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
