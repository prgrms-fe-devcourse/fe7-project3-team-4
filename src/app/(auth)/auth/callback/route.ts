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
      .select("exist_id") // 컬럼명을 "id"가 아닌 "exist_id"로 가정합니다.
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

    if (!profile || !profile.exist_id) {
      // usersetting으로 보내기 전에 exist_id를 true로 업데이트합니다.
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ exist_id: true })
        .eq("id", user.id);

      if (updateError) {
        console.error(" Profile update error:", updateError.message);
        return NextResponse.redirect(
          `${origin}/auth/auth-code-error?step=profile_update`
        );
      }

      redirectPath = "/usersetting"; //로그인 성공시 이동하는 경로
    } else {
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
