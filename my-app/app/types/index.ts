export interface User {
  uid: string;
  name: string;
  bio: string;
  avatar?: string;
  initials: string;
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
 