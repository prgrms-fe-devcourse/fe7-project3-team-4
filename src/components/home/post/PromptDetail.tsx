"use client";

import { PostType } from "@/types/Post";
import {
  extractFirstLinkHref,
  extractImageSrcArr,
  extractPromptFields,
} from "@/utils/extractTextFromJson";
import { Copy, ExternalLink } from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";

export default function PromptDetail({ post }: { post: PostType }) {
  /* copied는 추후에 Toast 창으로 사용 */
  const [copied, setCopied] = useState(false);

  // [✅ 수정] 고정 인덱스 대신 라벨 기반으로 동적 추출
  const { promptInput, promptResult } = useMemo(
    () => extractPromptFields(post.content),
    [post.content]
  );

  const handleCopy = useCallback(async () => {
    if (!promptInput) return;
    try {
      await navigator.clipboard.writeText(promptInput);
    } catch {
      // 폴백 (일부 환경)
      const ta = document.createElement("textarea");
      ta.value = promptInput;
      ta.style.position = "fixed";
      ta.style.top = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand("copy");
      } finally {
        document.body.removeChild(ta);
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, [promptInput]);

  return (
    <>
      {/* Top */}
      <div className="flex justify-between px-2">
        <p className="font-bold text-lg text-[#6758FF]">프롬프트와 결과</p>
        <div className="flex gap-2 flex-row text-white items-center">
          <span
            className={`px-3 py-1 rounded-full text-xs ${
              post.model === "GPT" ? "bg-[#74AA9C]" : "bg-[#2FBAD2]"
            }`}
          >
            {post.model}
          </span>
          <span className="px-3 py-1 rounded-full bg-[#38BDF8] text-xs">
            {post.result_mode} Output
          </span>
        </div>
      </div>
      {/* 구분선 */}
      <div className="bg-black/40 mt-2 mb-5 w-full h-px"></div>
      {/* 프롬프트 */}
      <div className="flex flex-col gap-5">
        {/* 입력 */}
        <div className="flex flex-col">
          <div className="flex gap-2 items-center mb-2">
            <p className="pl-2">입력한 프롬프트</p>
            {/* 복사 버튼 */}
            <button
              type="button"
              onClick={handleCopy}
              aria-label="프롬프트 복사"
              title="복사"
              className="cursor-pointer w-6 h-6 top-0 right-0 flex items-center justify-center rounded-md hover:bg-[#6758FF]/80 hover:text-white"
              disabled={!promptInput}
            >
              <Copy size={14} />
            </button>
          </div>
          <div className="relative min-h-40 max-h-120 p-4 bg-[#6758FF]/10 border-2 border-white/60 rounded-lg overflow-y-scroll">
            <p className="text-sm whitespace-pre-wrap">{promptInput}</p>
          </div>
        </div>
        {/* 결과 */}
        <div className="flex flex-col">
          <div className="flex gap-2 items-center mb-2">
            <p className="pl-2">프롬프트 결과</p>
            {extractFirstLinkHref(post.content) === "" ? null : (
              <a
                href={extractFirstLinkHref(post.content)}
                target="_blank"
                className="cursor-pointer w-6 h-6 top-0 right-0 flex items-center justify-center rounded-md hover:bg-[#6758FF]/80 hover:text-white"
              >
                <ExternalLink size={14} />
              </a>
            )}
          </div>
          <div className="p-4 bg-[#6758FF]/10 border-2 border-white/60 rounded-lg overflow-x-hidden">
            {post.result_mode === "Image" ? (
              <div className="relative rounded-lg">
                <div className="flex justify-center items-center ">
                  <Image
                    src={extractImageSrcArr(post.content)[1]}
                    alt={post.title}
                    width={1000}
                    height={500}
                    className="object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="relative rounded-lg min-h-40 max-h-120 overflow-y-scroll">
                <p className="text-sm whitespace-pre-wrap">{promptResult}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// "use client";

// import { PostType } from "@/types/Post";
// import {
//   extractFirstLinkHref,
//   extractImageSrcArr,
//   getNthParagraphText,
// } from "@/utils/extractTextFromJson";
// import { Copy, ExternalLink } from "lucide-react";
// import Image from "next/image";
// import { useCallback, useMemo, useState } from "react";

// export default function PromptDetail({ post }: { post: PostType }) {
//   /* copied는 추후에 Toast 창으로 사용 */
//   const [copied, setCopied] = useState(false);

//   const promptText = useMemo(
//     () => getNthParagraphText(post.content, 2),
//     [post.content]
//   );

//   const handleCopy = useCallback(async () => {
//     if (!promptText) return;
//     try {
//       await navigator.clipboard.writeText(promptText);
//     } catch {
//       // 폴백 (일부 환경)
//       const ta = document.createElement("textarea");
//       ta.value = promptText;
//       ta.style.position = "fixed";
//       ta.style.top = "-9999px";
//       document.body.appendChild(ta);
//       ta.focus();
//       ta.select();
//       try {
//         document.execCommand("copy");
//       } finally {
//         document.body.removeChild(ta);
//       }
//     }
//     setCopied(true);
//     setTimeout(() => setCopied(false), 1200);
//   }, [promptText]);

//   return (
//     <>
//       {/* Top */}
//       <div className="flex justify-between px-2">
//         <p className="font-bold text-lg text-[#6758FF]">프롬프트와 결과</p>
//         <div className="flex gap-2 flex-row text-white items-center">
//           <span
//             className={`px-3 py-1 rounded-full text-xs ${
//               post.model === "GPT" ? "bg-[#74AA9C]" : "bg-[#2FBAD2]"
//             }`}
//           >
//             {post.model}
//           </span>
//           <span className="px-3 py-1 rounded-full bg-[#38BDF8] text-xs">
//             {post.result_mode} Output
//           </span>
//         </div>
//       </div>
//       {/* 구분선 */}
//       <div className="bg-black/40 mt-2 mb-5 w-full h-px"></div>
//       {/* 프롬프트 */}
//       <div className="flex flex-col gap-5">
//         {/* 입력 */}
//         <div className="flex flex-col">
//           <div className="flex gap-2 items-center mb-2">
//             <p className="pl-2">입력한 프롬프트</p>
//             {/* 복사 버튼 */}
//             <button
//               type="button"
//               onClick={handleCopy}
//               aria-label="프롬프트 복사"
//               title="복사"
//               className="cursor-pointer w-6 h-6 top-0 right-0 flex items-center justify-center rounded-md hover:bg-[#6758FF]/80 hover:text-white"
//               disabled={!promptText}
//             >
//               <Copy size={14} />
//             </button>
//           </div>
//           <div className="relative min-h-40 max-h-120 p-4 bg-[#6758FF]/10 border-2 border-white/60 rounded-lg overflow-y-scroll">
//             <p className="text-sm whitespace-pre-wrap">{promptText}</p>
//           </div>
//         </div>
//         {/* 결과 */}
//         <div className="flex flex-col">
//           <div className="flex gap-2 items-center mb-2">
//             <p className="pl-2">프롬프트 결과</p>
//             {extractFirstLinkHref(post.content) === "" ? null : (
//               <a
//                 href={extractFirstLinkHref(post.content)}
//                 target="_blank"
//                 className="cursor-pointer w-6 h-6 top-0 right-0 flex items-center justify-center rounded-md hover:bg-[#6758FF]/80 hover:text-white"
//               >
//                 <ExternalLink size={14} />
//               </a>
//             )}
//           </div>
//           <div className="p-4 bg-[#6758FF]/10 border-2 border-white/60 rounded-lg overflow-x-hidden">
//             {post.result_mode === "Image" ? (
//               <div className="relative rounded-lg">
//                 <div className="flex justify-center items-center ">
//                   <Image
//                     src={extractImageSrcArr(post.content)[1]}
//                     alt={post.title}
//                     width={1000}
//                     height={500}
//                     className="object-cover"
//                   />
//                 </div>
//               </div>
//             ) : (
//               <div className="relative rounded-lg min-h-40 max-h-120 overflow-y-scroll">
//                 <p className="text-sm whitespace-pre-wrap">
//                   {getNthParagraphText(post.content, 4)}
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }
