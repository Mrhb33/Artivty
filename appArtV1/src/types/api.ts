import type { ImageSourcePropType } from 'react-native';

// API Types matching backend schemas

export type UserRole = 'customer' | 'artist' | 'admin';

export interface User {
  id: number;
  email: string;
  name: string;
  username?: string;
  role: UserRole;
  is_active: boolean;
  profile_picture_url?: string;
  bio?: string;
  is_artist_verified: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ArtworkImages {
  originalUrl: string | ImageSourcePropType;
  feedUrl: string | ImageSourcePropType;
  squareUrl: string | ImageSourcePropType;
  thumbUrl: string | ImageSourcePropType;
  originalWidth?: number;
  originalHeight?: number;
}

export interface Artwork {
  id: number;
  artist_id: number;
  title?: string;
  description?: string;
  image_url?: string | ImageSourcePropType;
  images?: ArtworkImages;
  aspectRatio?: number;
  style_tags?: string;
  created_at: string;
}

export type RequestStatus = 'draft' | 'open' | 'pending_payment' | 'hired' | 'in_progress' | 'delivered' | 'completed' | 'cancelled' | 'refunded';

export interface Request {
  id: number;
  customer_id: number;
  selected_artist_id?: number;
  title: string;
  category?: string;
  medium?: string;
  description: string;
  dimensions_width?: number;
  dimensions_height?: number;
  dimensions_unit?: string;
  style?: string;
  deadline?: string;
  budget_min?: number;
  budget_max?: number;
  usage_rights?: 'personal' | 'commercial';
  delivery_format?: 'digital' | 'physical' | 'both';
  revision_policy?: string;
  visibility?: 'public' | 'invite-only';
  status: RequestStatus;
  created_at: string;
  updated_at?: string;
  offers_count: number;
  reference_images: string[];
}

export type OfferStatus = 'active' | 'accepted' | 'rejected' | 'expired';

export interface Offer {
  id: number;
  request_id: number;
  artist_id: number;
  price: number;
  delivery_days: number;
  message?: string;
  revisions_included?: number;
  delivery_format?: 'digital' | 'physical' | 'both';
  expiry_at?: string;
  status: OfferStatus;
  created_at: string;
  artist_rating?: number;
  artist_completion_rate?: number;
}

export interface OfferWithArtist extends Offer {
  artist_name: string;
  artist_username?: string;
  artist_profile_picture?: string;
  artist_rating?: number;
  artist_completion_rate?: number;
}

export type NotificationType = 'new_request' | 'new_offer' | 'offer_accepted' | 'offer_rejected' | 'request_completed';

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  related_request_id?: number;
  related_artist_id?: number;
  is_read: boolean;
  created_at: string;
}

// API Request/Response types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  name: string;
  username?: string;
  password: string;
  role?: UserRole;
}

export interface CreateRequestData {
  title: string;
  category?: string;
  medium?: string;
  description: string;
  dimensions_width?: number;
  dimensions_height?: number;
  dimensions_unit?: string;
  style?: string;
  colors?: string;
  deadline?: string;
  budget_min?: number;
  budget_max?: number;
  usage_rights?: 'personal' | 'commercial';
  delivery_format?: 'digital' | 'physical' | 'both';
  revision_policy?: string;
  visibility?: 'public' | 'invite-only';
  reference_images?: string[];
}

export interface CreateOfferData {
  price: number;
  delivery_days: number;
  message?: string;
  revisions_included?: number;
  delivery_format?: 'digital' | 'physical' | 'both';
  expiry_hours?: number;
}

export type JobStatus = 'in_progress' | 'delivered' | 'completed' | 'cancelled' | 'refunded';

export interface Milestone {
  id: number;
  title: string;
  status: 'pending' | 'submitted' | 'approved';
  image_url?: string;
  submitted_at?: string;
}

export interface Job {
  id: number;
  request_id: number;
  offer_id: number;
  customer_id: number;
  artist_id: number;
  escrow_payment_id?: string;
  status: JobStatus;
  milestones: Milestone[];
  created_at: string;
  updated_at?: string;
}
