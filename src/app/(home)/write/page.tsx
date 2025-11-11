import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { WritePostForm } from "@/components/write/WritePostForm";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: hashtags } = await supabase.from("hashtags").select("*");
  if (!hashtags) return null;

  return (
    <>
      <WritePostForm hashtags={hashtags} />
    </>
  );
}
