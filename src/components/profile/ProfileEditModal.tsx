"use client";

// [1] useActionState, useEffect, MouseEvent 임포트
import { MouseEvent, useActionState, useEffect } from "react";
import { FormState, Profile } from "@/types"; // [1.1] 타입 임포트

type ProfileEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile; // [2.1] profile prop 추가
  action: (prevState: FormState, formData: FormData) => Promise<FormState>; // [2.2] action prop 추가
};

export function ProfileEditModal({
  isOpen,
  onClose,
  profile,
  action,
}: ProfileEditModalProps) {
  // [3] useActionState 훅 사용 (UserSettingForm.tsx 참고)
  const [state, formAction, isPending] = useActionState(action, {
    success: false,
    error: null,
  });

  // [4] 서버 액션 성공 시 모달 닫기
  useEffect(() => {
    if (state.success && !state.error) {
      alert("프로필이 성공적으로 업데이트 되었습니다.");
      onClose();
    }
  }, [state.success, state.error, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="z-50 fixed inset-0 bg-black/70 flex items-center justify-center" // [5] 중앙 정렬
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md lg:max-w-lg relative p-6 bg-[#f6f6f6]/60 border-white/40 rounded-2xl backdrop-blur-md" // [5.1] 스타일 수정
      >
        <h3 className="text-xl font-medium mb-7">프로필 편집</h3>

        {/* [6] formAction과 서버 액션 연결 */}
        <form action={formAction} className="space-y-5">
          {/* [6.1] 에러 메시지 표시 */}
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
              name="display_name" // [6.2] name 속성
              type="text"
              defaultValue={profile?.display_name ?? ""} // [6.3] defaultValue
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
              defaultValue={profile?.email ?? ""} // 이메일은 보통 수정하지 않음
              className="bg-gray-100 rounded-lg py-2 px-3 w-full outline-0 mt-1 text-gray-500"
              disabled // [6.4] 이메일은 수정 불가
            />
          </div>

          <div>
            <label htmlFor="bio" className="text-sm font-medium">
              자기소개
            </label>
            <textarea
              id="bio"
              name="bio" // [6.2] name 속성
              rows={3}
              defaultValue={profile?.bio ?? ""} // [6.3] defaultValue
              className="bg-white rounded-lg py-2 px-3 w-full resize-none outline-0 mt-1"
              placeholder="자신을 소개해주세요."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="cursor-pointer py-1.5 px-4 bg-white rounded-lg"
              onClick={onClose}
              disabled={isPending} // [6.5] 비활성화
            >
              취소
            </button>
            <button
              type="submit"
              className="cursor-pointer py-1.5 px-4 bg-[#6758FF] rounded-lg text-white disabled:opacity-50"
              disabled={isPending} // [6.5] 비활성화
            >
              {isPending ? "저장 중..." : "수정"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// "use client";

// import { MouseEvent } from "react";

// type ProfileEditModalProps = {
//   isOpen: boolean;
//   onClose: () => void;
// };

// export function ProfileEditModal({ isOpen, onClose }: ProfileEditModalProps) {
//   if (!isOpen) return null;

//   const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
//     if (e.target === e.currentTarget) onClose();
//   };

//   return (
//     <div
//       onClick={handleBackdropClick}
//       className="z-50 fixed inset-0 bg-black/70"
//     >
//       <div
//         onClick={(e) => e.stopPropagation()}
//         className="w-100 lg:w-110 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 bg-[#f6f6f6]/60 border-white/40 rounded-2xl"
//       >
//         <h3 className="text-xl font-medium mb-7">프로필 편집</h3>
//         <form className="space-y-5">
//           <div>
//             <label htmlFor="name">이름</label>
//             <input
//               id="name"
//               type="text"
//               className="bg-white rounded-lg py-2 px-3 w-full outline-0"
//             />
//           </div>

//           <div>
//             <label htmlFor="email">이메일</label>
//             <input
//               id="email"
//               type="text"
//               className="bg-white rounded-lg py-2 px-3 w-full outline-0"
//             />
//           </div>

//           <div>
//             <label htmlFor="bio">자기소개</label>
//             <textarea
//               id="bio"
//               rows={3}
//               className="bg-white rounded-lg py-2 px-3 w-full resize-none outline-0"
//             />
//           </div>

//           <div className="flex justify-end gap-3">
//             <button
//               type="button"
//               className="cursor-pointer py-1.5 px-4 bg-white rounded-lg"
//               onClick={onClose}
//             >
//               취소
//             </button>
//             <button
//               type="submit"
//               className="cursor-pointer py-1.5 px-4 bg-[#6758FF] rounded-lg text-white"
//               onClick={onClose}
//             >
//               수정
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
