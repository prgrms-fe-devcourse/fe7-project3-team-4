// src/components/home/history/HistoryPostForm.tsx
"use client";

import { createClient } from "@/utils/supabase/client";
import { ViewHistoryType } from "@/types/Post";
import HistoryClientView from "./HistoryPostHeader";
import { redirect } from "next/navigation";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

interface HistoryPostFormProps {
  userId: string;
}

  if (!user) {
    redirect("/auth/login?from=history");
  }
// 실시간 페이로드 타입 정의
type ProfilesRealtimePayload = {
  new?: {
    id?: string;
    display_name?: string | null;
    avatar_url?: string | null;
    equipped_badge_id?: string | null;
  };
};

const getHistoryViews = async (userId: string) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_post_views")
    .select(
      `
      id,
      viewed_at,
      posts (
        id,
        title,
        subtitle,
        post_type,
        model,
        hashtags,
        created_at,
        user_id,
        profiles!posts_user_id_fkey ( 
          display_name, 
          email, 
          avatar_url,
          equipped_badge_id 
        )
      )
    `
    )
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false })
    .limit(20);

  if (error) {
    throw error;
  }
  return data as ViewHistoryType[];
};

export default function HistoryPostForm({ userId }: HistoryPostFormProps) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const { data: views } = useSuspenseQuery({
    queryKey: ["history", userId],
    queryFn: () => getHistoryViews(userId),
    staleTime: 1000 * 60 * 5,
  });

  // ⭐️ 실시간 프로필 변경 감지 및 캐시 업데이트
  useEffect(() => {
    const channel = supabase
      .channel("history-profiles-changes")
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

          // 캐시 데이터를 수정하여 UI에 즉시 반영
          queryClient.setQueryData(
            ["history", userId],
            (oldData: ViewHistoryType[] | undefined) => {
              if (!oldData) return oldData;

              return oldData.map((view) => {
                const post = view.posts;
                // 게시글 작성자가 변경된 프로필의 유저라면 정보 업데이트
                if (post && post.user_id === newProfile.id && post.profiles) {
                  return {
                    ...view,
                    posts: {
                      ...post,
                      profiles: {
                        ...post.profiles,
                        display_name:
                          newProfile.display_name ?? post.profiles.display_name,
                        avatar_url:
                          newProfile.avatar_url ?? post.profiles.avatar_url,
                        equipped_badge_id:
                          newProfile.equipped_badge_id ??
                          post.profiles.equipped_badge_id,
                      },
                    },
                  };
                }
                return view;
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

  if (!views || views.length === 0) {
    return (
      <div>
        <div className="flex justify-between items-center">
          <h3 className="ml-2 text-xl font-semibold">게시글 조회 목록</h3>
          <button
            disabled
            className="cursor-pointer leading-none border-b text-[#717182] disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
          >
            내역 삭제
          </button>
        </div>
        <div className="mt-7 text-center text-gray-500 dark:text-white">
          조회 내역이 없습니다.
        </div>
      </div>
    );
  }

  return <HistoryClientView views={views} />;
}

// // src/components/home/history/HistoryPostForm.tsx
// "use client";

// import { createClient } from "@/utils/supabase/client";
// import { ViewHistoryType } from "@/types/Post";
// import HistoryClientView from "./HistoryPostHeader";
// import { useSuspenseQuery } from "@tanstack/react-query";

// interface HistoryPostFormProps {
//   userId: string;
// }

// const getHistoryViews = async (userId: string) => {
//   const supabase = createClient();
//   const { data, error } = await supabase
//     .from("user_post_views")
//     .select(
//       `
//       id,
//       viewed_at,
//       posts (
//         id,
//         title,
//         subtitle,
//         post_type,
//         model,
//         hashtags,
//         created_at,
//         profiles!posts_user_id_fkey ( display_name, email, avatar_url )
//       )
//     `
//     )
//     .eq("user_id", userId)
//     .order("viewed_at", { ascending: false })
//     .limit(20);

//   if (error) {
//     throw error;
//   }
//   return data as ViewHistoryType[];
// };

// export default function HistoryPostForm({ userId }: HistoryPostFormProps) {
//   const { data: views } = useSuspenseQuery({
//     queryKey: ["history", userId],
//     queryFn: () => getHistoryViews(userId),
//     staleTime: 1000 * 60 * 5, // 5분 캐시
//   });

//   if (!views || views.length === 0) {
//     return (
//       <div>
//         <div className="flex justify-between items-center">
//           <h3 className="ml-2 text-xl font-semibold">게시글 조회 목록</h3>
//           <button
//             disabled
//             className="cursor-pointer leading-none border-b text-[#717182] disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
//           >
//             내역 삭제
//           </button>
//         </div>
//         <div className="mt-7 text-center text-gray-500 dark:text-white">
//           조회 내역이 없습니다.
//         </div>
//       </div>
//     );
//   }

//   return <HistoryClientView views={views} />;
// }

// import { createClient } from "@/utils/supabase/server";
// import { ViewHistoryType } from "@/types/Post";
// import HistoryClientView from "./HistoryPostHeader";

// export default async function HistoryPostForm() {
//   const supabase = await createClient();
//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   if (!user) return <div>로그인이 필요합니다.</div>;

//   const { data: views, error } = await supabase
//     .from("user_post_views")
//     .select(
//       `
//       id,
//       viewed_at,
//       posts (
//         id,
//         title,
//         subtitle,
//         post_type,
//         model,
//         hashtags,
//         created_at,
//         profiles!posts_user_id_fkey ( display_name, email, avatar_url )
//       )
//     `
//     )
//     .eq("user_id", user.id)
//     .order("viewed_at", { ascending: false })
//     .limit(20);

//   if (error) {
//     console.error("HistoryPostForm 쿼리 오류:", error);
//     return <div>오류가 발생했습니다. (원인: {error.message})</div>;
//   }

//   if (!views || views.length === 0) {
//     return (
//       <div>
//         <div className="flex justify-between items-center">
//           <h3 className="ml-2 text-xl font-semibold">게시글 조회 목록</h3>
//           <button
//             disabled
//             className="cursor-pointer leading-none border-b text-[#717182] disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
//           >
//             내역 삭제
//           </button>
//         </div>
//         <div className="mt-7 text-center text-gray-500 dark:text-white">
//           조회 내역이 없습니다.
//         </div>
//       </div>
//     );
//   }

//   return <HistoryClientView views={views as ViewHistoryType[]} />;
// }
