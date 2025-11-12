import { Database } from "@/utils/supabase/supabase";

export type NotificationType = Database["public"]["Enums"]["notification_type"];

export type NotificationWithDetails = {
  id: string;
  type: NotificationType;
  created_at: string;
  is_read: boolean | null;
  sender: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  content: string | null;
};
