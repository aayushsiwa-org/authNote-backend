import mongoose, { Document, Schema } from 'mongoose';

// Interface for User document
export interface IUser extends Document {
  email: string;
  password?: string; // Optional for OAuth users
  name: string;
  displayName?: string; // For OAuth users
  providerId?: string; // For Google OAuth
  emails?: { value: string }[]; // For OAuth users
  profilePicture?: string;
  provider?: string; // Authentication provider (e.g., 'google', 'local')
  _id: string; // MongoDB ID
  createdAt: Date;
  updatedAt: Date;
}

// User schema
const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    // Not required for OAuth users
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  displayName: {
    type: String,
    trim: true
  },
  providerId: {
    type: String,
    sparse: true, // Allows null/undefined values but ensures uniqueness when present
  },
  profilePicture: {
    type: String
  },
  provider: {
    type: String,
    enum: ['local', 'google'], // Add other providers as needed
    default: 'local'
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});


// Create and export the User model
export const User = mongoose.model<IUser>('User', UserSchema);
