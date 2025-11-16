// 로그인을 하지 않은 사용자가 있으면 로그인 페이지로 이동 하는 레이아웃
import "@/assets/css/index.css";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function SecretLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    redirect("/auth/login");
  }

  return <>{children}</>;
}
