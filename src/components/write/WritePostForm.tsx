/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Database, Hashtag, Post } from "@/types";
import { useToast } from "../common/toast/ToastContext";

type WritePostFormProps = {
  hashtags: Hashtag[];
  // 생성/수정 모드
  mode?: "create" | "edit";
  // 수정 대상 게시글 id
  postId?: string;
  // 타입 잠그기용 (URL + 실제 post 기록 중 우선순위는 아래 컴포넌트에서 처리)
  initialPostType?: PostType;
  // 미리 채울 값들
  initialTitle?: string;
  initialSubtitle?: string;
  initialContentJson?: any;
  initialThumbnail?: string | null;
  initialPromptInput?: string;
  initialPromptResult?: string;
  initialResultLink?: string;
  initialHashtags?: Hashtag["name"][];
  // 프롬프트에 들어갈 정보
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

  // 수정 모드인지 여부
  const isEdit = mode === "edit" && !!postId;

  // postType 초기값을 props에서 받아오고, 없으면 "prompt"
  const [postType, setPostType] = useState<PostType>(
    initialPostType ?? "prompt"
  );

  // 수정 모드일 때는 타입을 변경 못 하게 잠그는 플래그
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

      // if (!user) {
      //   showToast({
      //     title: "접근 실패",
      //     message: "로그인 후 이용 가능합니다.",
      //     variant: "warning",
      //   });
      //   // router.push("/auth/login");
      //   return;
      // }

      // select가 disabled면 null 이라서 state fallback 사용
      const type =
        ((formData.get("postType") as PostType) || postType) ?? "prompt";
      const title = ((formData.get("title") as string) ?? initialTitle).trim();
      const rawContent = formData.get("content_raw") as string | null;
      let baseDoc: any = null;

      // 1) form에서 넘어온 값이 있으면 먼저 시도
      if (rawContent && rawContent.trim() !== "") {
        try {
          baseDoc = JSON.parse(rawContent);
        } catch (e) {
          console.error("[WritePostForm] JSON parse error for content_raw", e);
          baseDoc = null;
        }
      }

      // 2) baseDoc이 비었거나 content 배열이 없으면 (특히 수정모드)
      if (
        (!baseDoc || !Array.isArray(baseDoc.content)) &&
        mode === "edit" &&
        initialContentJson
      ) {
        // 수정 페이지에서 아무 것도 안 건드린 경우: 기존 내용 사용
        baseDoc = initialContentJson;
      }

      // 3) 그래도 없으면 진짜로 '내용 없음' 처리
      if (!baseDoc || !Array.isArray(baseDoc.content)) {
        showToast({
          title: "작성 실패",
          message: "내용을 입력해주세요.",
          variant: "warning",
        });
        return;
      }

      // subtitle 비어 있으면 기존 subtitle
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

      // ----- 이미지 업로드 (대표 + 결과이미지) -----
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

        // 프롬프트 입력
        promptInput =
          ((formData.get("promptInput") as string) || "").trim() || null;

        if (isEdit && !promptInput && initialPromptInput) {
          // 수정에서 안 고치면 이전 값 유지
          promptInput = initialPromptInput;
        }

        // 결과 링크
        resultLink =
          ((formData.get("resultLink") as string) || "").trim() || null;
        // 수정에서 안 고치면 이전 값 유지
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

        // 프롬프트 입력한 결과 (이미지)
        if (resultMode === "Image") {
          const resultImgFile = formData.get(
            "promptResultImage"
          ) as File | null;

          if (resultImgFile && resultImgFile.size > 0) {
            // 새 이미지 업로드
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
            // 수정 모드 + 새 파일 없음 -> 기존 이미지 URL 유지
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

        // 오타 수정: isPromptLike -> isPromptLikePost
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

      // ----- 최종 content 구성 (이미지 -> 본문) -----
      const extendedContent: any[] = [];

      // 1) 대표 이미지
      extendedContent.push({
        type: "image",
        attrs: {
          src: mainImageUrl ?? "",
          alt: title || "",
        },
      });

      // 2) 에디터 내용
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

      // 항상 Doc 래퍼 유지
      const finalDoc = {
        type: "doc",
        content: extendedContent,
      };

      // insert vs update 분기
      let savedPost: Post | null = null;
      if (isEdit && postId) {
        // 수정(update)
        const { data, error } = await supabase
          .from("posts")
          .update({
            // user_id는 바꾸지 않음
            post_type: type, // 타입은 고정 상태지만, 안전하게 다시 써줌
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
          .eq("user_id", user.id) // 본인 글만 수정 가능
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

      // 공통 리다이렉트 (수정/등록 모두)
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
