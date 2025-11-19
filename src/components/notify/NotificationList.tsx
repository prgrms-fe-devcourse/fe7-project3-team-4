// src/components/notify/NotificationList.tsx
"use client";

import { useState, useEffect } from "react";
import { NotificationItem } from "@/components/notify/NotificationItem";
import { createClient } from "@/utils/supabase/client";
import type { NotificationWithDetails } from "@/types/notification";
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
  notifications,
  userId,
}: NotificationListProps) {
  const supabase = createClient();
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
      alert("알림 삭제 중 오류가 발생했습니다.");
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

// // src/components/notify/NotificationList.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { NotificationItem } from "@/components/notify/NotificationItem";
// import { createClient } from "@/utils/supabase/client";
// import type { NotificationWithDetails } from "@/types/notification";
// import { useQueryClient } from "@tanstack/react-query";

// type NotificationListProps = {
//   notifications: NotificationWithDetails[];
//   userId: string;
// };

// export function NotificationList({
//   notifications,
//   userId,
// }: NotificationListProps) {
//   const supabase = createClient();
//   const queryClient = useQueryClient();
//   const [isDeleting, setIsDeleting] = useState(false);

//   // 실시간 알림 수신
//   useEffect(() => {
//     const channel = supabase
//       .channel("realtime-notifications")
//       .on(
//         "postgres_changes",
//         {
//           event: "INSERT",
//           schema: "public",
//           table: "notifications",
//           filter: `recipient_id=eq.${userId}`,
//         },
//         () => {
//           // 새 알림이 오면 캐시 무효화 -> 자동 재요청
//           queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
//         }
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, [supabase, userId, queryClient]);

//   // "전체 삭제" 핸들러
//   const handleDeleteAll = async () => {
//     if (!confirm("모든 알림을 삭제하시겠습니까?")) return;
    
//     setIsDeleting(true);

//     const { error } = await supabase
//       .from("notifications")
//       .delete()
//       .eq("recipient_id", userId);

//     if (error) {
//       console.error("Error deleting notifications:", error);
//       alert("알림 삭제 중 오류가 발생했습니다.");
//     } else {
//       // 캐시 즉시 비우기
//       queryClient.setQueryData(["notifications", userId], []);
//     }

//     setIsDeleting(false);
//   };

//   // "읽음" 상태 업데이트 (Optimistic Update)
//   const handleMarkAsRead = (notificationId: string) => {
//     // 1. 캐시 즉시 업데이트 (UI 반응)
//     queryClient.setQueryData(
//       ["notifications", userId],
//       (oldData: NotificationWithDetails[] | undefined) =>
//         oldData
//           ? oldData.map((n) =>
//               n.id === notificationId ? { ...n, is_read: true } : n
//             )
//           : []
//     );
//   };

//   // 개별 삭제 핸들러 (Optimistic Update)
//   const handleDelete = (notificationId: string) => {
//     // 1. 캐시에서 즉시 제거
//     queryClient.setQueryData(
//       ["notifications", userId],
//       (oldData: NotificationWithDetails[] | undefined) =>
//         oldData ? oldData.filter((n) => n.id !== notificationId) : []
//     );

//     // 2. 서버 요청 (백그라운드)
//     const deleteFromDB = async () => {
//       const { error } = await supabase
//         .from("notifications")
//         .delete()
//         .eq("id", notificationId);

//       if (error) {
//         console.error("Error deleting notification:", error);
//         // 에러 시 롤백하거나 재조회
//         queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
//       }
//     };

//     deleteFromDB();
//   };

//   return (
//     <>
//       <div className="flex justify-between items-center">
//         <h3 className="ml-2 text-xl font-semibold">알림 목록</h3>

