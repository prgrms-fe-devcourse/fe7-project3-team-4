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

  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAllNotifications = useCallback(async () => {
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
        () => fetchAllNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, fetchAllNotifications]);

  // "전체 삭제" 핸들러 함수
  const handleDeleteAll = async () => {
    setIsDeleting(true);

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("recipient_id", userId);

    if (error) {
      console.error("Error deleting notifications:", error);
      alert("알림 삭제 중 오류가 발생했습니다.");
    } else {
      setNotifications([]);
    }

    setIsDeleting(false);
  };

  // "읽음" 상태를 UI에 즉시 반영하는 함수
  const handleMarkAsRead = (notificationId: string) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((n) =>
        n.id === notificationId ? { ...n, is_read: true } : n
      )
    );
  };

  const handleDelete = (notificationId: string) => {
    setNotifications((prevNotifications) =>
      prevNotifications.filter((n) => n.id !== notificationId)
    );

    const deleteFromDB = async () => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) {
        console.error("Error deleting notification:", error);
      }
    };

    deleteFromDB();
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <h3 className="ml-2 text-xl font-semibold">알림 목록</h3>

        <button
          className="cursor-pointer leading-none border-b text-[#717182] disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
          onClick={handleDeleteAll}
          disabled={isDeleting || notifications.length === 0} // 삭제 중이거나, 알림이 0개면 비활성화
        >
          {isDeleting ? "삭제 중..." : "알림 삭제"}
        </button>
      </div>
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-white">
            새 알림이 없습니다.
          </p>
        ) : (
          notifications.map((n) => (
            <NotificationItem
              key={n.id}
              data={n}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </>
  );
}
