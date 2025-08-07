import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db/db';
import { Posts } from '@/lib/db/post';
import { Users } from '@/lib/db/users';

// GET /api/posts - Fetch all posts
export async function GET() {
  try {
    await connectDB();
    
    const posts = await Posts.find({ 
      isDeleted: { $ne: true },
      isPublished: true 
    })
    .populate('author', 'name email _id')
    .sort({ createdAt: -1 })
    .limit(50);

    return NextResponse.json({ posts }, { status: 200 });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
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
    const { title, content, image, tags, category } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await Users.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create the post
    const newPost = new Posts({
      title: title || 'Untitled',
      content: content.trim(),
      author: user._id,
      image: image || '',
      tags: tags || [],
      category: category || 'general',
      authorDetails: {
        id: user._id,
        name: user.name,
        avatar: user.avatar || `https://avatar.vercel.sh/${user.email}`
      },
      publishedAt: new Date(),
      isPublished: true,
      views: 0,
      likes: [],
      comments: [],
      reactions: {
        like: [],
        love: [],
        wow: [],
        sad: [],
        angry: []
      }
    });

    const savedPost = await newPost.save();
    
    // Populate the author details for response
    await savedPost.populate('author', 'name email _id');

    return NextResponse.json({ 
      message: 'Post created successfully',
      post: savedPost 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
