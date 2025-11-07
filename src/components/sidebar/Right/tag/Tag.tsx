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
    <div className="px-4 py-3 hover:bg-white hover:rounded-xl hover:shadow-[0px_10px_25px_rgba(0,0,0,0.1),0px_4px_10px_rgba(0,0,0,0.1)] transition-all duration-250 ease">
      <div className="flex gap-2">
        <span className="text-[#6758FF]">{index}.</span>
        <div>
          <p className="text-sm mb-1.5">#{hashtag}</p>
          <p className="text-xs text-[#717182]">{views} 조회</p>
        </div>
      </div>
    </div>
  );
}
