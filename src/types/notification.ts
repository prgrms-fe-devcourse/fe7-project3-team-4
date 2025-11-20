// src/types/notification.ts

// 1. 님의 Supabase 타입 정의 파일 경로에서 Database 타입을 가져옵니다.
import { Database } from "@/utils/supabase/supabase";

// 2. DB의 Enum 타입을 export
export type NotificationType = Database["public"]["Enums"]["notification_type"];

// 3. ⭐️ 업그레이드된 RPC 함수의 반환 타입 정의
export type NotificationWithDetails = {
  id: string;
  type: NotificationType;
  created_at: string;
  is_read: boolean | null;
  // sender 정보 상세 정의
  sender: {
    id: string | null;
    display_name: string | null;
    avatar_url: string | null;
    equipped_badge_id: string | null; // 👈 이 필드가 필수입니다!
  } | null;
  content: string | null;
  post_id: string | null;
  post_type: string | null;
};
