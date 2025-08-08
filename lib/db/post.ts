import mongoose from "mongoose";

export type Post = {
  title: string;
  content?: string;
  author: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  likes?: mongoose.Types.ObjectId[];
  comments?: {
    user: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
  }[];
  isPublished?: boolean;
  isFeatured?: boolean;
  image?: string;
  category?: string;
  views?: number;
  reactions?: {
    like: mongoose.Types.ObjectId[];
    love: mongoose.Types.ObjectId[];
    wow: mongoose.Types.ObjectId[];
    sad: mongoose.Types.ObjectId[];
    angry: mongoose.Types.ObjectId[];
  };
    metadata?: {
        description?: string;
        keywords?: string[];
        canonicalUrl?: string;
        ogImage?: string;
        twitterImage?: string;
    };

    authorDetails?: {
        id: mongoose.Types.ObjectId;
        name: string;
        avatar: string;
    };
    isArchived?: boolean;
    archivedAt?: Date;
    isDraft?: boolean;
    draftVersion?: number;
    scheduledAt?: Date;
    publishedAt?: Date;
    isPinned?: boolean;
    pinOrder?: number;
    isSponsored?: boolean;
    sponsorshipDetails?: {
        sponsor: mongoose.Types.ObjectId;
        amount: number;
        currency: string;
        startDate: Date;
        endDate: Date;
    };
    isNSFW?: boolean;
    nsfwReason?: string;
    isLocked?: boolean;
    lockReason?: string;
    isDeleted?: boolean;
    deletedAt?: Date;
    deletedBy?: mongoose.Types.ObjectId;
    isReported?: boolean;
    reportDetails?: {
        reportedBy: mongoose.Types.ObjectId;
        reason: string;
        createdAt: Date;
        status: 'pending' | 'resolved' | 'rejected';
    };
    isShared?: boolean;
    sharedWith?: mongoose.Types.ObjectId[];
    shareCount?: number;
    isBookmarked?: boolean;
    bookmarkCount?: number;
    isSubscribed?: boolean;
    subscriptionDetails?: {
        user: mongoose.Types.ObjectId;
        startDate: Date;
        endDate: Date;
        isActive: boolean;
    };

};

const postSchema = new mongoose.Schema<Post>(
{
    title: { type: String, required: true },
    content: { type: String, required: false, default: '' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    tags: [{ type: String }],
    likes: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
    comments: [
        {
            user: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
            content: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        }
    ],
    isPublished: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    image: { type: String, default: '' },
    category: { type: String, default: '' },
    views: { type: Number, default: 0 },
    reactions: {
        like: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
        love: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
        wow: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
        sad: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
        angry: [{ type: mongoose.Types.ObjectId, ref: 'User' }]
    },
    metadata: {
        description: { type: String },
        keywords: [{ type: String }],
        canonicalUrl: { type: String },
        ogImage: { type: String },
        twitterImage: { type: String }
    },
    authorDetails: {
        id: { type: mongoose.Types.ObjectId, ref: 'User' },
        name: { type: String },
        avatar: { type: String }
    },
    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date },
    isDraft: { type: Boolean, default: false },
    draftVersion: { type: Number, default: 1 },
    scheduledAt: { type: Date },
    publishedAt: { type: Date },
    isPinned: { type: Boolean, default: false },
    pinOrder: { type: Number, default: 0 },
    isSponsored: { type: Boolean, default: false },
    sponsorshipDetails: {
        sponsor: { type: mongoose.Types.ObjectId, ref: 'User' },
        amount: { type: Number, default: 0 },
        currency: { type: String, default: 'USD' },
        startDate: { type: Date },
        endDate: { type: Date }
    },
    isNSFW: { type: Boolean, default: false },
    nsfwReason: { type: String, default: '' },
    isLocked: { type: Boolean, default: false },
    lockReason: { type: String, default: '' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Types.ObjectId, ref: 'User' },
    isReported: { type: Boolean, default: false },
    reportDetails: {
        reportedBy: { type: mongoose.Types.ObjectId, ref: 'User' },
        reason: { type: String },
        createdAt: { type: Date, default: Date.now },
        status: { type: String, enum: ['pending', 'resolved', 'rejected'], default: 'pending' }
    },
    isShared: { type: Boolean, default: false },
    sharedWith: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
    shareCount: { type: Number, default: 0 },
    isBookmarked: { type: Boolean, default: false },
    bookmarkCount: { type: Number, default: 0 },
    isSubscribed: { type: Boolean, default: false },
    subscriptionDetails: {
        user: { type: mongoose.Types.ObjectId, ref: 'User' },
        startDate: { type: Date },
        endDate: { type: Date },
        isActive: { type: Boolean, default: true }
    }
});

const Posts = mongoose.models.Post || mongoose.model<Post>('Post', postSchema);

export { Posts };
