export type Profile = { id: string; username: string; grade: number; full_name: string | null; created_at: string };
export type Room = { id: string; name: string; description: string; created_at: string };
export type Message = { id: string; room_id: string; author_id: string; content: string; created_at: string };
export type Post = { id: string; author_id: string; content: string; created_at: string };
export type Kudos = { id: string; sender_id: string; recipient_id: string; created_at: string };
export type Ranking = { id: string; username: string; grade: number; score: number };
type Table<Row, Insert, Update> = { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, never, Pick<Profile, 'full_name'>>;
      rooms: Table<Room, never, never>;
      messages: Table<Message, Pick<Message, 'room_id' | 'author_id' | 'content'>, Pick<Message, 'content'>>;
      posts: Table<Post, Pick<Post, 'author_id' | 'content'>, Pick<Post, 'content'>>;
      kudos: Table<Kudos, never, never>;
    };
    Views: { leaderboard: { Row: Ranking; Relationships: [] } };
    Functions: { give_kudos: { Args: { recipient: string }; Returns: undefined } };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
