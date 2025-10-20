import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IChannel extends Document {
  name: string;
  description?: string;
  type: 'public' | 'private' | 'direct';
  owner?: Types.ObjectId;
  members: Types.ObjectId[];
  admins: Types.ObjectId[];
  avatar?: string;
  lastMessage?: Types.ObjectId;
  lastActivity?: Date;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChannelSchema = new Schema<IChannel>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    maxlength: 200,
    default: ''
  },
  type: {
    type: String,
    enum: ['public', 'private', 'direct'],
    default: 'public'
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  admins: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  avatar: {
    type: String,
    default: null
  },
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
ChannelSchema.index({ name: 1 });
ChannelSchema.index({ members: 1 });
ChannelSchema.index({ type: 1 });
ChannelSchema.index({ lastActivity: -1 });

// Virtual for member count
ChannelSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Ensure virtual fields are included in JSON
ChannelSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

export default mongoose.models.Channel || mongoose.model<IChannel>('Channel', ChannelSchema);