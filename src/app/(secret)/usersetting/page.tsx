import UserSettingForm from "@/components/auth/UserSettingForm";
import { FormState } from "@/types";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function UserSettingPage({
  searchParams,
}: {
  searchParams: Promise<{ url: string }>;
}) {
  const { url } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(url ? url : "/"); // or redirect("/login")
  }

  const { data: profileRows, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    redirect("/auth/login-failed");
  }

  const profile = profileRows;

  async function updateProfile(
    prevState: FormState,
    formData: FormData
  ): Promise<FormState> {
    "use server";

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user || userError) {
      return {
        success: false,
        error: "로그인이 필요합니다.",
      };
    }

    const displayName = formData.get("display_name")?.toString() ?? "";

    const { error: updateErrors } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", user.id);

    if (updateErrors) {
      return {
        success: false,
        error: "프로필 저장중에 문제가 발생하였습니다.",
      };
    }

    return { success: true, error: null };
  }

  return <UserSettingForm profile={profile} action={updateProfile} url={url} />;
}
