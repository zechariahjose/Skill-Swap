export type AvailabilityStatus = 'available' | 'busy' | 'learning_only';

export type PortfolioMediaType = 'image' | 'video' | 'link';

export interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  skillUsed?: string;
  mediaType: PortfolioMediaType;
  mediaUrl: string;
  externalLink?: string;
}

export interface PortfolioLink {
  id: string;
  label: string;
  url: string;
}

export interface User {
  uid: string;
  name: string;
  bio: string;
  location?: string;
  avatar?: string;
  initials: string;
  createdAt: Date;
  availabilityStatus?: AvailabilityStatus;
  rating?: number;
  totalSwaps?: number;
  pronouns?: string;
  company?: string;
  gmail?: string;
  website?: string;
  socialLinks?: {
    slot1?: string;
    slot2?: string;
    slot3?: string;
    slot4?: string;
  };
  skillsOffered?: string[];
  skillsWanted?: string[];
  portfolioItems?: PortfolioItem[];
  portfolioLinks?: PortfolioLink[];
}

export interface UserConnection {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}
 
export interface Skill {
  id: string;
  userId: string;
  userName: string;
  userInitials: string;
  title: string;
  category: string;
  description: string;
  type: 'offer' | 'need';
  createdAt: Date;
}
 
export type SwapStatus = 'pending' | 'accepted' | 'rejected' | 'completed';
 
export interface SwapRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserInitials: string;
  toUserId: string;
  toUserName: string;
  toUserInitials: string;
  offeredSkillId: string;
  offeredSkillTitle: string;
  requestedSkillId: string;
  requestedSkillTitle: string;
  status: SwapStatus;
  createdAt: Date;
  updatedAt?: Date;
}

export type NotificationType =
  | 'connection_request'
  | 'connection_accepted'
  | 'connection_declined'
  | 'swap_request'
  | 'swap_accepted'
  | 'swap_declined'
  | 'swap_pending'
  | 'swap_completed';

export interface Notification {
  id: string;
  userId: string; // recipient
  type: NotificationType;
  fromUserId: string;
  fromUserName: string;
  fromUserInitials: string;
  title: string;
  message: string;
  swapRequestId?: string;
  connectionId?: string;
  read: boolean;
  createdAt: Date;
}
 
export type Category =
  | 'Design'
  | 'Coding'
  | 'Music'
  | 'Language'
  | 'Writing'
  | 'Math'
  | 'Cooking'
  | 'Fitness'
  | 'Business'
  | 'Art'
  | 'Photography'
  | 'Other';

export const CATEGORIES: { label: Category; emoji: string; color: string }[] = [
  { label: 'Design',      emoji: '🎨', color: '#D4845A' },
  { label: 'Coding',      emoji: '💻', color: '#6B8F71' },
  { label: 'Music',       emoji: '🎵', color: '#9B7BB8' },
  { label: 'Language',    emoji: '🗣️', color: '#4A90A4' },
  { label: 'Writing',     emoji: '✍️', color: '#C4923A' },
  { label: 'Math',        emoji: '🔢', color: '#5A7A8F' },
  { label: 'Cooking',     emoji: '🍳', color: '#C4623A' },
  { label: 'Fitness',     emoji: '💪', color: '#7A9E7E' },
  { label: 'Business',    emoji: '📊', color: '#8F6B5A' },
  { label: 'Art',         emoji: '🖼️', color: '#B8845A' },
  { label: 'Photography', emoji: '📷', color: '#6B7A8F' },
  { label: 'Other',       emoji: '⭐', color: '#9A8F83' },
];
