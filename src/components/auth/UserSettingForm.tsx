"use client";

import { FormState, Profile } from "@/types";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

export default function UserSettingForm({
  profile,
  action,
  url,
}: {
  profile: Profile;
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  url: string;
}) {
  const [state, formAction, isPending] = useActionState(action, {
    success: false,
    error: null,
  });
  const router = useRouter();

  useEffect(() => {
    if (state.success && !state.error) {
      alert("프로필이 성공적으로 업데이트 되었습니다.");
      router.push(url ? url : "/");
    }
  }, [state.success, state.error, url, router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(126.44deg, #EFF5FE 18.41%, #FBF3FB 81.59%)",
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-300/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-teal-300/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-[600px]">
        <div className="bg-white rounded-xl px-6 py-5 shadow-xl shadow-gray-300/50">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            내 프로필 생성하기
          </h1>

          <form action={formAction} className="space-y-5">
            {state.error && (
              <p className="text-xs font-medium text-red-600 text-center border border-red-200 bg-red-50 p-1.5 rounded-lg">
                {state.error}
              </p>
            )}
            <div className="mb-1">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-500 mb-1"
              >
                닉네임
              </label>
              <input
                type="text"
                name="display_name"
                defaultValue={profile?.display_name ?? ""}
                id="name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 transition-all duration-150"
                placeholder="닉네임을 입력하세요."
                required
              />
            </div>
            <div className="text-center pt-3 mb-2">
              <span className="text-[10px] text-gray-400 leading-snug">
                {"이 스페이스에 접속하면, "}
                <a href="#" className="text-purple-600 hover:text-purple-700">
                  이용 약관
                </a>
                {" 및 "}
                <a href="#" className="text-purple-600 hover:text-purple-700">
                  개인정보처리방침
                </a>
                {" 에 동의하고 14세 이상임을 확인하게 됩니다."}
              </span>
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center px-4 py-3 rounded-lg text-white font-bold text-base bg-linear-to-r from-[#6D28D9] to-[#9333EA] hover:from-[#7C3AED] hover:to-[#9F48EB] transition-all duration-200 shadow-lg shadow-purple-400/50 hover:shadow-xl hover:scale-[1.005] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "입장하는 중..." : "입장하기"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
