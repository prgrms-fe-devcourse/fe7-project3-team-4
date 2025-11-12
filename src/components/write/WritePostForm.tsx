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
import { Database, Hashtag } from "@/types";

export function WritePostForm({ hashtags }: { hashtags: Hashtag[] }) {
  const [postType, setPostType] = useState<PostType>("prompt");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selfCheck, setSelfCheck] = useState({
    q1: false,
    q2: false,
    q3: false,
  });
  const router = useRouter();
  const supabase = createClient();

  const isPromptLike = postType === "prompt" || postType === "weekly";
  const isAllChecked = selfCheck.q1 && selfCheck.q2 && selfCheck.q3;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("로그인 후 이용 가능합니다.");
        router.push("/auth/login");
        return;
      }

      const type = (formData.get("postType") as PostType) || postType;
      const title = (formData.get("title") as string)?.trim();

      const rawContent = formData.get("content_raw") as string | null;
      const baseDoc = rawContent ? JSON.parse(rawContent) : null;

      const contentText = (
        (formData.get("content_text") as string) ?? ""
      ).trim();

      const rawHashtags = (formData.get("hashtags") as string) || "";
      const selectedHashtags = rawHashtags
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean) as Database["public"]["Enums"]["hashtag_type"][];

      if (!title) {
        alert("제목을 입력해주세요.");
        return;
      }

      if (!baseDoc || !Array.isArray(baseDoc.content)) {
        alert("내용을 입력해주세요.");
        return;
      }

      const isPromptLikePost = type === "prompt" || type === "weekly";

      // ----- 이미지 업로드 (대표 + 결과이미지) -----
      const mainImageFile = formData.get("mainImage") as File | null;
      let mainImageUrl: string | null = null;

      if (mainImageFile && mainImageFile.size > 0) {
        mainImageUrl = await uploadPostMainImage(
          supabase,
          user.id,
          mainImageFile
        );
      }

      let resultMode: ResultMode | null = null;
      let model: ModelType | null = null;
      let promptInput: string | null = null;
      let promptResultText: string | null = null;
      let promptResultImageUrl: string | null = null;
      let resultLink: string | null = null;

      if (isPromptLikePost) {
        resultMode = (formData.get("resultMode") as ResultMode) || null;
        model = (formData.get("model") as ModelType) || null;

        promptInput =
          ((formData.get("promptInput") as string) || "").trim() || null;
        resultLink =
          ((formData.get("resultLink") as string) || "").trim() || null;

        if (!promptInput) {
          alert("사용한 프롬프트를 작성해주세요.");
          return;
        }

        if (resultMode === "text") {
          const result = (formData.get("promptResult") as string) || "";
          promptResultText = result.trim() || null;
          if (!promptResultText) {
            alert("프롬프트의 결과 값을 작성해주세요.");
            return;
          }
        }

        if (resultMode === "image") {
          const resultImgFile = formData.get(
            "promptResultImage"
          ) as File | null;

          if (!resultImgFile || resultImgFile.size === 0) {
            alert("프롬프트의 결과 값의 이미지를 첨부해주세요.");
            return;
          }

          promptResultImageUrl = await uploadPromptResultImage(
            supabase,
            user.id,
            resultImgFile
          );
        }

        // ❗ 오타 수정: isPromptLike → isPromptLikePost
        if (isPromptLikePost && !isAllChecked) {
          alert(
            "프롬프트 관련 게시글 등록을 위해 자가진단 문항을 모두 체크해주세요."
          );
          return;
        }
      }

      // ----- 최종 content 구성 (이미지 → 본문) -----
      const extendedContent: any[] = [];

      // 1) 대표 이미지 먼저
      if (mainImageUrl) {
        extendedContent.push({
          type: "image",
          attrs: {
            src: mainImageUrl,
            alt: title || "",
          },
        });
      }

      // 2) 에디터 내용 그대로
      extendedContent.push(
        ...(Array.isArray(baseDoc.content) ? baseDoc.content : [])
      );

      // 3) 프롬프트 블럭들
      if (isPromptLikePost) {
        if (promptInput) {
          extendedContent.push(
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Prompt", marks: [{ type: "bold" }] },
              ],
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: promptInput }],
            }
          );
        }

        if (resultMode === "text" && promptResultText) {
          extendedContent.push(
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Result", marks: [{ type: "bold" }] },
              ],
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: promptResultText }],
            }
          );
        }

        if (resultMode === "image" && promptResultImageUrl) {
          extendedContent.push(
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Result", marks: [{ type: "bold" }] },
              ],
            },
            {
              type: "image",
              attrs: { src: promptResultImageUrl, alt: "프롬프트 결과 이미지" },
            }
          );
        }

        if (resultLink) {
          extendedContent.push({
            type: "paragraph",
            content: [
              {
                type: "text",
                text: resultLink,
                marks: [{ type: "link", attrs: { href: resultLink } }],
              },
            ],
          });
        }
      }

      // 항상 Doc 래퍼 유지
      const finalDoc = {
        type: "doc",
        content: extendedContent,
      };

      // ----- DB 저장 -----
      const { data, error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          post_type: type,
          title,
          content: finalDoc,
          hashtags: selectedHashtags,
          model,
          is_prompt_like: isPromptLikePost,
          thumbnail: mainImageUrl,
          subtitle: contentText,
        })
        .select()
        .single();

      if (error) {
        console.error("[WritePostForm] insert error", error);
        alert("게시글 등록에 실패했습니다.");
        return;
      }

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
          <SelfCheckList values={selfCheck} onChange={setSelfCheck} />
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