//         <button
//           className="cursor-pointer leading-none border-b text-[#717182] disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
//           onClick={handleDeleteAll}
//           disabled={isDeleting || notifications.length === 0}
//         >
//           {isDeleting ? "삭제 중..." : "알림 삭제"}
//         </button>
//       </div>
//       <div className="space-y-4">
//         {notifications.length === 0 ? (
//           <p className="text-center text-gray-500 dark:text-white">
//             새 알림이 없습니다.
//           </p>
//         ) : (
//           notifications.map((n) => (
//             <NotificationItem
//               key={n.id}
//               data={n}
//               onMarkAsRead={handleMarkAsRead}
//               onDelete={handleDelete}
//             />
//           ))
//         )}
//       </div>
//     </>
//   );
// }

// "use client";

// import { useState, useEffect, useCallback } from "react";
// import { NotificationItem } from "@/components/notify/NotificationItem";
// import { createClient } from "@/utils/supabase/client";
// import type { NotificationWithDetails } from "@/types/notification";

// type NotificationListProps = {
//   initialNotifications: NotificationWithDetails[];
//   userId: string;
// };

// export function NotificationList({
//   initialNotifications,
//   userId,
// }: NotificationListProps) {
//   const supabase = createClient();

//   const [notifications, setNotifications] =
//     useState<NotificationWithDetails[]>(initialNotifications);

//   const [isDeleting, setIsDeleting] = useState(false);

//   const fetchAllNotifications = useCallback(async () => {
//     const { data, error } = await supabase.rpc(
//       "get_notifications_with_details"
//     );

//     if (error) {
//       console.error("Error refetching notifications:", error);
//     } else {
//       setNotifications(data as NotificationWithDetails[]);
//     }
//   }, [supabase]);

//   useEffect(() => {
//     const channel = supabase
//       .channel("realtime-notifications")
//       .on(
//         "postgres_changes",
//         {
//           event: "INSERT",
//           schema: "public",
//           table: "notifications",
//           filter: `recipient_id=eq.${userId}`,
//         },
//         () => fetchAllNotifications()
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, [supabase, userId, fetchAllNotifications]);

//   // "전체 삭제" 핸들러 함수
//   const handleDeleteAll = async () => {
//     setIsDeleting(true);

//     const { error } = await supabase
//       .from("notifications")
//       .delete()
//       .eq("recipient_id", userId);

//     if (error) {
//       console.error("Error deleting notifications:", error);
//       alert("알림 삭제 중 오류가 발생했습니다.");
//     } else {
//       setNotifications([]);
//     }

//     setIsDeleting(false);
//   };

//   // "읽음" 상태를 UI에 즉시 반영하는 함수
//   const handleMarkAsRead = (notificationId: string) => {
//     setNotifications((prevNotifications) =>
//       prevNotifications.map((n) =>
//         n.id === notificationId ? { ...n, is_read: true } : n
//       )
//     );
//   };

//   const handleDelete = (notificationId: string) => {
//     setNotifications((prevNotifications) =>
//       prevNotifications.filter((n) => n.id !== notificationId)
//     );

//     const deleteFromDB = async () => {
//       const { error } = await supabase
//         .from("notifications")
//         .delete()
//         .eq("id", notificationId);

//       if (error) {
//         console.error("Error deleting notification:", error);
//       }
//     };

//     deleteFromDB();
//   };

//   return (
//     <>
//       <div className="flex justify-between items-center">
//         <h3 className="ml-2 text-xl font-semibold">알림 목록</h3>

//         <button
//           className="cursor-pointer leading-none border-b text-[#717182] disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
//           onClick={handleDeleteAll}
//           disabled={isDeleting || notifications.length === 0} // 삭제 중이거나, 알림이 0개면 비활성화
//         >
//           {isDeleting ? "삭제 중..." : "알림 삭제"}
//         </button>
//       </div>
//       <div className="space-y-4">
//         {notifications.length === 0 ? (
//           <p className="text-center text-gray-500 dark:text-white">
//             새 알림이 없습니다.
//           </p>
//         ) : (
//           notifications.map((n) => (
//             <NotificationItem
//               key={n.id}
//               data={n}
//               onMarkAsRead={handleMarkAsRead}
//               onDelete={handleDelete}
//             />
//           ))
//         )}
//       </div>
//     </>
//   );
// }
