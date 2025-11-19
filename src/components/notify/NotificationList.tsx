// src/components/notify/NotificationList.tsx
"use client";

import { useState, useEffect } from "react";
import { NotificationItem } from "@/components/notify/NotificationItem";
import { createClient } from "@/utils/supabase/client";
import type { NotificationWithDetails } from "@/types/notification";
import { useToast } from "../common/toast/ToastContext";
import { useQueryClient } from "@tanstack/react-query";

type NotificationListProps = {
  notifications: NotificationWithDetails[];
  userId: string;
};

// 실시간 페이로드 타입 정의
type ProfilesRealtimePayload = {
  new?: {
    id?: string;
    display_name?: string | null;
    avatar_url?: string | null;
    equipped_badge_id?: string | null;
  };
};

export function NotificationList({
  notifications: initialNotifications,
  userId,
}: NotificationListProps) {
  const supabase = createClient();
  const { showToast } = useToast();
  const [notifications, setNotifications] =
    useState<NotificationWithDetails[]>(initialNotifications);

  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. 실시간 알림 수신 (새 알림이 오면 목록 갱신)
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
        () => {
          queryClient.invalidateQueries({
            queryKey: ["notifications", userId],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, queryClient]);

  // 2. ⭐️ 실시간 프로필 변경 수신 (알림 보낸 사람의 뱃지 등이 바뀌면 갱신)
  useEffect(() => {
    const channel = supabase
      .channel("notify-profiles-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        (payload: ProfilesRealtimePayload) => {
          const newProfile = payload.new;
          if (!newProfile?.id) return;

          // React Query 캐시를 직접 수정하여 즉시 반영
          queryClient.setQueryData(
            ["notifications", userId],
            (oldData: NotificationWithDetails[] | undefined) => {
              if (!oldData) return oldData;

              return oldData.map((n) => {
                // 알림 보낸 사람이 업데이트된 유저라면 정보 갱신
                if (n.sender && n.sender.id === newProfile.id) {
                  return {
                    ...n,
                    sender: {
                      ...n.sender,
                      display_name:
                        newProfile.display_name ?? n.sender.display_name,
                      avatar_url: newProfile.avatar_url ?? n.sender.avatar_url,
                      equipped_badge_id:
                        newProfile.equipped_badge_id ??
                        n.sender.equipped_badge_id,
                    },
                  };
                }
                return n;
              });
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient, userId]);

  // ... (나머지 핸들러는 기존과 동일)
  const handleDeleteAll = async () => {
    if (!confirm("모든 알림을 삭제하시겠습니까?")) return;

    setIsDeleting(true);

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("recipient_id", userId);

    if (error) {
      console.error("Error deleting notifications:", error);
      showToast({
        title: "알림 삭제 오류",
        message: "알림 삭제 중 오류가 발생했습니다.",
        variant: "error",
      });
    } else {
      queryClient.setQueryData(["notifications", userId], []);
    }

    setIsDeleting(false);
  };

  const handleMarkAsRead = (notificationId: string) => {
    queryClient.setQueryData(
      ["notifications", userId],
      (oldData: NotificationWithDetails[] | undefined) =>
        oldData
          ? oldData.map((n) =>
              n.id === notificationId ? { ...n, is_read: true } : n
            )
          : []
    );
  };

  const handleDelete = (notificationId: string) => {
    queryClient.setQueryData(
      ["notifications", userId],
      (oldData: NotificationWithDetails[] | undefined) =>
        oldData ? oldData.filter((n) => n.id !== notificationId) : []
    );

    const deleteFromDB = async () => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) {
        console.error("Error deleting notification:", error);
        queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
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
          disabled={isDeleting || notifications.length === 0}
        >
          {isDeleting ? "삭제 중..." : "알림 삭제"}
        </button>
      </div>
      <div className="space-y-6">
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
