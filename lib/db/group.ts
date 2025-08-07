import mongoose from "mongoose";

export type Group = {
    name: string;
    description?: string;
    members: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
    admin: mongoose.Types.ObjectId;
    image?: string;
    isPublic?: boolean;
    isArchived?: boolean;
    archivedAt?: Date;
    isPinned?: boolean;
    pinOrder?: number;
    lastMessage?: {
        sender: mongoose.Types.ObjectId;
        content: string;
        createdAt: Date;
    };
    messages?: {
        sender: mongoose.Types.ObjectId;
        content: string;
        createdAt: Date;
    }[];
    notifications?: {
        email?: boolean;
        push?: boolean;
        inApp?: boolean;
    };
    settings?: {
        privacy?: {
            groupVisibility?: 'public' | 'private';
            lastSeen?: 'everyone' | 'contacts' | 'nobody';
            readReceipts?: boolean;
        };
        security?: {
            twoFactorAuth?: boolean;
            loginAlerts?: boolean;
            sessionManagement?: boolean;
        };
    };
    metadata?: {
        description?: string;
        keywords?: string[];
        canonicalUrl?: string;
        ogImage?: string;
        twitterImage?: string;
    };
    isNSFW?: boolean;
    nsfwReason?: string;
    isLocked?: boolean;
    lockReason?: string;
};

const groupSchema = new mongoose.Schema<Group>(
    {
        name: { type: String, required: true },
        description: { type: String, default: '' },
        members: [{ type: mongoose.Types.ObjectId, ref: 'User', required: true }],
        admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        image: { type: String, default: '' },
        isPublic: { type: Boolean, default: true },
        isArchived: { type: Boolean, default: false },
        archivedAt: { type: Date },
        isPinned: { type: Boolean, default: false },
        pinOrder: { type: Number, default: 0 },
        lastMessage: {
            sender: { type: mongoose.Types.ObjectId, ref: 'User' },
            content: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        },
        messages: [{
            sender: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
            content: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        }],
        notifications: {
            email: { type: Boolean, default: true },
            push : { type : Boolean , default : true},
            inApp : {type : Boolean , default : true}
        },
        settings : {
            privacy : {
                groupVisibility : {type : String , enum : ['public' , 'private'] , default : 'public'},
                lastSeen : {type : String , enum : ['everyone' , 'contacts' , 'nobody'] , default : 'everyone'},
                readReceipts : {type : Boolean , default : true}
            },
            security : {
                twoFactorAuth : {type : Boolean , default : false},
                loginAlerts : {type : Boolean , default : false},
                sessionManagement : {type : Boolean , default : false}
            }
        },
        metadata : {
            description : {type : String},
            keywords : [{type : String}],
            canonicalUrl : {type : String},
            ogImage : {type : String},
            twitterImage : {type : String}
        },
        isNSFW: { type: Boolean, default: false },
        nsfwReason: { type: String, default: '' },
        isLocked: { type: Boolean, default: false },
        lockReason: { type: String, default: '' }
    },
    { timestamps: true }
);

export const GroupModel = mongoose.model<Group>('Group', groupSchema);
