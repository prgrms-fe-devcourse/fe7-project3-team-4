"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export function useUnreadCounts(currentUserId: string | null) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  useEffect(() => {
    if (!currentUserId) return;

    const supabase = createClient();

    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", currentUserId)
        .eq("is_read", false);

      if (error) {
        console.error("알림 개수 조회 오류:", error.message);
      } else {
        setUnreadCount(count ?? 0);
      }
    };

    const fetchUnreadMessageCount = async () => {
      const { data, error } = await supabase.rpc("get_unread_message_count");

      if (error) {
        console.error("안 읽은 메시지 개수 RPC 조회 오류:", error);
      } else {
        setUnreadMessageCount(data ?? 0);
      }
    };

    fetchUnreadCount();
    fetchUnreadMessageCount();

    const notiChannel = supabase
      .channel(`notifications-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${currentUserId}`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    const chatChannel = supabase
      .channel(`message_rooms-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "message_rooms",
          filter: `pair_max=eq.${currentUserId}`,
        },
        () => fetchUnreadMessageCount()
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "message_rooms",
          filter: `pair_min=eq.${currentUserId}`,
        },
        () => fetchUnreadMessageCount()
      )
      .subscribe();

    const newMessagesChannel = supabase
      .channel(`new-messages-for-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => fetchUnreadMessageCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notiChannel);
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(newMessagesChannel);
    };
  }, [currentUserId]);

  return { unreadCount, unreadMessageCount };
}
