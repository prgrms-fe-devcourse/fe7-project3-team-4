import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import type { NotificationWithDetails } from "@/types/notification";
import { NotificationList } from "@/components/notify/NotificationList";
import { Suspense } from "react"; // 1. Suspense 임포트

type SupabaseClientType = Awaited<ReturnType<typeof createClient>>;

// 2. (권장) 페이지를 동적으로 렌더링하도록 설정
// NotificationList가 useSearchParams를 사용하므로 이 페이지는 동적이어야 합니다.
export const dynamic = "force-dynamic";

async function fetchInitialNotifications(supabase: SupabaseClientType) {
  const { data, error } = await supabase.rpc("get_notifications_with_details");

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
  return data as NotificationWithDetails[];
}

// 3. 로딩 중에 보여줄 Fallback 컴포넌트
function NotificationLoadingFallback() {
  return (
    <section className="relative max-w-2xl mx-auto">
      <div className="mt-6 space-y-6">
        <p className="text-center text-[#717182]">알림을 불러오는 중...</p>
        {/* 또는 스켈레톤 UI를 여기에 넣을 수 있습니다. */}
      </div>
    </section>
  );
}

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=로그인이 필요합니다.");
  }

  const initialNotifications = await fetchInitialNotifications(supabase);

  return (
    <>
      <section className="relative max-w-2xl mx-auto">
        <div className="mt-6 space-y-6">
          {/* 4. <Suspense>로 감싸기 */}
          <Suspense fallback={<NotificationLoadingFallback />}>
            <NotificationList
              initialNotifications={initialNotifications}
              userId={user.id}
            />
          </Suspense>
        </div>
      </section>
    </>
  );
}