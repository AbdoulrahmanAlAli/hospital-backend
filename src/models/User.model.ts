import mongoose, { Schema, type Document, type Model } from 'mongoose';
import { allRoles, type Role } from '../constants/roles';
import { comparePassword, hashPassword } from '../utils/password';

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: Role;
  isActive: boolean;
  lastLoginAt?: Date;
  comparePassword(plainPassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: allRoles, required: true, index: true },
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPasswordIfChanged(next) {
  if (!this.isModified('password')) return next();
  this.password = await hashPassword(this.password);
  next();
});

userSchema.methods.comparePassword = function compare(plainPassword: string) {
  return comparePassword(plainPassword, this.password);
};

export const UserModel: Model<IUser> = mongoose.model<IUser>('User', userSchema);
