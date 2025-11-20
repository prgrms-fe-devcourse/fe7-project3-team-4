// src/components/notify/NotificationList.tsx
"use client";

import { useState } from "react";
import { NotificationItem } from "@/components/notify/NotificationItem";
import { createClient } from "@/utils/supabase/client";
import type { NotificationWithDetails } from "@/types/notification";
import { useToast } from "../common/toast/ToastContext";
import ConfirmModal from "@/components/common/ConfirmModal";

type NotificationListProps = {
  notifications: NotificationWithDetails[];
  userId: string;
  onUpdate: () => void;
};

export function NotificationList({
  notifications,
  userId,
  onUpdate,
}: NotificationListProps) {
  const supabase = createClient();
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const openDeleteConfirm = () => {
    setDeleteConfirmOpen(true);
  };

  const handleDeleteAll = async () => {
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
      // 삭제 성공 시 데이터 다시 불러오기
      onUpdate();
    }

    setIsDeleting(false);
    setDeleteConfirmOpen(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      console.error("Failed to mark notification as read:", error);
    }
    // 실시간 구독으로 자동 업데이트됨
  };

  const handleDelete = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) {
      console.error("Error deleting notification:", error);
      showToast({
        title: "알림 삭제 오류",
        message: "알림 삭제 중 오류가 발생했습니다.",
        variant: "error",
      });
    }
    // 실시간 구독으로 자동 업데이트됨
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <h3 className="ml-2 text-xl font-semibold">알림 목록</h3>

        <button
          className="cursor-pointer leading-none border-b text-[#717182] disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
          onClick={openDeleteConfirm}
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

      <ConfirmModal
        title="삭제 확인"
        description="모든 알림을 삭제하시겠습니까?"
        open={deleteConfirmOpen}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteAll}
      />
    </>
  );
}