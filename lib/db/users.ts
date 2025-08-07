import mongoose from "mongoose";

export type User = {
  name: string;
  username?: string;
  email: string;
  password: string;
  image?: string;
  avatar?: string;
  coverImage?: string;
  posts?: mongoose.Types.ObjectId[];
  groups?: mongoose.Types.ObjectId[];
  chats?: mongoose.Types.ObjectId[];
  friends?: mongoose.Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
  chatId?: string;
  lastSeen?: Date;
  isOnline?: boolean;
  isTyping?: boolean;
  isBlocked?: boolean;
  isVerified?: boolean;
  verificationToken?: string;
  verificationExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  role?: "user" | "admin";
  bio?: string;
  phone?: string;
  address?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    github?: string;
  };
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    inApp?: boolean;
  };
  preferences?: {
    theme?: "light" | "dark";
    language?: string;
    timezone?: string;
    currency?: string;
    dateFormat?: string;
    timeFormat?: string;
  };
  settings?: {
    privacy?: {
      profileVisibility?: "public" | "private";
      lastSeen?: "everyone" | "contacts" | "nobody";
      readReceipts?: boolean;
    };
    security?: {
      twoFactorAuth?: boolean;
      loginAlerts?: boolean;
      sessionManagement?: boolean;
    };
  };
  messages?: {
    sender: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
  }[];
  media?: {
    profilePicture?: string;
    coverPhoto?: string;
    gallery?: string[];
  };
  customFields?: Record<string, any>;
  followers?: number;
  following?: number;
  followersArray?: mongoose.Types.ObjectId[];
  followingArray?: mongoose.Types.ObjectId[];
};

const userSchema = new mongoose.Schema<User>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    username: { type: String, unique: true, sparse: true },
    chatId: { type: String, unique: true, sparse: true },
    lastSeen: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false },
    isTyping: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, unique: true, sparse: true },
    verificationExpires: { type: Date },
    resetPasswordToken: { type: String, unique: true, sparse: true },
    resetPasswordExpires: { type: Date },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    avatar: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    bio: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    socialLinks: {
      facebook: { type: String, default: "" },
      twitter: { type: String, default: "" },
      instagram: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      github: { type: String, default: "" },
    },
    media: {
      profilePicture: { type: String, default: "" },
      coverPhoto: { type: String, default: "" },
      gallery: [{ type: String }],
    },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    followersArray: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    followingArray: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }],
    chats: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chat" }],
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export const Users = mongoose.models.User || mongoose.model("User", userSchema);
