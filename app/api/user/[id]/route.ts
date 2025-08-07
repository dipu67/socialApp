import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";import { connectDB } from "@/lib/db/db";
import { Users } from "@/lib/db/users";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = await params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    await connectDB();

    // Get current user to check if they're following this user
    const currentUser = await Users.findOne({ email: session.user.email });
    
    // Find the requested user
    const user = await Users.findById(userId).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if current user is following this user
    const isFollowing = currentUser?.followingArray?.some(
      (followingId: any) => followingId.toString() === userId.toString()
    ) || false;

    console.log('Follow check:', { 
      currentUserId: currentUser?._id, 
      targetUserId: userId, 
      followingArray: currentUser?.followingArray,
      isFollowing 
    }); // Debug log

    // Transform the user data to match the frontend interface
    const userProfile = {
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username || `@${user.name.toLowerCase().replace(/\s+/g, '')}`,
      bio: user.bio || '',
      avatar: user.avatar,
      coverImage: user.coverImage,
      phone: user.phone,
      address: user.address,
      socialLinks: user.socialLinks,
      followersCount: user.followers || 0,
      followingCount: user.following || 0,
      postsCount: user.postsCount || 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isFollowing: isFollowing
    };

    return NextResponse.json({ user: userProfile });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
