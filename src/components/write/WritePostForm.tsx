/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
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
import { Database, Hashtag, Post } from "@/types";
import { useToast } from "../common/toast/ToastContext";

type WritePostFormProps = {
  hashtags: Hashtag[];
  mode?: "create" | "edit";
  postId?: string;
  initialPostType?: PostType;
  initialTitle?: string;
  initialSubtitle?: string;
  initialContentJson?: any;
  initialThumbnail?: string | null;
  initialPromptInput?: string;
  initialPromptResult?: string;
  initialResultLink?: string;
  initialHashtags?: Hashtag["name"][];
  initialModel?: ModelType;
  initialResultMode?: ResultMode;
};

export function WritePostForm({
  hashtags,
  mode = "create",
  postId,
  initialPostType,
  initialTitle = "",
  initialSubtitle = "",
  initialContentJson,
  initialThumbnail = null,
  initialPromptInput = "",
  initialPromptResult = "",
  initialResultLink = "",
  initialHashtags = [],
  initialModel = "GPT",
  initialResultMode = "Text",
}: WritePostFormProps) {
  const { showToast } = useToast();
  const queryClient = useQueryClient(); 

  const isEdit = mode === "edit" && !!postId;

  const [postType, setPostType] = useState<PostType>(
    initialPostType ?? "prompt"
  );

  const isPostTypeLocked = isEdit;

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
        return;
      }

      const type =
        ((formData.get("postType") as PostType) || postType) ?? "prompt";
      const title = ((formData.get("title") as string) ?? initialTitle).trim();
      const rawContent = formData.get("content_raw") as string | null;
      let baseDoc: any = null;

      if (rawContent && rawContent.trim() !== "") {
        try {
          baseDoc = JSON.parse(rawContent);
        } catch (e) {
          console.error("[WritePostForm] JSON parse error for content_raw", e);
          baseDoc = null;
        }
      }

      if (
        (!baseDoc || !Array.isArray(baseDoc.content)) &&
        mode === "edit" &&
        initialContentJson
      ) {
        baseDoc = initialContentJson;
      }

      if (!baseDoc || !Array.isArray(baseDoc.content)) {
        showToast({
          title: "작성 실패",
          message: "내용을 입력해주세요.",
          variant: "warning",
        });
        return;
      }

      const rawSubtitle = (formData.get("content_text") as string | null) ?? "";
      const contentText = rawSubtitle.trim() || initialSubtitle || "";

      const rawHashtags = (formData.get("hashtags") as string) || "";
      const selectedHashtags =
        (rawHashtags
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean) as Database["public"]["Enums"]["hashtag_type"][]) ||
        initialHashtags;

      if (!title) {
        showToast({
          title: "작성 실패",
          message: "제목을 입력해주세요.",
          variant: "warning",
        });
        return;
      }

      if (!baseDoc || !Array.isArray(baseDoc.content)) {
        showToast({
          title: "작성 실패",
          message: "내용을 입력해주세요.",
          variant: "warning",
        });
        return;
      }

      const isPromptLikePost = type === "prompt" || type === "weekly";

      let mainImageUrl: string = initialThumbnail ?? "";

      const mainImageFile = formData.get("mainImage") as File | null;

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
        resultMode =
          (formData.get("resultMode") as ResultMode) ||
          initialResultMode ||
          null;
        model = (formData.get("model") as ModelType) || initialModel || null;

        promptInput =
          ((formData.get("promptInput") as string) || "").trim() || null;

        if (isEdit && !promptInput && initialPromptInput) {
          promptInput = initialPromptInput;
        }

        resultLink =
          ((formData.get("resultLink") as string) || "").trim() || null;
        if (isEdit && !resultLink && initialResultLink) {
          resultLink = initialResultLink;
        }

        if (!promptInput) {
          showToast({
            title: "작성 실패",
            message: "사용한 프롬프트를 작성해주세요.",
            variant: "warning",
          });
          return;
        }

        // 프롬프트 입력한 결과 (텍스트)
        if (resultMode === "Text") {
          const result = (formData.get("promptResult") as string) || "";
          promptResultText = result.trim() || null;

          if (isEdit && !promptResultText && initialPromptResult) {
            // 수정에서 안 고친 경우 기존 결과 사용
            promptResultText = initialPromptResult;
          }

          if (!promptResultText) {
            showToast({
              title: "작성 실패",
              message: "프롬프트의 결과 값을 작성해주세요.",
              variant: "warning",
            });
            return;
          }
        }

        if (resultMode === "Image") {
          const resultImgFile = formData.get(
            "promptResultImage"
          ) as File | null;

          if (resultImgFile && resultImgFile.size > 0) {

            promptResultImageUrl = await uploadPromptResultImage(
              supabase,
              user.id,
              resultImgFile
            );
          } else if (
            isEdit &&
            initialResultMode === "Image" &&
            initialPromptResult
          ) {
            promptResultImageUrl = initialPromptResult;
          } else {
            showToast({
              title: "작성 실패",
              message: "프롬프트의 결과 값의 이미지를 첨부해주세요.",
              variant: "warning",
            });
            return;
          }
        }

        if (isPromptLikePost && !isAllChecked) {
          showToast({
            title: "작성 실패",
            message:
              "프롬프트 관련 게시글 등록을 위해 자가진단 문항을 모두 체크해주세요.",
            variant: "warning",
          });
          return;
        }
      }

      const extendedContent: any[] = [];


      extendedContent.push({
        type: "image",
        attrs: {
          src: mainImageUrl ?? "",
          alt: title || "",
        },
      });

      extendedContent.push(
        ...(Array.isArray(baseDoc.content) ? baseDoc.content : [])
      );

      if (isPromptLikePost) {
        if (promptInput) {
          extendedContent.push(
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "PromptInput",
                  marks: [{ type: "bold" }],
                },
              ],
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: promptInput }],
            }
          );
        }

        if (resultMode === "Text" && promptResultText) {
          extendedContent.push(
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "PromptResult",
                  marks: [{ type: "bold" }],
                },
              ],
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: promptResultText }],
            }
          );
        }

        if (resultMode === "Image" && promptResultImageUrl) {
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

      const finalDoc = {
        type: "doc",
        content: extendedContent,
      };

      let savedPost: Post | null = null;
      if (isEdit && postId) {

        const { data, error } = await supabase
          .from("posts")
          .update({
            
            post_type: type, 
            title,
            content: finalDoc,
            hashtags: selectedHashtags,
            model,
            result_mode: resultMode,
            is_prompt_like: isPromptLikePost,
            thumbnail: mainImageUrl,
            subtitle: contentText,
          })
          .eq("id", postId)
          .eq("user_id", user.id) 
          .select()
          .single();

        if (error) {
          console.error("[WritePostForm] update error", error);
          showToast({
            title: "수정 실패",
            message: "게시글 수정에 실패했습니다.",
            variant: "error",
          });
          return;
        }

        savedPost = data;
        showToast({
          title: "수정 완료",
          message: "게시글이 수정되었습니다.",
          variant: "success",
        });
      } else {
        // 새 글 작성(insert)
        const { data, error } = await supabase
          .from("posts")
          .insert({
            user_id: user.id,
            post_type: type,
            title,
            content: finalDoc,
            hashtags: selectedHashtags,
            model,
            result_mode: resultMode,
            is_prompt_like: isPromptLikePost,
            thumbnail: mainImageUrl,
            subtitle: contentText,
          })
          .select()
          .single();

        if (error) {
          console.error("[WritePostForm] insert error", error);
          showToast({
            title: "등록 실패",
            message: "게시글 등록에 실패했습니다.",
            variant: "error",
          });
          return;
        }

        savedPost = data;
        showToast({
          title: "등록 완료",
          message: "게시글이 등록되었습니다.",
          variant: "success",
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["posts"] });


      if (savedPost) {
        router.push(`/?type=${savedPost.post_type}&id=${savedPost.id}`);
      }
    } catch (err) {
      console.error("[WritePostForm] catch error", err);
      showToast({
        title: "오류",
        message: "알 수 없는 오류가 발생했습니다.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10 mt-6 lg:mt-0">
      <PostTypeSelect
        postType={postType}
        onChange={setPostType}
        isLocked={isPostTypeLocked}
      />

      <MainEditorSection
        hashtags={hashtags}
        initialTitle={initialTitle}
        initialSubtitle={initialSubtitle}
        initialContentJson={initialContentJson}
        initialSelectedHashtags={initialHashtags}
        initialThumbnail={initialThumbnail ?? undefined}
      />

      {isPromptLike && (
        <>
          <PromptResultSection
            initialModel={initialModel}
            initialResultMode={initialResultMode}
            initialPromptInput={initialPromptInput}
            initialPromptResult={initialPromptResult}
            initialResultLink={initialResultLink}
          />

          <SelfCheckList values={selfCheck} onChange={setSelfCheck} />
        </>
      )}

      <div className="flex justify-center mb-10">
        <button
          type="submit"
          disabled={isSubmitting}
          className="cursor-pointer px-6 py-2.5 rounded-xl bg-[#6758FF] text-white text-lg shadow-sm disabled:opacity-60"
        >
          {mode === "edit"
            ? isSubmitting
              ? "수정 중..."
              : "수정하기"
            : isSubmitting
            ? "등록 중..."
            : "게시하기"}
        </button>
      </div>
    </form>
  );
}