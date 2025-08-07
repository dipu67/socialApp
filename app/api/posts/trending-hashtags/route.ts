import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/db';
import { Posts } from '@/lib/db/post';

// GET /api/posts/trending-hashtags - Get trending hashtags
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const timeframe = searchParams.get('timeframe') || '7d'; // 1d, 7d, 30d, all
    
    // Calculate date threshold based on timeframe
    let dateThreshold = new Date();
    switch (timeframe) {
      case '1d':
        dateThreshold.setDate(dateThreshold.getDate() - 1);
        break;
      case '7d':
        dateThreshold.setDate(dateThreshold.getDate() - 7);
        break;
      case '30d':
        dateThreshold.setDate(dateThreshold.getDate() - 30);
        break;
      case 'all':
        dateThreshold = new Date(0); // Beginning of time
        break;
      default:
        dateThreshold.setDate(dateThreshold.getDate() - 7);
    }

    // Build aggregation pipeline to find trending hashtags
    const pipeline: any[] = [
      // Match published posts within timeframe
      {
        $match: {
          isDeleted: { $ne: true },
          isPublished: true,
          createdAt: { $gte: dateThreshold }
        }
      },
      // Extract hashtags from content and tags
      {
        $project: {
          hashtags: {
            $concatArrays: [
              // Extract hashtags from content using regex
              {
                $map: {
                  input: {
                    $regexFindAll: {
                      input: "$content",
                      regex: /#[a-zA-Z0-9_]+/g
                    }
                  },
                  as: "match",
                  in: {
                    $toLower: {
                      $substr: ["$$match.match", 1, -1] // Remove # and convert to lowercase
                    }
                  }
                }
              },
              // Include tags array (convert to lowercase)
              {
                $map: {
                  input: { $ifNull: ["$tags", []] },
                  as: "tag",
                  in: { $toLower: "$$tag" }
                }
              }
            ]
          },
          views: { $ifNull: ["$views", 0] },
          likes: { $size: { $ifNull: ["$likes", []] } },
          createdAt: 1
        }
      },
      // Unwind hashtags array
      {
        $unwind: "$hashtags"
      },
      // Filter out empty hashtags
      {
        $match: {
          hashtags: { $ne: "", $exists: true }
        }
      },
      // Group by hashtag and calculate metrics
      {
        $group: {
          _id: "$hashtags",
          count: { $sum: 1 },
          totalViews: { $sum: "$views" },
          totalLikes: { $sum: "$likes" },
          avgViews: { $avg: "$views" },
          avgLikes: { $avg: "$likes" },
          recentUse: { $max: "$createdAt" }
        }
      },
      // Calculate trending score (combination of frequency, engagement, and recency)
      {
        $addFields: {
          trendingScore: {
            $add: [
              { $multiply: ["$count", 2] }, // Frequency weight
              { $multiply: ["$totalViews", 0.01] }, // Views weight
              { $multiply: ["$totalLikes", 0.5] }, // Likes weight
              // Recency bonus (more recent = higher score)
              {
                $divide: [
                  { $subtract: [new Date(), "$recentUse"] },
                  86400000 // Convert to days and invert
                ]
              }
            ]
          }
        }
      },
      // Sort by trending score
      {
        $sort: { trendingScore: -1 }
      },
      // Limit results
      {
        $limit: limit
      },
      // Project final structure
      {
        $project: {
          hashtag: "$_id",
          count: 1,
          totalViews: 1,
          totalLikes: 1,
          avgViews: { $round: ["$avgViews", 1] },
          avgLikes: { $round: ["$avgLikes", 1] },
          trendingScore: { $round: ["$trendingScore", 2] },
          recentUse: 1,
          _id: 0
        }
      }
    ];

    const trendingHashtags = await Posts.aggregate(pipeline);

    // Get total unique hashtags count for additional context
    const totalHashtagsPipeline: any[] = [
      {
        $match: {
          isDeleted: { $ne: true },
          isPublished: true,
          createdAt: { $gte: dateThreshold }
        }
      },
      {
        $project: {
          hashtags: {
            $concatArrays: [
              {
                $map: {
                  input: {
                    $regexFindAll: {
                      input: "$content",
                      regex: /#[a-zA-Z0-9_]+/g
                    }
                  },
                  as: "match",
                  in: {
                    $toLower: {
                      $substr: ["$$match.match", 1, -1]
                    }
                  }
                }
              },
              {
                $map: {
                  input: { $ifNull: ["$tags", []] },
                  as: "tag",
                  in: { $toLower: "$$tag" }
                }
              }
            ]
          }
        }
      },
      {
        $unwind: "$hashtags"
      },
      {
        $match: {
          hashtags: { $ne: "", $exists: true }
        }
      },
      {
        $group: {
          _id: "$hashtags"
        }
      },
      {
        $count: "totalUniqueHashtags"
      }
    ];

    const totalHashtagsResult = await Posts.aggregate(totalHashtagsPipeline);
    const totalUniqueHashtags = totalHashtagsResult[0]?.totalUniqueHashtags || 0;

    return NextResponse.json({
      hashtags: trendingHashtags,
      metadata: {
        timeframe,
        limit,
        totalUniqueHashtags,
        dateThreshold,
        generatedAt: new Date()
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching trending hashtags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending hashtags' },
      { status: 500 }
    );
  }
}
