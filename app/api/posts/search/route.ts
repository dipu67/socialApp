import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/db';
import { Posts } from '@/lib/db/post';

// GET /api/posts/search - Search posts
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const category = searchParams.get('category');
    const tags = searchParams.get('tags');
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters long' },
        { status: 400 }
      );
    }

    // Build search filter
    const searchFilter: any = {
      isDeleted: { $ne: true },
      isPublished: true,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    };

    // Add category filter if provided
    if (category) {
      searchFilter.category = { $regex: category, $options: 'i' };
    }

    // Add tags filter if provided
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      searchFilter.tags = { $in: tagArray.map(tag => new RegExp(tag, 'i')) };
    }

    const skip = (page - 1) * limit;

    // Execute search
    const [posts, totalCount] = await Promise.all([
      Posts.find(searchFilter)
        .populate('author', 'name email _id avatar')
        .sort({ 
          // Prioritize by relevance (title matches first, then content)
          createdAt: -1 
        })
        .skip(skip)
        .limit(limit)
        .lean(),
      Posts.countDocuments(searchFilter)
    ]);

    // Calculate relevance score for better sorting
    const postsWithScore = posts.map(post => {
      let score = 0;
      const queryLower = query.toLowerCase();
      
      // Title match gets highest score
      if (post.title?.toLowerCase().includes(queryLower)) {
        score += 10;
      }
      
      // Exact title match gets even higher score
      if (post.title?.toLowerCase() === queryLower) {
        score += 20;
      }
      
      // Content match gets medium score
      if (post.content?.toLowerCase().includes(queryLower)) {
        score += 5;
      }
      
      // Tag match gets medium score
      if (post.tags?.some((tag: string) => tag.toLowerCase().includes(queryLower))) {
        score += 7;
      }
      
      return { ...post, relevanceScore: score };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);

    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages;

    return NextResponse.json({
      posts: postsWithScore,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasMore,
        limit
      },
      searchQuery: query,
      filters: {
        category,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : null
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error searching posts:', error);
    return NextResponse.json(
      { error: 'Failed to search posts' },
      { status: 500 }
    );
  }
}
