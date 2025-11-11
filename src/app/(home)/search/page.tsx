import NoPosts from "@/components/home/post/NoPosts";
import Post from "@/components/home/post/Post"; // [수정] Post 컴포넌트만 가져옵니다.
import FormClient from "@/components/home/search/FormClient";
import { createClient } from "@/utils/supabase/server";
import { Json } from "@/utils/supabase/supabase";
import Link from "next/link";

// [삭제] MOCKUP_DATA 변수 전체를 삭제합니다.

// [추가] Tiptap/ProseMirror JSON 구조를 위한 타입 (간소화)
// 실제 Tiptap/Prosemirror 타입 정의를 사용하고 있다면 대체해도 됩니다.
type TiptapNode = {
  type: string;
  content?: TiptapNode[];
  text?: string;
  attrs?: {
    src?: string;
    [key: string]: string | undefined;
  };
};

// [추가] content(jsonb)에서 텍스트만 추출하는 헬퍼 함수
// [가정] Tiptap/Prosemirror 구조라고 가정합니다.
const extractTextFromContent = (content: Json | null): string => {
  if (
    !content ||
    typeof content !== "object" ||
    !("content" in content) ||
    !Array.isArray(content.content)
  ) {
    return ""; // 혹은 "내용 없음"
  }

  let text = "";
  const nodes = content.content as TiptapNode[];

  function traverse(nodes: TiptapNode[]) {
    for (const node of nodes) {
      if (node.type === "text" && node.text) {
        text += node.text + " "; // 텍스트 노드 순회
      }
      // paragraph, codeBlock 등 하위 content를 가진 노드들을 재귀적으로 순회
      if (node.content && Array.isArray(node.content)) {
        traverse(node.content);
      }
    }
  }

  traverse(nodes);
  return text.trim(); // "React에서 상태를 관리하는..."
};

// [추가] content(jsonb)에서 첫 번째 이미지 URL을 추출하는 헬퍼 함수
// [가정] Tiptap/Prosemirror 구조라고 가정합니다.
const extractImageFromContent = (content: Json | null): string | undefined => {
  if (
    !content ||
    typeof content !== "object" ||
    !("content" in content) ||
    !Array.isArray(content.content)
  ) {
    return undefined;
  }

  const nodes = content.content as TiptapNode[];

  function findImage(nodes: TiptapNode[]): string | undefined {
    for (const node of nodes) {
      if (node.type === "image" && node.attrs?.src) {
        return node.attrs.src; // 이미지 노드의 src 반환
      }
      if (node.content && Array.isArray(node.content)) {
        const found = findImage(node.content);
        if (found) return found; // 하위 노드에서 찾으면 즉시 반환
      }
    }
    return undefined;
  }

  return findImage(nodes);
};

// [추가] Supabase 데이터 변환 후의 Post 타입 (Mock 데이터 구조와 일치)
// "@/components/home/post/Post"에서 export type Post가 있다면 그걸 사용해도 됩니다.
type ProcessedPost = {
  id: string;
  comment_count: number;
  content: string; // 텍스트로 변환된 content
  created_at: string;
  updated_at?: string;
  like_count: number;
  post_type: "prompt" | "free" | "weekly";
  title: string;
  user_id: string;
  view_count: number;
  email: string;
  image?: string; // 이미지 URL (선택적)
  hashtags: string[];
  isBookmarked: boolean;
  model?: string;
};

// --- 기존 상수 ---
const TAG_LABEL_MAP: Record<string, string> = {
  education: "교육",
  writing: "글쓰기",
  business: "비즈니스",
  script: "스크립트",
  marketing: "마케팅",
  content: "콘텐츠",
  research: "조사",
  play: "놀이",
  sns: "SNS",
  art: "디자인",
  develop: "개발",
  summary: "요약",
};

