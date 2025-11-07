import { Plus } from "lucide-react";
import Link from "next/link";

export default function TopBar() {
  return (
    <>
      <div className="w-full p-1 bg-white/40 border border-[#C2C2C2] rounded-lg flex justify-between items-center text-xs">
        {/* left */}
        <ul className="text-[#9CA3AF] flex gap-7 bg-[#EEEEF0] p-0.5 rounded-lg items-center">
          <li className="py-1 px-3 text-[#0A0A0A] bg-white rounded-lg shadow">
            뉴스
          </li>
          <li className="py-1 px-3">프롬프트</li>
          <li className="py-1 px-3">자유</li>
          <li className="py-1 px-3">주간</li>
        </ul>
        {/* right */}
        <div className="flex items-center gap-1.5">
          <ul className="text-[#9CA3AF] flex gap-1 bg-[#EEEEF0] p-0.5 rounded-lg items-center">
            <li className="py-1 px-3 text-[#0A0A0A] bg-white rounded-lg shadow">
              인기순
            </li>
            <li className="py-1 px-3">최신순</li>
          </ul>
          <Link className="block" href="/write">
            <div className="flex items-center gap-0.5 p-2 rounded-lg bg-linear-to-b from-[#8B8B8B] to-[#2C2C2E] shadow-[0px_1px_2px_rgba(0,0,0,0.1)]">
              <Plus size={14} color="#AEAEAE" />
              <span className="text-white leading-none">새 게시글</span>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
