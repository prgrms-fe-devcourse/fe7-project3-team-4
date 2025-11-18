export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      badges: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          perks: string[] | null
          price: number
          rarity: Database["public"]["Enums"]["badge_type"] | null
          tagline: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          perks?: string[] | null
          price: number
          rarity?: Database["public"]["Enums"]["badge_type"] | null
          tagline?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          perks?: string[] | null
          price?: number
          rarity?: Database["public"]["Enums"]["badge_type"] | null
          tagline?: string | null
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string | null
          created_at: string | null
          has_reply: boolean
          id: string
          like_count: number | null
          parent_id: string | null
          reply_count: number | null
          target_id: string | null
          target_type: Database["public"]["Enums"]["target_type_enum"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          has_reply?: boolean
          id?: string
          like_count?: number | null
          parent_id?: string | null
          reply_count?: number | null
          target_id?: string | null
          target_type?: Database["public"]["Enums"]["target_type_enum"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          has_reply?: boolean
          id?: string
          like_count?: number | null
          parent_id?: string | null
          reply_count?: number | null
          target_id?: string | null
          target_type?: Database["public"]["Enums"]["target_type_enum"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtags: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string | null
          target_id: string
          target_type: Database["public"]["Enums"]["target_type_enum"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          target_id: string
          target_type: Database["public"]["Enums"]["target_type_enum"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          target_id?: string
          target_type?: Database["public"]["Enums"]["target_type_enum"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_rooms: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          last_message_text: string | null
          last_read_at_max: string | null
          last_read_at_min: string | null
          pair_max: string | null
          pair_min: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_text?: string | null
          last_read_at_max?: string | null
          last_read_at_min?: string | null
          pair_max?: string | null
          pair_min?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_text?: string | null
          last_read_at_max?: string | null
          last_read_at_min?: string | null
          pair_max?: string | null
          pair_min?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_rooms_pair_max_fkey"
            columns: ["pair_max"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_rooms_pair_min_fkey"
            columns: ["pair_min"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          room_id: string
          sender_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          room_id: string
          sender_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          room_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          audios: string[] | null
          content: string | null
          created_at: string
          id: string
          images: string[] | null
          like_count: number
          metadata: Json | null
          published_at: string | null
          site_name: string | null
          tags: string[] | null
          title: string
          url: string | null
          videos: string[] | null
          view_count: number
        }
        Insert: {
          audios?: string[] | null
          content?: string | null
          created_at?: string
          id?: string
          images?: string[] | null
          like_count?: number
          metadata?: Json | null
          published_at?: string | null
          site_name?: string | null
          tags?: string[] | null
          title: string
          url?: string | null
          videos?: string[] | null
          view_count?: number
        }
        Update: {
          audios?: string[] | null
          content?: string | null
          created_at?: string
          id?: string
          images?: string[] | null
          like_count?: number
          metadata?: Json | null
          published_at?: string | null
          site_name?: string | null
          tags?: string[] | null
          title?: string
          url?: string | null
          videos?: string[] | null
          view_count?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          recipient_id: string
          sender_id: string | null
          target_id: string
          target_type: Database["public"]["Enums"]["notification_target_type"]
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          recipient_id: string
          sender_id?: string | null
          target_id: string
          target_type: Database["public"]["Enums"]["notification_target_type"]
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          recipient_id?: string
          sender_id?: string | null
          target_id?: string
          target_type?: Database["public"]["Enums"]["notification_target_type"]
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comment_count: number | null
          content: Json | null
          created_at: string | null
          hashtags: Database["public"]["Enums"]["hashtag_type"][] | null
          id: string
          is_prompt_like: boolean | null
          like_count: number | null
          model: string | null
          post_type: string | null
          result_mode: string | null
          subtitle: string | null
          thumbnail: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          view_count: number | null
        }
        Insert: {
          comment_count?: number | null
          content?: Json | null
          created_at?: string | null
          hashtags?: Database["public"]["Enums"]["hashtag_type"][] | null
          id?: string
          is_prompt_like?: boolean | null
          like_count?: number | null
          model?: string | null
          post_type?: string | null
          result_mode?: string | null
          subtitle?: string | null
          thumbnail?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Update: {
          comment_count?: number | null
          content?: Json | null
          created_at?: string | null
          hashtags?: Database["public"]["Enums"]["hashtag_type"][] | null
          id?: string
          is_prompt_like?: boolean | null
          like_count?: number | null
          model?: string | null
          post_type?: string | null
          result_mode?: string | null
          subtitle?: string | null
          thumbnail?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          equipped_badge_id: string | null
          exist_id: boolean
          followed_count: number | null
          following_count: number | null
          id: string
          points: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          equipped_badge_id?: string | null
          exist_id?: boolean
          followed_count?: number | null
          following_count?: number | null
          id: string
          points?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          equipped_badge_id?: string | null
          exist_id?: boolean
          followed_count?: number | null
          following_count?: number | null
          id?: string
          points?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_equipped_badge_id_fkey"
            columns: ["equipped_badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          acquired_at: string | null
          badge_id: string
          user_id: string
        }
        Insert: {
          acquired_at?: string | null
          badge_id: string
          user_id: string
        }
        Update: {
          acquired_at?: string | null
          badge_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_news_bookmarks: {
        Row: {
          created_at: string
          news_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          news_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          news_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_news_bookmarks_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_news_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_news_likes: {
        Row: {
          created_at: string
          news_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          news_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          news_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_news_likes_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_news_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_post_bookmarks: {
        Row: {
          created_at: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_post_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_post_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_post_likes: {
        Row: {
          created_at: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_post_views: {
        Row: {
          id: string
          post_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_post_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      buy_badge: { Args: { badge_id_to_buy: string }; Returns: undefined }
      decrement_post_like_count: {
        Args: { p_post_id: string }
        Returns: undefined
      }
      ensure_direct_room: { Args: { other_user_id: string }; Returns: string }
      get_notifications_with_details: {
        Args: never
        Returns: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          post_id: string
          post_type: string
          sender: Json
          type: Database["public"]["Enums"]["notification_type"]
        }[]
      }
      get_unread_chat_count: { Args: never; Returns: number }
      get_unread_message_count: { Args: never; Returns: number }
      increment_post_like_count: {
        Args: { p_post_id: string }
        Returns: undefined
      }
      increment_view_count: { Args: { post_id: string }; Returns: undefined }
      mark_room_read: { Args: { room_id: string }; Returns: undefined }
    }
    Enums: {
      badge_type:
        | "legendary"
        | "epic"
        | "ultra-rare"
        | "rare"
        | "uncommon"
        | "common"
        | "basic"
      comment_target_type: "posts" | "news"
      hashtag_type:
        | "education"
        | "writing"
        | "business"
        | "script"
        | "marketing"
        | "content"
        | "research"
        | "play"
        | "sns"
        | "art"
        | "develop"
        | "summary"
      notification_target_type:
        | "post"
        | "news"
        | "comment"
        | "profile"
        | "message"
      notification_type: "follow" | "comment" | "like" | "message"
      notification_type_enum: "like" | "comment" | "follow" | "message"
      post_type_enum: "prompt" | "free" | "weekly" | "news" | "all"
      target_type_enum: "post" | "news"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      badge_type: [
        "legendary",
        "epic",
        "ultra-rare",
        "rare",
        "uncommon",
        "common",
        "basic",
      ],
      comment_target_type: ["posts", "news"],
      hashtag_type: [
        "education",
        "writing",
        "business",
        "script",
        "marketing",
        "content",
        "research",
        "play",
        "sns",
        "art",
        "develop",
        "summary",
      ],
      notification_target_type: [
        "post",
        "news",
        "comment",
        "profile",
        "message",
      ],
      notification_type: ["follow", "comment", "like", "message"],
      notification_type_enum: ["like", "comment", "follow", "message"],
      post_type_enum: ["prompt", "free", "weekly", "news", "all"],
      target_type_enum: ["post", "news"],
    },
  },
} as const
