import NoPosts from "@/components/home/post/NoPosts";
import Post from "@/components/home/post/Post";
import FormClient from "@/components/home/search/FormClient";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Tables } from "@/utils/supabase/supabase";

// [수정] Supabase 쿼리 결과의 타입을 정의합니다. (Join 포함)
type PostQueryData = Tables<"posts"> & {
  profiles: Pick<Tables<"profiles">, "email"> | null;
  user_post_bookmarks: Pick<Tables<"user_post_bookmarks">, "user_id">[];
  user_post_likes: Pick<Tables<"user_post_likes">, "user_id">[];
};

// [신규] 'post.content' (Json)의 구체적인 객체 구조 정의
type PostContentJson = {
  text?: string | null;
  main_image_url?: string | null;
  prompt_result_image_url?: string | null;
  prompt_input?: string | null;
  prompt_result_text?: string | null;
  result_link?: string | null;
  result_mode?: string | null;
  is_prompt_like?: boolean | null;
};

/**
 * Post 컴포넌트가 기대하는 "변환된" 데이터 타입
 */
type TransformedPostData = {
  id: string;
  comment_count: number;
  content: string; // jsonb에서 'text'를 추출
  created_at: string;
  updated_at?: string;
  like_count: number;
  post_type: "prompt" | "free" | "weekly";
  title: string;
  user_id: string;
  view_count: number;
  email: string; // 'profiles'에서 join
  image?: string; // jsonb에서 'main_image_url' 등을 추출
  hashtags: string[];
  isBookmarked: boolean; // 'user_post_bookmarks'에서 계산
  isLiked: boolean; // [수정] 'user_post_likes'에서 계산
  model?: string;
};

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

export default async function SearchPostForm({
  searchTerm,
  tagTerm,
}: {
  searchTerm: string;
  tagTerm: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase.from("posts").select(
    `
    *,
    profiles!posts_user_id_fkey ( email ),
    user_post_bookmarks!left ( user_id ),
    user_post_likes!left ( user_id )
  `
  );

  if (user) {
    query = query
      .eq("user_post_bookmarks.user_id", user.id)
      .eq("user_post_likes.user_id", user.id);
  }

  // 'searchTerm' 필터 (4개 필드 검색)
  if (searchTerm) {
    query = query.or(
      `title.ilike.%${searchTerm}%,` +
        `content->>text.ilike.%${searchTerm}%,` +
        `content->>prompt_input.ilike.%${searchTerm}%,` +
        `content->>prompt_result_text.ilike.%${searchTerm}%`
    );
  }

  // 'tagTerm' 필터 (hashtags 배열)
  if (tagTerm) {
    query = query.contains("hashtags", [tagTerm] as string[]);
  }

  const { data, error } = await query.returns<PostQueryData[]>();

  if (error) {
    console.error("Supabase search fetch error:", error.message);
    return <div>데이터를 불러오는 중 오류가 발생했습니다.</div>;
  }

  const transformedPosts: TransformedPostData[] = data
    ? data.map((post: PostQueryData): TransformedPostData => {
        const contentJson = post.content as PostContentJson | null;

        return {
          id: post.id,
          user_id: post.user_id ?? "",
          title: post.title ?? "제목 없음",
          content: contentJson?.text ?? "내용 없음",
          image:
            contentJson?.main_image_url ||
            contentJson?.prompt_result_image_url ||
            undefined,
          email: post.profiles?.email ?? "이메일 없음",
          isBookmarked: post.user_post_bookmarks.length > 0,
          isLiked: post.user_post_likes.length > 0,
          // 나머지 필드 매핑
          hashtags: (post.hashtags as string[]) ?? [],
          post_type: post.post_type as "prompt" | "free" | "weekly",
          like_count: post.like_count ?? 0,
          comment_count: post.comment_count ?? 0,
          view_count: post.view_count ?? 0,
          created_at: post.created_at ?? new Date().toISOString(),
          updated_at: post.updated_at ?? undefined,
          model: post.model ?? undefined,
        };
      })
    : [];

  const { data: tagData } = await supabase.from("hashtags").select("*");
  if (!tagData) return null;
  const postsByType = {
    prompt: transformedPosts.filter((post) => post.post_type === "prompt"),
    free: transformedPosts.filter((post) => post.post_type === "free"),
    weekly: transformedPosts.filter((post) => post.post_type === "weekly"),
  };

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
     ${!tagTerm ? "bg-[#9787ff] font-bold text-white" : "hover:bg-[#ECE9FF]"}`} // tagTerm이 없을 때 "활성화"
          >
            #전체
          </Link>
          {tagData.map((tag) => {
            if (!tag.name) return null;
            const label = TAG_LABEL_MAP[tag.name] ?? tag.name;
            const isActive = tagTerm === tag.name.toLowerCase();

            const params = new URLSearchParams();
            params.set("tag", tag.name);
            if (searchTerm) {
              params.set("q", searchTerm);
            }
            const href = `/search?${params.toString()}`;

            return (
              <Link
                key={tag.id}
                href={href} // 수정된 href
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
