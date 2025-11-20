/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/notify/NotifyHomeClient.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import type { NotificationWithDetails } from "@/types/notification";
import { NotificationList } from "@/components/notify/NotificationList";

interface NotifyHomeClientProps {
  userId: string;
}

export default function NotifyHomeClient({ userId }: NotifyHomeClientProps) {
  const [notifications, setNotifications] = useState<NotificationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // 알림 데이터 가져오기
  const fetchNotifications = async () => {
    const { data, error } = await supabase.rpc("get_notifications_with_details");
    
    if (error) {
      console.error("Failed to fetch notifications:", error);
      return;
    }
    
    setNotifications(data as NotificationWithDetails[]);
    setIsLoading(false);
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  // 실시간 알림 구독
  useEffect(() => {
    const channel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          // 알림 변경 시 데이터 다시 가져오기
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  // 실시간 프로필 변경 구독
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
        (payload: any) => {
          const newProfile = payload.new;
          if (!newProfile?.id) return;

          // 프로필 변경 시 해당 사용자의 알림만 업데이트
          setNotifications((prev) =>
            prev.map((n) => {
              if (n.sender && n.sender.id === newProfile.id) {
                return {
                  ...n,
                  sender: {
                    ...n.sender,
                    display_name: newProfile.display_name ?? n.sender.display_name,
                    avatar_url: newProfile.avatar_url ?? n.sender.avatar_url,
                    equipped_badge_id: newProfile.equipped_badge_id ?? n.sender.equipped_badge_id,
                  },
                };
              }
              return n;
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  if (isLoading) {
    return (
      <section className="relative max-w-2xl mx-auto px-6">
        <div className="mt-6 space-y-6">
          <div className="text-center p-4">알림을 불러오는 중...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative max-w-2xl mx-auto px-6">
      <div className="mt-6 space-y-6">
        <NotificationList 
          notifications={notifications}
          userId={userId}
          onUpdate={fetchNotifications}
        />
      </div>
    </section>
  );
}

// import { createClient } from "@/utils/supabase/server";
// import { redirect } from "next/navigation";
// import type { NotificationWithDetails } from "@/types/notification";
// import { NotificationList } from "@/components/notify/NotificationList";

// type SupabaseClientType = Awaited<ReturnType<typeof createClient>>;

// async function fetchInitialNotifications(supabase: SupabaseClientType) {
//   const { data, error } = await supabase.rpc("get_notifications_with_details");

//   if (error) {
//     console.error("Error fetching notifications:", error);
//     return [];
//   }
//   return data as NotificationWithDetails[];
// }

// export default async function NotifyHomeClient() {
//   const supabase = await createClient();
//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   if (!user) {
//     redirect("/login?message=로그인이 필요합니다.");
//   }

//   const initialNotifications = await fetchInitialNotifications(supabase);

//   return (
//     <>
//       <section className="relative max-w-2xl mx-auto px-6">
//         <div className="mt-6 space-y-6">
//           <NotificationList
//             initialNotifications={initialNotifications}
//             userId={user.id}
//           />
//         </div>
//       </section>
//     </>
//   );
// }
