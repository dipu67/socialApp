import { Metadata } from "next";

export const chatMetadata: Metadata = {
  title: "Chat - Real-time Messaging | ChatApp",
  description: "Engage in real-time conversations with friends and communities. Join chat rooms, send messages, and stay connected instantly.",
  openGraph: {
    title: "Chat - Real-time Messaging | ChatApp",
    description: "Engage in real-time conversations with friends and communities. Join chat rooms, send messages, and stay connected instantly.",
    type: "website",
    url: "https://chatapp.com/chat",
    images: [
      {
        url: "/og-chat.png",
        width: 1200,
        height: 630,
        alt: "ChatApp - Real-time Messaging",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chat - Real-time Messaging | ChatApp",
    description: "Engage in real-time conversations with friends and communities. Join chat rooms, send messages, and stay connected instantly.",
    images: ["/og-chat.png"],
  },
  keywords: ["chat", "messaging", "real-time", "conversation", "community", "instant messaging"],
};

export const feedMetadata: Metadata = {
  title: "Feed - Discover & Share | ChatApp",
  description: "Discover trending posts, share your thoughts, and connect with your community. Explore content from users worldwide.",
  openGraph: {
    title: "Feed - Discover & Share | ChatApp",
    description: "Discover trending posts, share your thoughts, and connect with your community. Explore content from users worldwide.",
    type: "website",
    url: "https://chatapp.com/feed",
    images: [
      {
        url: "/og-feed.png",
        width: 1200,
        height: 630,
        alt: "ChatApp - Social Feed",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Feed - Discover & Share | ChatApp",
    description: "Discover trending posts, share your thoughts, and connect with your community. Explore content from users worldwide.",
    images: ["/og-feed.png"],
  },
  keywords: ["social feed", "posts", "discover", "share", "community", "trending"],
};

export const profileMetadata: Metadata = {
  title: "Profile - Your Digital Identity | ChatApp",
  description: "Manage your profile, view your posts, and customize your presence on ChatApp. Connect with followers and showcase your content.",
  openGraph: {
    title: "Profile - Your Digital Identity | ChatApp",
    description: "Manage your profile, view your posts, and customize your presence on ChatApp. Connect with followers and showcase your content.",
    type: "profile",
    url: "https://chatapp.com/profile",
    images: [
      {
        url: "/og-profile.png",
        width: 1200,
        height: 630,
        alt: "ChatApp - User Profile",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Profile - Your Digital Identity | ChatApp",
    description: "Manage your profile, view your posts, and customize your presence on ChatApp. Connect with followers and showcase your content.",
    images: ["/og-profile.png"],
  },
  keywords: ["profile", "user", "posts", "followers", "identity", "social profile"],
};

export const exploreMetadata: Metadata = {
  title: "Explore - Find New Connections | ChatApp",
  description: "Explore new users, communities, and trending content. Discover interesting people and expand your network on ChatApp.",
  openGraph: {
    title: "Explore - Find New Connections | ChatApp",
    description: "Explore new users, communities, and trending content. Discover interesting people and expand your network on ChatApp.",
    type: "website",
    url: "https://chatapp.com/explore",
    images: [
      {
        url: "/og-explore.png",
        width: 1200,
        height: 630,
        alt: "ChatApp - Explore",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore - Find New Connections | ChatApp",
    description: "Explore new users, communities, and trending content. Discover interesting people and expand your network on ChatApp.",
    images: ["/og-explore.png"],
  },
  keywords: ["explore", "discover", "users", "communities", "network", "connections"],
};
