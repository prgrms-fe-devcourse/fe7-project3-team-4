import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import "@/assets/css/index.css";

// 로그인한 사용자가 접근하면 홈으로 이동 하는 레이아웃

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return <>{children}</>;
}
