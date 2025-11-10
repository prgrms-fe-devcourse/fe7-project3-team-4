"use client";

import { MouseEvent } from "react";

type ProfileEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ProfileEditModal({ isOpen, onClose }: ProfileEditModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="z-50 fixed inset-0 bg-black/70"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-100 lg:w-110 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 bg-[#f6f6f6]/60 border-white/40 rounded-2xl"
      >
        <h3 className="text-xl font-medium mb-7">프로필 편집</h3>
        <form className="space-y-5">
          <div>
            <label htmlFor="name">이름</label>
            <input
              id="name"
              type="text"
              className="bg-white rounded-lg py-2 px-3 w-full outline-0"
            />
          </div>

          <div>
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              type="text"
              className="bg-white rounded-lg py-2 px-3 w-full outline-0"
            />
          </div>

          <div>
            <label htmlFor="bio">자기소개</label>
            <textarea
              id="bio"
              rows={3}
              className="bg-white rounded-lg py-2 px-3 w-full resize-none outline-0"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="cursor-pointer py-1.5 px-4 bg-white rounded-lg"
              onClick={onClose}
            >
              취소
            </button>
            <button
              type="submit"
              className="cursor-pointer py-1.5 px-4 bg-[#6758FF] rounded-lg text-white"
              onClick={onClose}
            >
              수정
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
