import mongoose from "mongoose";

export type Chat = {
  _id: string;
  participants: mongoose.Types.ObjectId[];
  isGroupChat: boolean;
  groupName?: string;
  groupAvatar?: string;
  groupDescription?: string;
  admin?: mongoose.Types.ObjectId;
  moderators?: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
  isArchived?: boolean;
  archivedAt?: Date;
  isPinned?: boolean;
  pinOrder?: number;
};

export type Message = {
  _id: string;
  chatId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content?: string;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'file' | 'emoji';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isEdited: boolean;
  replyTo?: mongoose.Types.ObjectId;
  reactions: {
    emoji: string;
    users: mongoose.Types.ObjectId[];
  }[];
  readBy: {
    userId: mongoose.Types.ObjectId;
    readAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
};

const chatSchema = new mongoose.Schema<Chat>(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    isGroupChat: { type: Boolean, default: false },
    groupName: { type: String },
    groupAvatar: { type: String },
    groupDescription: { type: String },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    lastActivity: { type: Date, default: Date.now },
    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date },
    isPinned: { type: Boolean, default: false },
    pinOrder: { type: Number }
  },
  { timestamps: true }
);

const messageSchema = new mongoose.Schema<Message>(
  {
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String },
    messageType: { 
      type: String, 
      enum: ['text', 'image', 'video', 'audio', 'file', 'emoji'], 
      default: 'text' 
    },
    fileUrl: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    isEdited: { type: Boolean, default: false },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    reactions: [{
      emoji: String,
      users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
    }],
    readBy: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      readAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

// Indexes for better performance
chatSchema.index({ participants: 1, lastActivity: -1 });
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });

export const Chats = mongoose.models.Chat || mongoose.model<Chat>("Chat", chatSchema);
export const Messages = mongoose.models.Message || mongoose.model<Message>("Message", messageSchema);


