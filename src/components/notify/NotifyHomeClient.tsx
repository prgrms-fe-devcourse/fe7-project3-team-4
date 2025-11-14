
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

export default async function NotifyHomeClient() {
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
          <NotificationList
            initialNotifications={initialNotifications}
            userId={user.id}
          />
        </div>
      </section>
    </>
  );
}
