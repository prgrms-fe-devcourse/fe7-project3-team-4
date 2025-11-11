"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PostTypeSelect } from "./PostTypeSelect";
import { MainEditorSection } from "./MainEditorSection";
import { PromptResultSection } from "./PromptResultSection";
import { SelfCheckList } from "./SelfCheckList";
import { createClient } from "@/utils/supabase/client";
import type { FormEvent } from "react";
import {
  uploadPostMainImage,
  uploadPromptResultImage,
} from "@/utils/supabase/storage/posts";
import { Hashtag } from "@/types";

export function WritePostForm({ hashtags }: { hashtags: Hashtag[] }) {
  const [postType, setPostType] = useState<PostType>("prompt");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const isPromptLike = postType === "prompt" || postType === "weekly";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      console.log("[WritePostForm] submit start");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("[WritePostForm] getUser error", userError);
      }

      if (!user) {
        alert("로그인 후 이용 가능합니다.");
        router.push("/auth/login");
        return;
      }

      const type = (formData.get("postType") as PostType) || postType;
      const title = (formData.get("title") as string)?.trim();
      const content = (formData.get("content") as string)?.trim();
      const rawHashtags = (formData.get("hashtags") as string) || "";
      const selectedHashtags = rawHashtags
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

      const mainImageFile = formData.get("mainImage") as File | null;

      console.log("[WritePostForm] parsed:", {
        type,
        title,
        content,
        selectedHashtags,
        hasMainImage: !!mainImageFile,
      });

      if (!title || !content) {
        alert("제목과 내용을 입력해주세요.");
        return;
      }

      const isPromptLikePost = type === "prompt" || type === "weekly";

      // 대표 이미지 업로드
      let mainImageUrl: string | null = null;
      if (mainImageFile && mainImageFile.size > 0) {
        console.log("[WritePostForm] uploading main image");
        mainImageUrl = await uploadPostMainImage(
          supabase,
          user.id,
          mainImageFile
        );
        console.log("[WritePostForm] main image url:", mainImageUrl);
      }

      // 프롬프트 관련
      let resultMode: ResultMode | null = null;
      let model: ModelType | null = null;
      let promptInput: string | null = null;
      let promptResultText: string | null = null;
      let promptResultImageUrl: string | null = null;
      let resultLink: string | null = null;

      if (isPromptLikePost) {
        resultMode = formData.get("resultMode") as ResultMode;
        model = formData.get("model") as ModelType;

        promptInput =
          ((formData.get("promptInput") as string) || "").trim() || null;
        resultLink =
          ((formData.get("resultLink") as string) || "").trim() || null;

        if (resultMode === "text") {
          const result = (formData.get("promptResult") as string) || "";
          promptResultText = result.trim() || null;
        }

        if (resultMode === "image") {
          const resultImgFile = formData.get(
            "promptResultImage"
          ) as File | null;

          if (resultImgFile && resultImgFile.size > 0) {
            console.log("[WritePostForm] uploading prompt result image");
            promptResultImageUrl = await uploadPromptResultImage(
              supabase,
              user.id,
              resultImgFile
            );
            console.log(
              "[WritePostForm] prompt result image url:",
              promptResultImageUrl
            );
          }
        }
      }

      console.log("[WritePostForm] inserting post row");

      const { data, error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          post_type: type,
          title,
          content: {
            text: content,
            main_image_url: mainImageUrl,
            is_prompt_like: isPromptLikePost,
            result_mode: resultMode,
            prompt_input: promptInput,
            prompt_result_text: promptResultText,
            prompt_result_image_url: promptResultImageUrl,
            result_link: resultLink,
          },
          hashtags: selectedHashtags,
          model,
        })
        .select()
        .single();

      if (error) {
        console.error("[WritePostForm] insert error", error);
        alert("게시글 등록에 실패했습니다.");
        return;
      }

      console.log("[WritePostForm] insert success", data);
      router.push(`/?type=${data.post_type}&id=${data.id}`);
    } catch (err) {
      console.error("[WritePostForm] catch error", err);
      alert("알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <PostTypeSelect postType={postType} onChange={setPostType} />
      <MainEditorSection hashtags={hashtags} />
      {isPromptLike && (
        <>
          <PromptResultSection />
          <SelfCheckList />
        </>
      )}
      <div className="flex justify-center mb-10">
        <button
          type="submit"
          disabled={isSubmitting}
          className="cursor-pointer px-6 py-2.5 rounded-xl bg-[#6758FF] text-white text-lg shadow-sm disabled:opacity-60"
        >
          {isSubmitting ? "등록 중..." : "게시하기"}
        </button>
      </div>
    </form>
  );
}
