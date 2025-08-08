import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db/db';
import { Users } from '@/lib/db/users';
import { deleteImageByUrl, isMinioUrl } from '@/lib/storage-utils';
import { BUCKETS } from '@/lib/storage';
// Firebase utilities removed - using MinIO now

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    
    const user = await Users.findOne({ email: session.user.email }).select('-password');
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Transform the user data to match the frontend interface
    const userProfile = {
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username || `@${user.name.toLowerCase().replace(/\s+/g, '')}`,
      bio: user.bio || '',
      phone: user.phone || '',
      address: user.address || '',
      avatar: user.avatar || user.media?.profilePicture || '',
      coverImage: user.coverImage || user.media?.coverPhoto || '',
      socialLinks: user.socialLinks || {
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: '',
        github: '',
      },
      followers: user.followers || 0,
      following: user.following || 0,
      posts: user.posts?.length || 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json({ user: userProfile });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      username,
      bio,
      phone,
      address,
      socialLinks,
      avatar,
      coverImage,
    } = body;

    await connectDB();
    
    // First, get the current user data to check for existing images
    const currentUser = await Users.findOne({ email: session.user.email }).select('-password');
    
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: any = {};
    
    if (name) updateData.name = name;
    if (username) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (socialLinks) updateData.socialLinks = socialLinks;
    
    // Handle avatar update with deletion of previous image
    if (avatar !== undefined) {
      // Delete previous avatar if it exists and is different from the new one
      const currentAvatar = currentUser.avatar || currentUser.media?.profilePicture;
      
      console.log('🔍 Avatar update check:');
      console.log('  - Current avatar:', currentAvatar);
      console.log('  - New avatar:', avatar);
      
      // Delete old avatar from MinIO if needed
      if (currentAvatar && currentAvatar !== avatar && isMinioUrl(currentAvatar)) {
        console.log('🗑️ Old avatar would be deleted:', currentAvatar);
        try {
          await deleteImageByUrl(currentAvatar, BUCKETS.PROFILES);
          console.log('✅ Avatar deletion completed successfully');
        } catch (error) {
          console.error('❌ Failed to delete previous avatar:', error);
          // Continue with update even if deletion fails
        }
      } else {
        console.log('ℹ️ No previous avatar to delete or same URL');
      }
      
      updateData.avatar = avatar;
      updateData['media.profilePicture'] = avatar;
    }
    
    // Handle cover image update with deletion of previous image
    if (coverImage !== undefined) {
      // Delete previous cover image if it exists and is different from the new one
      const currentCoverImage = currentUser.coverImage || currentUser.media?.coverPhoto;
      
      console.log('🔍 Cover image update check:');
      console.log('  - Current cover:', currentCoverImage);
      console.log('  - New cover:', coverImage);
      
      // Delete old cover image from MinIO if needed
      if (currentCoverImage && currentCoverImage !== coverImage && isMinioUrl(currentCoverImage)) {
        console.log('🗑️ Old cover image would be deleted:', currentCoverImage);
        try {
          await deleteImageByUrl(currentCoverImage, BUCKETS.COVERS);
          console.log('✅ Cover image deletion completed successfully');
        } catch (error) {
          console.error('❌ Failed to delete previous cover image:', error);
          // Continue with update even if deletion fails
        }
      } else {
        console.log('ℹ️ No previous cover image to delete or same URL');
      }
      
      updateData.coverImage = coverImage;
      updateData['media.coverPhoto'] = coverImage;
    }

    const user = await Users.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Transform the updated user data
    const userProfile = {
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username || `@${user.name.toLowerCase().replace(/\s+/g, '')}`,
      bio: user.bio || '',
      phone: user.phone || '',
      address: user.address || '',
      avatar: user.avatar || user.media?.profilePicture || '',
      coverImage: user.coverImage || user.media?.coverPhoto || '',
      socialLinks: user.socialLinks || {
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: '',
        github: '',
      },
      followers: user.followers || 0,
      following: user.following || 0,
      posts: user.posts?.length || 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json({ 
      message: "Profile updated successfully",
      user: userProfile 
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
