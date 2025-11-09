import { Search, SendHorizonal } from "lucide-react";

export default function Page() {
  return (
    <>
      <section className="max-w-2xl mx-auto">
        {/* 검색 입력 창 */}
        <form className="p-4 flex gap-3 bg-white border border-[#F6F6F8] rounded-xl shadow">
          <Search size={20} className="text-[#D1D5DB]" />
          <input
            type="text"
            placeholder="검색하기..."
            className="flex-1 outline-none"
          />
          <button type="submit" className="cursor-pointer text-[#D1D5DB]">
            <SendHorizonal size={20} />
          </button>
        </form>
        {/* 인기 해시태그 */}
        <div></div>
      </section>
    </>
  );
}
