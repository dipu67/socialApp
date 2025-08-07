import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/db';
import { Users } from '@/lib/db/users';

// GET /api/username/check - Check username availability
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    
    // Validate username parameter
    if (!username) {
      return NextResponse.json(
        { 
          error: 'Username parameter is required',
          available: false,
          suggestions: []
        },
        { status: 400 }
      );
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        {
          error: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores',
          available: false,
          valid: false,
          suggestions: []
        },
        { status: 400 }
      );
    }

    // Check for reserved usernames
    const reservedUsernames = [
      'admin', 'administrator', 'root', 'system', 'user', 'test',
      'api', 'www', 'mail', 'support', 'help', 'info', 'contact',
      'about', 'privacy', 'terms', 'login', 'register', 'signup',
      'signin', 'logout', 'profile', 'settings', 'dashboard',
      'chat', 'message', 'messages', 'notification', 'notifications',
      'feed', 'explore', 'search', 'home', 'app', 'mobile',
      'web', 'email', 'username', 'password', 'null', 'undefined'
    ];

    if (reservedUsernames.includes(username.toLowerCase())) {
      return NextResponse.json(
        {
          error: 'This username is reserved and cannot be used',
          available: false,
          valid: false,
          reserved: true,
          suggestions: await generateUsernameSuggestions(username)
        },
        { status: 400 }
      );
    }

    // Check if username already exists (case-insensitive)
    const existingUser = await Users.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    }).select('username');

    const isAvailable = !existingUser;

    // Generate suggestions if username is not available
    let suggestions: string[] = [];
    if (!isAvailable) {
      suggestions = await generateUsernameSuggestions(username);
    }

    return NextResponse.json({
      username,
      available: isAvailable,
      valid: true,
      reserved: false,
      suggestions,
      message: isAvailable 
        ? 'Username is available!' 
        : 'Username is already taken'
    }, { status: 200 });

  } catch (error) {
    console.error('Error checking username availability:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check username availability',
        available: false,
        suggestions: []
      },
      { status: 500 }
    );
  }
}

// Helper function to generate username suggestions
async function generateUsernameSuggestions(baseUsername: string): Promise<string[]> {
  const suggestions: string[] = [];
  const maxSuggestions = 5;

  try {
    // Generate different variations
    const variations = [
      `${baseUsername}_`,
      `${baseUsername}123`,
      `${baseUsername}2024`,
      `${baseUsername}_user`,
      `the_${baseUsername}`,
      `${baseUsername}_official`,
      `${baseUsername}x`,
      `${baseUsername}_1`,
      `${baseUsername}_2`,
      `${baseUsername}_3`
    ];

    // Add random number variations
    for (let i = 0; i < 3; i++) {
      const randomNum = Math.floor(Math.random() * 999) + 1;
      variations.push(`${baseUsername}${randomNum}`);
    }

    // Check availability of variations
    for (const variation of variations) {
      if (suggestions.length >= maxSuggestions) break;
      
      // Validate the suggestion format
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(variation)) continue;

      // Check if this variation is available
      const existingUser = await Users.findOne({ 
        username: { $regex: new RegExp(`^${variation}$`, 'i') }
      }).select('username');

      if (!existingUser) {
        suggestions.push(variation);
      }
    }

    // If we still don't have enough suggestions, generate more random ones
    while (suggestions.length < maxSuggestions) {
      const randomSuffix = Math.floor(Math.random() * 9999) + 1;
      const randomSuggestion = `${baseUsername}${randomSuffix}`;
      
      if (randomSuggestion.length <= 20) {
        const existingUser = await Users.findOne({ 
          username: { $regex: new RegExp(`^${randomSuggestion}$`, 'i') }
        }).select('username');

        if (!existingUser && !suggestions.includes(randomSuggestion)) {
          suggestions.push(randomSuggestion);
        }
      }
    }

    return suggestions.slice(0, maxSuggestions);

  } catch (error) {
    console.error('Error generating username suggestions:', error);
    return [];
  }
}
