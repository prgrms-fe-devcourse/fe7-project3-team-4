import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import MessageClient from "@/components/message/messageClient";
import { Suspense } from "react"; // 1. Suspense를 임포트합니다.

// 2. 이 페이지가 동적임을 명시합니다. (URL 파라미터에 의존하기 때문)
export const dynamic = "force-dynamic";

// 3. (권장) 로딩 중에 보여줄 Fallback 컴포넌트
//    MessageClient의 레이아웃과 유사하게 만들면 좋습니다.
function MessageLoadingFallback() {
  return (
    <div className="w-full h-full pt-10 lg:p-18">
      <div className="lg:max-w-250 mx-auto">
        <div className="bg-white/40 rounded-xl shadow-md lg:shadow-xl h-200 lg:min-w-50 flex items-center justify-center">
          <p className="text-[#717182]">메시지를 불러오는 중...</p>
        </div>
      </div>
    </div>
  );
}

export default async function Page() {
  const supabase = await createClient();

  // 서버에서 사용자 인증 확인
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (error || !user) {
    redirect("/login");
  }

  // 초기 데이터 로드 (선택사항)
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, email")
    .eq("id", user.id)
    .single();

  return (
    // 4. <Suspense>로 MessageClient를 감싸줍니다.
    //    fallback prop에는 로딩 중에 보여줄 UI를 지정합니다.
    <Suspense fallback={<MessageLoadingFallback />}>
      <MessageClient 
        initialUserId={user.id} 
        initialProfile={profile} 
      />
    </Suspense>
  );
}