const SECTION_TITLE_MAP: Record<"prompt" | "free" | "weekly", string> = {
  prompt: "프롬프트",
  free: "자유",
  weekly: "주간",
};
// --- ---

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    tag?: string;
  }>;
}) {
  const supabase = await createClient();
  const { q, tag } = await searchParams;
  const searchTerm = q?.toLowerCase() ?? "";
  const tagTerm = tag?.toLowerCase() ?? "";

  // [추가] 현재 사용자 정보 가져오기 (북마크 확인용)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // [추가] Supabase 쿼리 빌더 시작
  let query = supabase
    .from("posts")
    .select(
      `
      *,
      user_id ( email ),
      user_post_bookmarks ( user_id, post_id )
    `
    )
    .neq("post_type", "news") // 'news' 타입 제외 (Mock 데이터 주석 참고)
    .order("created_at", { ascending: false });

  // [추가] 북마크 필터링: 현재 유저 ID로 user_post_bookmarks를 필터링
  // RLS(정책)가 이미 user_id 기반으로 user_post_bookmarks를 필터링한다면
  // 이 .eq() 조건은 생략하고, map 로직에서 length만 체크해도 됩니다.
  // 여기서는 명시적으로 RLS가 없다고 가정하고 JS에서 필터링합니다.
  if (user) {
    query = query.eq("user_post_bookmarks.user_id", user.id);
  }

  // [추가] 검색어(q) 필터링
  if (searchTerm) {
    // title 또는 content(jsonb를 text로 변환)에서 검색
    query = query.or(
      `title.ilike.%${searchTerm}%,content::text.ilike.%${searchTerm}%`
    );
  }

  // [추가] 태그(tag) 필터링
  if (tagTerm) {
    // hashtags 배열(hashtag_type[])이 tagTerm을 포함하는지 확인
    query = query.contains("hashtags", [tagTerm]);
  }

  // [추가] 쿼리 실행
  const { data: supabasePosts, error } = await query;

  // [수정] 해시태그 데이터 가져오기 (기존 코드)
  const { data: tagData } = await supabase.from("hashtags").select("*");
  if (!tagData) return null; // tagData가 없으면 UI가 깨질 수 있으므로 null 반환

  // [추가] 쿼리 에러 처리
  if (error || !supabasePosts) {
    console.error("Error fetching posts:", error);
    // TODO: 사용자에게 보여줄 에러 컴포넌트
    return <p className="p-6">게시물을 불러오는 데 실패했습니다.</p>;
  }

  // [추가] Supabase 데이터를 컴포넌트 Props 타입(ProcessedPost)으로 변환
  const processedPosts: ProcessedPost[] = supabasePosts.map((post) => {
    // profiles는 객체 (1:N 관계의 N쪽에서 select)
    const email = post.user_id?.email;

    // user_post_bookmarks는 배열. 길이가 0보다 크면 북마크한 것.
    // (위에서 user.id로 .eq() 필터링을 했기 때문)
    const isBookmarked = (post.user_post_bookmarks?.length ?? 0) > 0;

    return {
      // DB에서 직접 가져오는 필드들
      id: post.id,
      user_id: post.user_id ?? "unknown_user",
      title: post.title ?? "제목 없음",
      // post_type이 'news'가 아님은 위에서 필터링함
      post_type: post.post_type as "prompt" | "free" | "weekly",
      model: post.model ?? undefined,
      hashtags: (post.hashtags as string[]) ?? [], // DB의 hashtag_type[]을 string[]로
      like_count: post.like_count ?? 0,
      comment_count: post.comment_count ?? 0,
      view_count: post.view_count ?? 0,
      created_at: post.created_at ?? new Date().toISOString(),
      updated_at: post.updated_at ?? undefined,

      // Join 또는 헬퍼 함수로 가공하는 필드들
      email: email ?? "unknown@example.com",
      isBookmarked: isBookmarked,
      content: extractTextFromContent(post.content), // [중요] 헬퍼 함수 사용
      image: extractImageFromContent(post.content), // [중요] 헬퍼 함수 사용
    };
  });

  // [삭제] 기존 searchedPosts, filteredPosts 로직을 삭제합니다.

  // [수정] processedPosts를 사용하여 타입별로 분류
  const postsByType = {
    prompt: processedPosts.filter((post) => post.post_type === "prompt"),
    free: processedPosts.filter((post) => post.post_type === "free"),
    weekly: processedPosts.filter((post) => post.post_type === "weekly"),
  };

  // --- 기존 Return JSX (수정 없음) ---
  return (
    <>
      {/* 검색 입력 창 */}
      <FormClient searchTerm={searchTerm} tagTerm={tagTerm} />
      {/* 인기 해시태그 */}
      <div className="space-y-2 px-6 py-4 mb-6">
        <p>인기 해시태그</p>
        <div className="flex gap-2.5 flex-wrap">
          <Link
            href={searchTerm ? `?q=${searchTerm}` : "/search"}
            className={`cursor-pointer px-2.5 py-1.5 text-xs text-[#4B5563] border border-[#D9D9D9] rounded-lg
              ${
                !tagTerm
                  ? "bg-[#9787ff] font-bold text-white"
                  : "hover:bg-[#ECE9FF]"
              }`} // tagTerm이 없을 때 "활성화"
          >
            #전체
          </Link>
          {tagData.map((tag) => {
            if (!tag.name) return null;
            const label = TAG_LABEL_MAP[tag.name] ?? tag.name;
            // 현재 URL의 tagTerm과 이 태그의 이름이 같은지 확인 (활성 상태)
            const isActive = tagTerm === tag.name.toLowerCase();

            // [수정] 링크 URL 생성 로직 수정 (기존 코드 오류 수정)
            const params = new URLSearchParams();
            if (searchTerm) {
              params.set("q", searchTerm);
            }
            // 'tag'는 현재 태그로 설정
            params.set("tag", tag.name.toLowerCase());

            return (
              <Link
                key={tag.id}
                // [수정] href 동적 생성
                href={`/search?${params.toString()}`}
                className={`cursor-pointer px-2.5 py-1.5 text-xs text-[#4B5563] border border-[#D9D9D9] rounded-lg
                  ${
                    isActive
                      ? "bg-[#9787ff] font-bold text-white"
                      : "hover:bg-[#ECE9FF]"
                  }`}
              >
                #{label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* 타입별 섹션 렌더링 */}
      {(Object.keys(postsByType) as Array<keyof typeof postsByType>).map(
        (type) => {
          const posts = postsByType[type];
          const title = SECTION_TITLE_MAP[type];

          return (
            <div key={type} className="space-y-4 mb-8">
              <p className="ml-6 text-xl">{title}</p>
              {posts.length > 0 ? (
                <div className="space-y-8 pb-6">
                  {posts.map((post) => (
                    // [수정] data props에 ProcessedPost 타입 전달
                    <Post key={post.id} data={post} />
                  ))}
                </div>
              ) : (
                <NoPosts />
              )}
            </div>
          );
        }
      )}
    </>
  );
}
