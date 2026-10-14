export type Profile = { id: string; username: string; grade: number | null; full_name: string | null; created_at: string };
export type Room = { id: string; name: string; description: string; created_at: string };
export type Message = { id: string; recipient_id: string; author_id: string; content: string; created_at: string };
export type FriendRequest = { requester_id: string; recipient_id: string; created_at: string };
export type Post = { id: string; author_id: string; content: string; created_at: string };
export type Kudos = { id: string; sender_id: string; recipient_id: string; created_at: string };
export type Ranking = { id: string; username: string; grade: number | null; score: number };
export type SiteRating = { user_id: string; stars: number; created_at: string; updated_at: string };
export type SiteRatingCount = { stars: number; votes: number };
export type FriendCall = { id: string; initiator_id: string; kind: 'audio' | 'video'; status: 'active' | 'ended'; created_at: string; ended_at: string | null };
export type CallMember = { call_id: string; user_id: string; status: 'invited' | 'joined' | 'declined' | 'left'; updated_at: string };
type Table<Row, Insert, Update> = { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, never, Pick<Profile, 'full_name'>>;
      friend_requests: Table<FriendRequest, Pick<FriendRequest, 'requester_id' | 'recipient_id'>, never>;
      messages: Table<Message, Pick<Message, 'recipient_id' | 'author_id' | 'content'>, Pick<Message, 'content'>>;
      posts: Table<Post, Pick<Post, 'author_id' | 'content'>, Pick<Post, 'content'>>;
      kudos: Table<Kudos, never, never>;
      site_ratings: Table<SiteRating, Pick<SiteRating, 'user_id' | 'stars'>, Pick<SiteRating, 'stars' | 'updated_at'>>;
      calls: Table<FriendCall, never, never>;
      call_members: Table<CallMember, never, never>;
    };
    Views: { leaderboard: { Row: Ranking; Relationships: [] }; site_rating_counts: { Row: SiteRatingCount; Relationships: [] } };
    Functions: { give_kudos: { Args: { recipient: string }; Returns: undefined }; start_friend_call: { Args: { invitees: string[]; call_kind: 'audio' | 'video' }; Returns: string }; respond_friend_call: { Args: { target_call: string; accept_call: boolean }; Returns: undefined }; leave_friend_call: { Args: { target_call: string }; Returns: undefined } };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
