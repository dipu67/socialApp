import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";
import { connectDB } from '@/lib/db/db';
import mongoose from 'mongoose';

// Post View Schema
const PostViewSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Post' },
  viewIdentifier: { type: String, required: true }, // userEmail or IP
  userEmail: { type: String },
  ipAddress: { type: String },
  viewedAt: { type: Date, default: Date.now },
  userAgent: { type: String }
});

const PostView = mongoose.models.PostView || mongoose.model('PostView', PostViewSchema);

// Post Schema (if not already defined)
const PostSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  image: { type: String },
  views: { type: Number, default: 0 },
  lastViewedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const postId = (
        
        
        await params).id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    // Check if the post exists
    const post = await Post.findById(postId);
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Get user's IP address for anonymous view tracking
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    
    const userEmail = session.user?.email;
    const viewIdentifier = userEmail || ip;

    // Check if this user/IP has already viewed this post recently (within 24 hours)
    const existingView = await PostView.findOne({
      postId: new mongoose.Types.ObjectId(postId),
      viewIdentifier: viewIdentifier,
      viewedAt: { 
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
      }
    });

    if (existingView) {
      // User has already viewed this post recently, don't count as new view
      return NextResponse.json({ 
        message: 'View already counted',
        viewCounted: false,
        views: post.views || 0
      });
    }

    // Record the view
    await PostView.create({
      postId: new mongoose.Types.ObjectId(postId),
      viewIdentifier: viewIdentifier,
      userEmail: userEmail,
      ipAddress: ip,
      viewedAt: new Date(),
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    // Increment the view count on the post
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { 
        $inc: { views: 1 },
        $set: { lastViewedAt: new Date() }
      },
      { new: true }
    );

    if (!updatedPost) {
      return NextResponse.json({ error: 'Failed to update view count' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'View counted successfully',
      viewCounted: true,
      views: updatedPost.views || 1
    });

  } catch (error) {
    console.error('Error tracking post view:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Optional: GET endpoint to retrieve view analytics
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const postId = (await params).id;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    // Get post views analytics
    const [post, viewsCount, uniqueViewers, recentViews] = await Promise.all([
      // Get post basic info
      Post.findById(postId),
      
      // Total views count
      PostView.countDocuments({ postId: new mongoose.Types.ObjectId(postId) }),
      
      // Unique viewers count
      PostView.distinct('viewIdentifier', { postId: new mongoose.Types.ObjectId(postId) }),
      
      // Recent views (last 7 days)
      PostView.countDocuments({
        postId: new mongoose.Types.ObjectId(postId),
        viewedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    ]);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({
      postId: postId,
      totalViews: viewsCount,
      uniqueViewers: uniqueViewers.length,
      recentViews: recentViews,
      postViews: post.views || 0
    });

  } catch (error) {
    console.error('Error getting post view analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
