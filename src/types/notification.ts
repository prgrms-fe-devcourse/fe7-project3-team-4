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
  // ⭐️ sender 객체에 'id' 추가
  sender: {
    id: string | null; // ⭐️ (팔로우 URL용)
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  content: string | null;
  post_id: string | null; // ⭐️ (게시물 URL용)
  post_type: string | null; // ⭐️ (게시물 URL용)
};
