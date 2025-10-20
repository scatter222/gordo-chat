import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAttachment {
  type: 'image' | 'file' | 'video' | 'audio';
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface IReaction {
  emoji: string;
  users: Types.ObjectId[];
}

export interface IMessage extends Document {
  channelId: Types.ObjectId;
  userId: Types.ObjectId;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  attachments?: IAttachment[];
  reactions?: IReaction[];
  replyTo?: Types.ObjectId;
  edited: boolean;
  editedAt?: Date;
  deletedAt?: Date;
  mentions?: Types.ObjectId[];
  readBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>({
  type: {
    type: String,
    enum: ['image', 'file', 'video', 'audio'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  }
}, { _id: false });

const ReactionSchema = new Schema<IReaction>({
  emoji: {
    type: String,
    required: true
  },
  users: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { _id: false });

const MessageSchema = new Schema<IMessage>({
  channelId: {
    type: Schema.Types.ObjectId,
    ref: 'Channel',
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: function(this: any) {
      return this.type === 'text';
    },
    maxlength: 5000
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  attachments: [AttachmentSchema],
  reactions: [ReactionSchema],
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  deletedAt: {
    type: Date,
    default: null
  },
  mentions: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  readBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Compound index for efficient channel message queries
MessageSchema.index({ channelId: 1, createdAt: -1 });
MessageSchema.index({ deletedAt: 1 });

// Virtual for checking if message is deleted
MessageSchema.virtual('isDeleted').get(function() {
  return this.deletedAt !== null;
});

// Set JSON output
MessageSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret: any) {
    delete ret.__v;
    return ret;
  }
});

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);