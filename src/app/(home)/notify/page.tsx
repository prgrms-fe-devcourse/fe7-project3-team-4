import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import type { NotificationWithDetails } from "@/types/notification";
import { NotificationList } from "@/components/notify/NotificationList";

type SupabaseClientType = Awaited<ReturnType<typeof createClient>>;

async function fetchInitialNotifications(supabase: SupabaseClientType) {
  const { data, error } = await supabase.rpc("get_notifications_with_details");

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
  return data as NotificationWithDetails[];
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
      <div className="mt-6 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="ml-2 text-xl font-semibold">알림 목록</h3>
          <button className="cursor-pointer leading-none border-b text-[#717182]">
            알림 삭제
          </button>
        </div>
        <NotificationList
          initialNotifications={initialNotifications}
          userId={user.id}
        />
      </div>
    </>
  );
}
