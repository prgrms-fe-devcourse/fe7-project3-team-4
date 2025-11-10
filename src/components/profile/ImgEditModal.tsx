"use client";

import { MouseEvent } from "react";

type ImgEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ImgEditModal({ isOpen, onClose }: ImgEditModalProps) {
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
        <h3 className="text-xl font-medium mb-7">프로필 이미지 편집</h3>
        <form className="space-y-5">
          <div className="flex flex-col gap-4 items-center py-8 rounded-xl bg-white">
            <input
              id="imgFile"
              accept="image/*"
              className="hidden"
              type="file"
              name="imgFile"
            />
            <p className="text-[#404040]">Upload image</p>
            <label
              htmlFor="imgFile"
              className="px-5 py-3 rounded-xl text-[#404040] bg-[#D0D0D0] cursor-pointer"
            >
              Choose Img File
            </label>
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
