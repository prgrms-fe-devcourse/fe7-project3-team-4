// src/components/profile/ImgEditModal.tsx

"use client";

import { MouseEvent, useState, ChangeEvent, FormEvent } from "react";
import { FormState, Profile } from "@/types";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";

type ImgEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  action: (url: string) => Promise<FormState>; 
};

export function ImgEditModal({
  isOpen,
  onClose,
  profile,
  action,
}: ImgEditModalProps) {
  const [supabase] = useState(() => createClient()); 
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    profile?.avatar_url ?? null
  );

  if (!isOpen) return null;

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file || !profile) {
      setError("파일이 선택되지 않았습니다.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${profile.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) {
        throw new Error("Public URL을 가져오는데 실패했습니다.");
      }

      const newUrl = `${urlData.publicUrl}?t=${new Date().getTime()}`;

      const result = await action(newUrl); 

      if (result.success) {
        alert("프로필 이미지가 변경되었습니다.");
        onClose();
      } else {
        throw new Error(result.error ?? "프로필 URL 저장에 실패했습니다.");
      }
    } catch (err: unknown) {
      console.error("Avatar upload error:", err);
      setError("업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
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
        <h3 className="text-xl font-medium mb-7">프로필 이미지 편집</h3>
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <p className="text-sm font-medium text-red-600 text-center border border-red-200 bg-red-50 p-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-4 items-center py-8 rounded-xl bg-white">

            <div className="w-32 h-32 rounded-full bg-gray-200 relative overflow-hidden">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="프로필 미리보기"
                  layout="fill"
                  objectFit="cover"
                />
              ) : (
                <span className="flex items-center justify-center h-full text-gray-500">
                  이미지
                </span>
              )}
            </div>

            <input
              id="imgFile"
              accept="image/png, image/jpeg, image/gif"
              className="hidden"
              type="file"
              name="imgFile"
              onChange={handleFileChange} 
              disabled={isUploading}
            />
            <label
              htmlFor="imgFile"
              className={`px-5 py-3 rounded-xl text-[#404040] ${
                isUploading
                  ? "bg-gray-300"
                  : "bg-[#D0D0D0] cursor-pointer hover:bg-gray-400"
              }`}
            >
              이미지 파일 선택
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="cursor-pointer py-1.5 px-4 bg-white rounded-lg disabled:opacity-50"
              onClick={onClose}
              disabled={isUploading}
            >
              취소
            </button>
            <button
              type="submit"
              className="cursor-pointer py-1.5 px-4 bg-[#6758FF] rounded-lg text-white disabled:opacity-50"
              disabled={isUploading || !file} 
            >
              {isUploading ? "업로드 중..." : "수정"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}