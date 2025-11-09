"use client";

import Link from "next/link";
import { NewsItemWithState } from "@/types";
// [수정] formatTimeAgo 임포트 제거 (Post.tsx와 같이 slice 사용)
// import { formatTimeAgo } from "@/utils/formatTimeAgo"; 
import { Heart, Eye, Bookmark } from "lucide-react"; 

type NewsItemProps = {
  item: NewsItemWithState;
  onLikeToggle: (id: string) => void;
  onBookmarkToggle: (id: string) => void;
};

export default function NewsItem({
  item,
  onLikeToggle,
  onBookmarkToggle,
}: NewsItemProps) {
  const siteName = item.site_name || "익명";
  // [수정] Post.tsx와 같이 날짜 형식을 slice(0, 10)로 변경
  const displayDate = (item.published_at || item.created_at).slice(0, 10);
  const thumb = Array.isArray(item.images) ? item.images[0] : null;
  const likeCount = item.like_count ?? 0;
  const viewCount = item.view_count ?? 0;
  const tags = item.tags || [];

  let model: "GPT" | "Gemini" | undefined = undefined;
  const lowerCaseTags = tags.map((t) => t.toLowerCase());
  if (lowerCaseTags.includes("gpt")) {
    model = "GPT";
  } else if (lowerCaseTags.includes("gemini")) {
    model = "Gemini";
  }

  return (
    <article className="bg-white/40 border-white/20 rounded-xl shadow-xl hover:-translate-y-1 hover:shadow-2xl overflow-hidden">
      
      {/* [수정] 헤더 컨테이너: Post.tsx와 동일하게 p-6 pb-0 적용 */}
      <div className="p-6 pb-0"> 
        {/* [수정] 작성자 정보: Post.tsx와 동일하게 justify-between 적용 */}
        <div className="flex justify-between">
          <div className="flex gap-3 items-center">
            {/* [수정] 프로필 이미지: Post.tsx와 동일하게 w-11 h-11 bg-gray-300 적용 */}
            <div className="w-11 h-11 bg-gray-300 rounded-full shrink-0">
              {/* (기존 아이콘 제거) */}
            </div>
            {/* [수정] 텍스트 영역: Post.tsx와 동일하게 space-y-1 leading-none 적용 */}
            <div className="space-y-1 leading-none">
              {/* [수정] 작성자명: Post.tsx와 동일하게 p 태그 및 기본 폰트 적용 */}
              <p>{siteName}</p>
              {/* [수정] 이메일/날짜: Post.tsx와 동일하게 text-[#717182] text-sm 및 날짜 형식 적용 */}
              <p className="text-[#717182] text-sm">
                {/* '@user'는 임시값입니다. 필요시 item.site_name 등으로 대체하세요. */}
                @user · {displayDate} 
              </p>
            </div>
          </div>

          {/* 뱃지 (Post.tsx와 동일) */}
          {model && (
            <div
              className={`h-[22px] text-xs font-semibold text-white px-3 py-1 ${
                model === "GPT" ? "bg-[#74AA9C]" : "bg-[#2FBAD2]"
              } rounded-full`}
            >
              {model}
            </div>
          )}
        </div>

        {/* [수정] 본문 컨테이너: Post.tsx와 동일하게 my-5 적용 */}
        <div className="my-5">
          {/* [수정] 제목: Post.tsx와 동일하게 mb-6 space-y-4 및 text-[18px] 적용 */}
          <div className="mb-6 space-y-4">
            <Link href={`/news/${item.id}`} scroll={false}>
              <h3 className="text-[18px] font-semibold hover:underline">
                {item.title}
              </h3>
            </Link>
          </div>

          {/* [수정] 썸네일 이미지: Post.tsx와 동일하게 h-auto 및 aspect-video 제거 */}
          {thumb ? (
            <Link
              href={`/news/${item.id}`}
              className="block"
              aria-label={item.title}
            >
              {/* [수정] aspect-video 제거, img에 Post.tsx 스타일 적용 */}
              <img
                src={thumb}
                alt={item.title}
                className="object-cover w-full h-auto bg-gray-300 rounded-lg"
                loading="lazy"
              />
            </Link>
          ) : (
            <div className="h-64 bg-gray-200 flex items-center justify-center text-gray-500 rounded-lg">
              뉴스 대표 이미지
            </div>
          )}
        </div>

        {/* [수정] 태그: Post.tsx와 동일하게 p-6 pb-0 컨테이너 내부(my-5 다음)로 이동 */}
        {tags.length > 0 && (
          <div className="space-x-2 text-sm text-[#248AFF]">
            {tags.map((tag, index) => (
              <span key={index}>
                {tag.startsWith('#') ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        )}
      </div> {/* p-6 pb-0 컨테이너 종료 */}

      {/* 푸터 (Post.tsx와 동일) */}
      <div className="flex justify-center gap-30 text-[#717182] py-6">
        <button
          onClick={() => onLikeToggle(item.id)}
          className={`cursor-pointer py-1 px-2 rounded-md transition-colors ${
            item.isLiked
              ? "text-[#FF569B] bg-[#F7E6ED]"
              : "hover:text-[#FF569B] hover:bg-[#F7E6ED]"
          }`}
          aria-pressed={item.isLiked}
          aria-label="좋아요"
        >
          <div className="flex gap-2 text-sm items-center ">
            <Heart size={18} />
            <span className="font-semibold">{likeCount}</span>
          </div>
        </button>

        <span 
          className="cursor-pointer py-1 px-2 rounded-md"
          aria-label="조회수"
        >
          <div className="flex gap-2 text-sm items-center">
            <Eye size={18} />
            <span className="font-semibold">{viewCount}</span>
          </div>
        </span>

        <button
          onClick={() => onBookmarkToggle(item.id)}
          className={`cursor-pointer py-1 px-2 rounded-md transition-colors ${
            item.isBookmarked
              ? "text-[#6758FF] bg-[#D8D4FF]"
              : "hover:text-[#6758FF] hover:bg-[#D8D4FF]"
          }`}
          aria-pressed={item.isBookmarked}
          aria-label="북마크"
        >
          <Bookmark size={18} />
        </button>
      </div>
    </article>
  );
}
// "use client";

// import Link from "next/link";
// import { NewsItemWithState } from "@/types";
// import { formatTimeAgo } from "@/utils/formatTimeAgo";
// import { Heart, Eye, Bookmark } from "lucide-react"; // [수정] Eye 아이콘으로 변경

// type NewsItemProps = {
//   item: NewsItemWithState;
//   onLikeToggle: (id: string) => void;
//   onBookmarkToggle: (id: string) => void;
// };

// export default function NewsItem({
//   item,
//   onLikeToggle,
//   onBookmarkToggle,
// }: NewsItemProps) {
//   // [클린 코드] 기본값 처리를 통한 안정성 확보
//   const siteName = item.site_name || "익명";
//   const timeAgo = formatTimeAgo(item.published_at || item.created_at);
//   const thumb = Array.isArray(item.images) ? item.images[0] : null;
//   const likeCount = item.like_count ?? 0;
//   const viewCount = item.view_count ?? 0;
//   const tags = item.tags || [];

//   // [추가] tags 배열에서 'GPT' 또는 'Gemini' 확인
//   let model: "GPT" | "Gemini" | undefined = undefined;
//   const lowerCaseTags = tags.map((t) => t.toLowerCase());
//   if (lowerCaseTags.includes("gpt")) {
//     model = "GPT";
//   } else if (lowerCaseTags.includes("gemini")) {
//     model = "Gemini";
//   }

//   return (
//     <article className="bg-white/40 border-white/20 rounded-xl shadow-xl hover:-translate-y-1 hover:shadow-2xl overflow-hidden">
//       {/* 카드 헤더 (사이트 정보) */}
//       {/* [수정] Post.tsx와 동일한 레이아웃(justify-between)으로 변경 */}
//       <div className="p-6 flex justify-between items-center">
//         {/* [수정] 작성자/아이콘 정보를 묶는 div 추가 */}
//         <div className="flex gap-3 items-center">
//           <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500 shrink-0">
//             {(siteName[0] || "?").toUpperCase()}
//           </div>
//           <div>
//             <div className="font-semibold text-sm">{siteName}</div>
//             <div className="text-xs text-gray-400">@user · {timeAgo}</div>
//           </div>
//         </div>

//         {/* [추가] 뱃지 렌더링 로직 (Post.tsx에서 복사) */}
//         {model && (
//           <div
//             className={`h-[22px] text-xs font-semibold text-white px-3 py-1 ${
//               model === "GPT" ? "bg-[#74AA9C]" : "bg-[#2FBAD2]"
//             } rounded-full`}
//           >
//             {model}
//           </div>
//         )}
//       </div>

//       {/* 본문 (제목) */}
//       <div className="px-6 pb-2">
//         <Link href={`/news/${item.id}`} scroll={false}>
//           <h3 className="font-semibold text-base mb-2 hover:underline">
//             {item.title}
//           </h3>
//         </Link>
//       </div>

//       {/* 썸네일 이미지 */}
//       <div className="px-6 pt-0">
//         {thumb ? (
//           <Link
//             href={`/news/${item.id}`}
//             className="block"
//             aria-label={item.title}
//           >
//             <div className="bg-gray-100 flex items-center justify-center rounded-lg overflow-hidden aspect-video">
//               <img
//                 src={thumb}
//                 alt={item.title}
//                 className="w-full h-full object-cover"
//                 loading="lazy"
//               />
//             </div>
//           </Link>
//         ) : (
//           <div className="h-64 bg-gray-200 flex items-center justify-center text-gray-500 rounded-lg aspect-video">
//             뉴스 대표 이미지
//           </div>
//         )}
//       </div>

//       {/* DB에서 불러온 태그 렌더링 */}
//       {tags.length > 0 && (
//         <div className="px-6 pt-3 space-x-2 text-sm text-[#248AFF]"> {/* [수정] */}
//           {tags.map((tag, index) => (
//             <span 
//               key={index} 
//               className="" /* [수정] */
//             >
//               {/* 태그에 #이 없다면 붙여줌 */}
//               {tag.startsWith('#') ? tag : `#${tag}`}
//             </span>
//           ))}
//         </div>
//       )}
// {/* 푸터 (좋아요, 조회수, 북마크) */}
//       <div className="flex justify-center gap-30 text-[#717182] py-6"> {/* [수정] */}
//         <button
//           onClick={() => onLikeToggle(item.id)}
//           className={`cursor-pointer py-1 px-2 rounded-md transition-colors ${ /* [수정] */
//             item.isLiked
//               ? "text-[#FF569B] bg-[#F7E6ED]"
//               : "hover:text-[#FF569B] hover:bg-[#F7E6ED]"
//           }`}
//           aria-pressed={item.isLiked}
//           aria-label="좋아요"
//         >
//           {/* [수정] Post.tsx 구조 적용 */}
//           <div className="flex gap-2 text-sm items-center ">
//             <Heart size={18} />
//             <span className="font-semibold">{likeCount}</span>
//           </div>
//         </button>

//         <span 
//           className="cursor-pointer py-1 px-2 rounded-md" /* [수정] */
//           aria-label="조회수"
//         >
//           {/* [수정] Post.tsx 구조 적용 */}
//           <div className="flex gap-2 text-sm items-center">
//             <Eye size={18} />
//             <span className="font-semibold">{viewCount}</span>
//           </div>
//         </span>

//         <button
//           onClick={() => onBookmarkToggle(item.id)}
//           className={`cursor-pointer py-1 px-2 rounded-md transition-colors ${ /* [수정] */
//             item.isBookmarked
//               ? "text-[#6758FF] bg-[#D8D4FF]"
//               : "hover:text-[#6758FF] hover:bg-[#D8D4FF]"
//           }`}
//           aria-pressed={item.isBookmarked}
//           aria-label="북마크"
//         >
//           <Bookmark size={18} />
//         </button>
//       </div>
//     </article>
//   );
// }
