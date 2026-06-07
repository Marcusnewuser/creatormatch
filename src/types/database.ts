export type UserRole = 'creator' | 'brand' | 'admin'
export type AppMode = 'creator' | 'brand'
export type CampaignStatus = 'draft' | 'active' | 'closed'
export type ApplicationStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'in_progress'
  | 'pending_completion'
  | 'content_submitted'
  | 'approved'
  | 'completed'

export type MessageRoleContext = 'creator' | 'brand'

export interface Conversation {
  id: string
  application_id: string
  creator_id: string
  brand_id: string
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_role: MessageRoleContext | null
  message: string | null
  file_url: string | null
  file_name: string | null
  created_at: string
}

export interface ConversationWithDetails extends Conversation {
  application?: Application
  campaign_title: string
  other_party_name: string
  other_party_avatar: string | null
  last_message: Message | null
  unread_count: number
}

export interface Submission {
  id: string
  application_id: string
  creator_id: string
  content_url: string
  notes: string | null
  created_at: string
}

export interface Profile {
  id: string
  /** role_type: creator | brand | admin */
  role: UserRole | null
  /** Initial dashboard preference — does not lock account type. */
  primary_mode: AppMode | null
  email: string
  is_suspended?: boolean
  created_at: string
}

export interface CreatorProfile {
  id: string
  user_id: string
  full_name: string | null
  avatar_url: string | null
  banner_url: string | null
  bio: string | null
  location: string | null
  country: string | null
  preferred_currency: string | null
  follower_count: number | null
  average_views: number | null
  average_likes: number | null
  engagement_rate: number | null
  username: string | null
  instagram_url: string | null
  tiktok_url: string | null
  xiaohongshu_url: string | null
  youtube_url: string | null
  category: string | null
  created_at: string
  updated_at: string
}

export interface CreatorPost {
  id: string
  creator_id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  category: string
  views_count: number
  likes_count: number
  created_at: string
  updated_at: string
}

export interface PostLike {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export interface CreatorPostStats {
  totalPosts: number
  totalViews: number
  totalLikes: number
  completedCollaborations: number
}

export interface CreatorProfileWithPosts {
  profile: CreatorProfile
  posts: CreatorPost[]
  stats: CreatorPostStats
}

export interface BrandProfile {
  id: string
  user_id: string
  company_name: string | null
  logo_url: string | null
  banner_url: string | null
  description: string | null
  industry: string | null
  website: string | null
  location: string | null
  country: string | null
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  brand_id: string
  title: string
  category: string
  country: string | null
  currency: string | null
  platform: string | null
  budget: string | null
  location: string | null
  description: string | null
  requirements: string[]
  status: CampaignStatus
  created_at: string
  updated_at: string
}

export interface CampaignWithBrand extends Campaign {
  brand_profiles: Pick<BrandProfile, 'company_name' | 'logo_url'> | null
}

export interface Application {
  id: string
  campaign_id: string
  creator_id: string
  brand_id: string
  message: string | null
  portfolio_link: string | null
  status: ApplicationStatus
  brand_marked_complete_at: string | null
  creator_confirmed_at: string | null
  review_requested_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface ApplicationWithCampaign extends Application {
  campaigns: Campaign & {
    brand_profiles: Pick<BrandProfile, 'company_name'> | null
  }
}

export interface ApplicationWithCreator extends Application {
  creator_profiles: CreatorProfile | null
}

/** Permanent completed collaboration record (migration 021). */
export interface CollaborationCompletion {
  id: string
  application_id: string | null
  campaign_id: string | null
  creator_id: string
  brand_id: string
  campaign_title: string | null
  completed_at: string
  created_at: string
}

/** Workspace account for notification inbox separation (DB: account_type). */
export type NotificationAccountType = 'creator' | 'brand' | 'admin'

/** @deprecated Use NotificationAccountType */
export type NotificationRoleContext = NotificationAccountType

export type AdminNotificationType =
  | 'admin_user_registered'
  | 'admin_campaign_created'
  | 'admin_report_submitted'

export type CreatorNotificationType =
  | 'application_submitted'
  | 'application_accepted'
  | 'application_rejected'
  | 'profile_viewed'
  | 'campaign_recommended'
  | 'collaboration_marked_complete'
  | 'collaboration_invitation'
  | 'new_message'
  | 'submission_approved'
  | 'file_request'

export type BrandNotificationType =
  | 'application_received'
  | 'application_withdrawn'
  | 'campaign_expiring'
  | 'campaign_closed'
  | 'collaboration_confirmed'
  | 'collaboration_invitation'
  | 'review_requested'
  | 'content_submitted'
  | 'new_message'
  | 'file_request'

export type NotificationType =
  | CreatorNotificationType
  | BrandNotificationType
  | AdminNotificationType

export interface Notification {
  id: string
  user_id: string
  /** Workspace account — creator and brand inboxes are fully separate. */
  account_type: NotificationAccountType
  title: string
  message: string
  type: NotificationType
  /** Read status (DB: is_read). */
  is_read: boolean
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'> & { created_at?: string }
        Update: Partial<Omit<Profile, 'id'>>
      }
      creator_profiles: {
        Row: CreatorProfile
        Insert: Omit<CreatorProfile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CreatorProfile, 'id' | 'user_id' | 'created_at'>>
      }
      brand_profiles: {
        Row: BrandProfile
        Insert: Omit<BrandProfile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<BrandProfile, 'id' | 'user_id' | 'created_at'>>
      }
      campaigns: {
        Row: Campaign
        Insert: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Campaign, 'id' | 'brand_id' | 'created_at'>>
      }
      applications: {
        Row: Application
        Insert: Omit<Application, 'id' | 'created_at' | 'updated_at' | 'status'> & { status?: ApplicationStatus }
        Update: Partial<Omit<Application, 'id' | 'campaign_id' | 'creator_id' | 'created_at'>>
      }
      creator_posts: {
        Row: CreatorPost
        Insert: Omit<CreatorPost, 'id' | 'views_count' | 'likes_count' | 'created_at' | 'updated_at'> & {
          views_count?: number
          likes_count?: number
        }
        Update: Partial<Omit<CreatorPost, 'id' | 'creator_id' | 'views_count' | 'likes_count' | 'created_at'>>
      }
      post_likes: {
        Row: PostLike
        Insert: Omit<PostLike, 'id' | 'created_at'>
        Update: never
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at' | 'is_read'> & { is_read?: boolean }
        Update: Partial<Pick<Notification, 'is_read'>>
      }
      conversations: {
        Row: Conversation
        Insert: Omit<Conversation, 'id' | 'created_at'>
        Update: never
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at'>
        Update: never
      }
      submissions: {
        Row: Submission
        Insert: Omit<Submission, 'id' | 'created_at'>
        Update: never
      }
      collaboration_completions: {
        Row: CollaborationCompletion
        Insert: never
        Update: never
      }
    }
  }
}
