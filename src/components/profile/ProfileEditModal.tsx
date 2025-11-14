"use client";

import { MouseEvent, useActionState, useEffect, useState } from "react";
import { FormState, Profile } from "@/types";

type ProfileEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
};

export function ProfileEditModal({
  isOpen,
  onClose,
  profile,
  action,
}: ProfileEditModalProps) {
  const [state, formAction, isPending] = useActionState(action, {
    success: false,
    error: null,
  });

  const [didHandle, setDidHandle] = useState(false);

  useEffect(() => {
    if (state.success && !state.error && !didHandle) {
      alert("프로필이 성공적으로 업데이트 되었습니다.");
      onClose();
      setDidHandle(true);
    }
  }, [state.success, state.error, didHandle, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="z-50 fixed inset-0 bg-black/70 flex items-center justify-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg relative p-6 bg-[#f6f6f6]/60 border-white/40 rounded-2xl backdrop-blur-md"
      >
        <h3 className="text-xl font-medium mb-7">프로필 편집</h3>

        <form action={formAction} className="space-y-5">
          {state.error && (
            <p className="text-xs font-medium text-red-600 text-center border border-red-200 bg-red-50 p-1.5 rounded-lg">
              {state.error}
            </p>
          )}

          <div>
            <label htmlFor="display_name" className="text-sm font-medium">
              이름 (닉네임)
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              defaultValue={profile?.display_name ?? ""}
              className="bg-white rounded-lg py-2 px-3 w-full outline-0 mt-1"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="text-sm font-medium">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={profile?.email ?? ""}
              className="bg-gray-100 rounded-lg py-2 px-3 w-full outline-0 mt-1 text-gray-500"
              disabled
            />
          </div>

          <div>
            <label htmlFor="bio" className="text-sm font-medium">
              자기소개
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              defaultValue={profile?.bio ?? ""}
              className="bg-white rounded-lg py-2 px-3 w-full resize-none outline-0 mt-1"
              placeholder="자신을 소개해주세요."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="cursor-pointer py-1.5 px-4 bg-white rounded-lg"
              onClick={onClose}
              disabled={isPending}
            >
              취소
            </button>

            <button
              type="submit"
              className="cursor-pointer py-1.5 px-4 bg-[#6758FF] rounded-lg text-white disabled:opacity-50"
              disabled={isPending}
            >
              {isPending ? "저장 중..." : "수정"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
