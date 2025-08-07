import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db/db';
import { Posts } from '@/lib/db/post';
import { Users } from '@/lib/db/users';
import mongoose from 'mongoose';

// GET comments for a post
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

    // Get post with populated comments
    const post = await Posts.findById(postId).populate({
      path: 'comments.user',
      select: 'name email avatar _id'
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Sort comments by creation date (newest first)
    const sortedComments = (post.comments || []).sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      comments: sortedComments,
      count: sortedComments.length
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST a new comment
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
    const postId = (await params).id;
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    // Find the user
    const user = await Users.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the post
    const post = await Posts.findById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Create new comment
    const newComment = {
      _id: new mongoose.Types.ObjectId(),
      user: user._id,
      content: content.trim(),
      createdAt: new Date()
    };

    // Add comment to post
    post.comments = post.comments || [];
    post.comments.push(newComment);
    
    await post.save();

    // Return the comment with populated user data
    await post.populate({
      path: 'comments.user',
      select: 'name email avatar _id'
    });

    // Find the newly added comment
    const addedComment = post.comments.find(
      (comment: any) => comment._id.toString() === newComment._id.toString()
    );

    return NextResponse.json({
      message: 'Comment added successfully',
      comment: addedComment,
      commentsCount: post.comments.length
    });

  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE a comment
export async function DELETE(
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
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(postId) || !mongoose.Types.ObjectId.isValid(commentId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    // Find the user
    const user = await Users.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the post and check if comment exists
    const post = await Posts.findById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const commentIndex = post.comments?.findIndex(
      (comment: any) => comment._id.toString() === commentId && comment.user.toString() === user._id.toString()
    );

    if (commentIndex === -1 || commentIndex === undefined) {
      return NextResponse.json({ error: 'Comment not found or unauthorized' }, { status: 404 });
    }

    // Remove comment
    post.comments?.splice(commentIndex, 1);
    await post.save();

    return NextResponse.json({
      message: 'Comment deleted successfully',
      commentsCount: post.comments?.length || 0
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
