import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { WritePostForm } from "@/components/write/WritePostForm";
import { Hashtag, Post } from "@/types";
import { ParsedPostContent, parsePostContent } from "@/utils/parsePostContent";

type PageProps = {
  searchParams?: Promise<{
    mode?: string; // "edit" | undefined
    postId?: string; // 수정할 게시글 id
    type?: string; // "prompt" | "free" | "weekly" 등
  }>;
};

export default async function WritePageClient({ searchParams }: PageProps) {
  const search = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?from=write");
  }

  const { data: hashtags } = await supabase.from("hashtags").select("*");
  if (!hashtags) return null;

  // 쿼리스트링에서 모드, 타입, postId 추출
  const mode = search?.mode === "edit" ? "edit" : "create";
  const postId = search?.postId ?? null;
  const initialPostType = search?.type as PostType | null;

  let initialPost: Post | null = null;

  // 수정 모드 + postId 있을 때 기존 게시글 조회
  if (mode === "edit" && postId) {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (error) {
      console.error("[write/page] 게시글 불러오기 실패:", error);
      // 필요하면 404 페이지로 보내도 됨
      // redirect("/not-found");
    } else {
      initialPost = data;
    }
  }

  const parsed: ParsedPostContent = initialPost?.content
    ? parsePostContent(initialPost.content)
    : {
        promptInput: null,
        resultText: null,
        resultImageUrl: null,
        resultLink: null,
      };

  // DB에 result_mode 컬럼이 있다면 우선 사용
  const dbResultMode = initialPost?.result_mode as ResultMode | undefined;

  const effectiveResultMode: ResultMode =
    dbResultMode ??
    // 둘 다 없으면, 이미지 유무 기반으로 최후 추론
    (parsed.resultImageUrl ? "Image" : "Text");

  // Prompt 결과 값: Text 모드면 text, Image 모드면 image URL
  const initialPromptResult =
    effectiveResultMode === "Image"
      ? parsed.resultImageUrl ?? ""
      : parsed.resultText ?? "";

  return (
    <>
      <section className="relative max-w-2xl mx-auto px-6">
        <WritePostForm
          hashtags={hashtags}
          // 생성/수정 모드
          mode={mode}
          // 수정 대상 게시글 id
          postId={postId ?? undefined}
          // 타입 잠그기용 (URL + 실제 post 기록 중 우선순위는 아래 컴포넌트에서 처리)
          initialPostType={
            (initialPost?.post_type as PostType) ?? initialPostType
          }
          // 미리 채울 값들
          initialTitle={initialPost?.title ?? ""}
          initialSubtitle={initialPost?.subtitle ?? ""}
          initialThumbnail={initialPost?.thumbnail}
          initialHashtags={initialPost?.hashtags as Hashtag["name"][]}
          // 프롬프트에 들어갈 정보
          initialModel={(initialPost?.model as ModelType) ?? ""}
          initialResultMode={(initialPost?.result_mode as ResultMode) ?? ""}
          initialPromptInput={parsed.promptInput ?? ""}
          initialPromptResult={initialPromptResult}
          initialResultLink={parsed.resultLink ?? ""}
        />
      </section>
    </>
  );
}
