// src/app/(home)/notify/NotificationList.tsx (수정본)

"use client";

import { useState, useEffect, useCallback } from "react";
import { NotificationItem } from "@/components/notify/NotificationItem";
import { createClient } from "@/utils/supabase/client";
import type { NotificationWithDetails } from "@/types/notification";

type NotificationListProps = {
  initialNotifications: NotificationWithDetails[];
  userId: string;
};

export function NotificationList({
  initialNotifications,
  userId,
}: NotificationListProps) {
  const supabase = createClient();

  const [notifications, setNotifications] =
    useState<NotificationWithDetails[]>(initialNotifications);

  const fetchAllNotifications = useCallback(async () => {
    console.log("🔄 Fetching all notifications...");
    const { data, error } = await supabase.rpc(
      "get_notifications_with_details"
    );

    if (error) {
      console.error("Error refetching notifications:", error);
    } else {
      setNotifications(data as NotificationWithDetails[]);
    }
  }, [supabase]);

  useEffect(() => {
    const channel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          console.log("✅ New notification received!", payload);
          fetchAllNotifications();
        }
      )
      .subscribe();

    console.log(`Subscribed to notifications for user: ${userId}`);

    return () => {
      console.log("Unsubscribing from notifications");
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, fetchAllNotifications]);

  return (
    <div className="space-y-4">
      {notifications.length === 0 ? (
        <p className="text-center text-gray-500">새 알림이 없습니다.</p>
      ) : (
        notifications.map((n) => <NotificationItem key={n.id} data={n} />)
      )}
    </div>
  );
}
