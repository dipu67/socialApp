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

    console.log('📝 Post creation request body:', { title, content, image, tags, category });

    // Content is required unless there's an image
    if ((!content || content.trim().length === 0) && (!image || image.trim().length === 0)) {
      console.log('❌ Content and image validation failed:', { content, image });
      return NextResponse.json(
        { error: 'Either content or image is required' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await Users.findOne({ email: session.user.email });
    console.log('👤 User lookup result:', { email: session.user.email, userFound: !!user });
    
    if (!user) {
      console.log('❌ User not found in database');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create the post
    const newPost = new Posts({
      title: title || (image ? 'Image Post' : 'Untitled'),
      content: content && content.trim() ? content.trim() : (image ? '' : 'No content'),
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
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    // More specific error handling
    if (error instanceof Error) {
      // Handle database errors
      if (error.message.includes('validation') || error.message.includes('required')) {
        console.log('❌ Validation error:', error.message);
        return NextResponse.json({ error: 'Invalid post data. Please check your input.' }, { status: 400 });
      }
      
      // Handle auth errors
      if (error.message.includes('User not found')) {
        console.log('❌ Auth error:', error.message);
        return NextResponse.json({ error: 'User not found. Please log in again.' }, { status: 404 });
      }
      
      // Handle connection errors
      if (error.message.includes('Connection') || error.message.includes('Network')) {
        console.log('❌ Connection error:', error.message);
        return NextResponse.json({ error: 'Database connection error. Please try again.' }, { status: 503 });
      }
      
      console.log('❌ Generic error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    console.log('❌ Unknown error type');
    return NextResponse.json(
      { error: 'Failed to create post. Please try again.' },
      { status: 500 }
    );
  }
}
