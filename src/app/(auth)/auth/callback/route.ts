import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/";
  if (!next.startsWith("/")) {
    next = "/";
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    // 세션 교환 실패 확인
    if (error) {
      console.error(" exchangeCodeForSession error:", error.message);
      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?step=exchange`
      );
    }

    const {
      data: { user },
      error: UserError,
    } = await supabase.auth.getUser();

    // 사용자 정보 가져오기 실패 확인
    if (UserError || !user) {
      console.error(" getUser error:", UserError?.message);
      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?step=get_user`
      );
    }

    const { data: profileRows, error: profileError } = await supabase
      .from("profiles")
      .select("bio")
      .eq("id", user.id)
      .limit(1);

    // 프로필 조회 실패 확인 (RLS 문제일 가능성 높음)
    if (profileError) {
      console.error(" Profile query error:", profileError.message);
      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?step=profile_query`
      );
    }

    const profile = profileRows?.[0];
    let redirectPath: string = "";
    if (!profile || !profile.bio || profile.bio.trim() === "") {
      console.log("Redirecting to /additionalInfo");
      redirectPath = "/additionalInfo"; //로그인 성공시 이동하는 경로
    } else {
      console.log("Redirecting to 'next':", next);
      redirectPath = next;
    }

    const forwardedHost = request.headers.get("x-forwarded-host");
    const isLocalEnv = process.env.NODE_ENV === "development";
    if (isLocalEnv) {
      return NextResponse.redirect(`${origin}${redirectPath}`);
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`);
    } else {
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  console.error("No code found in URL.");
  return NextResponse.redirect(`${origin}/auth/auth-code-error?step=no_code`);
}
