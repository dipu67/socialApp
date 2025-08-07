import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";
import { connectDB } from '@/lib/db/db';
import { Posts } from '@/lib/db/post';
import { Users } from '@/lib/db/users';
import mongoose from 'mongoose';

// POST /api/posts/[id]/like - Toggle like on a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;

    // Find the user
    const user = await Users.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find the post
    const post = await Posts.findById(id);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user has already liked the post
    const hasLiked = post.likes?.includes(user._id);

    if (hasLiked) {
      // Remove like
      post.likes = post.likes?.filter(
        (like: mongoose.Types.ObjectId) => like.toString() !== user._id.toString()
      ) || [];
      
      // Also remove from reactions.like if it exists
      if (post.reactions?.like) {
        post.reactions.like = post.reactions.like.filter(
          (like: mongoose.Types.ObjectId) => like.toString() !== user._id.toString()
        );
      }
    } else {
      // Add like
      if (!post.likes) post.likes = [];
      post.likes.push(user._id);
      
      // Also add to reactions.like
      if (!post.reactions) {
        post.reactions = { like: [], love: [], wow: [], sad: [], angry: [] };
      }
      if (!post.reactions.like) post.reactions.like = [];
      post.reactions.like.push(user._id);
    }

    await post.save();

    return NextResponse.json({ 
      message: hasLiked ? 'Post unliked' : 'Post liked',
      isLiked: !hasLiked,
      likesCount: post.likes?.length || 0
    }, { status: 200 });

  } catch (error) {
    console.error('Error toggling post like:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}
