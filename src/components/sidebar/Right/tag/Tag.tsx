import { getTranslatedTag } from "@/utils/tagTranslator"; // [✅ 추가] 임포트

export default function Tag({
  index,
  hashtag,
  views,
}: {
  index: number;
  hashtag: string;
  views: number;
}) {
  return (
    <div className="px-4 py-3 hover:bg-white rounded-xl hover:shadow-[0px_10px_25px_rgba(0,0,0,0.1),0px_4px_10px_rgba(0,0,0,0.1)] dark:hover:bg-white/30">
      <div className="flex gap-2">
        <span className="text-[#6758FF]">{index}.</span>
        <div>
          {/* [✅ 수정] 함수 직접 호출 */}
          <p className="text-sm mb-1.5">#{getTranslatedTag(hashtag)}</p>
          <p className="text-xs text-[#717182] dark:text-[#A6A6DB]">
            {views} 조회
          </p>
        </div>
      </div>
    </div>
  );
}
