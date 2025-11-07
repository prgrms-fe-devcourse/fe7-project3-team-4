export default function Page() {
  return (
    <main>
      <div className="p-6 grid md:grid-cols-[208px_minmax(0,1fr)_332px] h-screen overflow-hidden">
        <aside className="hidden md:block h-full p-6 box-border bg-white/40 border border-white/20 rounded-xl shadow-[0px_10px_25px_rgba(0,0,0,0.1),0px_4px_10px_rgba(0,0,0,0.1)]">
          {/* 로고 아이콘 */}
          <div className="w-[75px] h-[70px] bg-gray-500"></div>
          <ul className="text-neutral-950 space-y-2 mt-6">
            <li className="cursor-pointer flex gap-4 px-4 py-3 rounded-xl shadow-xl text-white bg-indigo-500">
              <div className="w-6 h-6 bg-gray-500">{/* 아이콘 */}</div>
              <span>홈</span>
            </li>
            <li className="cursor-pointer flex gap-4 px-4 py-3 rounded-xl hover:bg-white hover:shadow-xl">
              <div className="w-6 h-6 bg-gray-500">{/* 아이콘 */}</div>
              <span>검색</span>
            </li>
            <li className="cursor-pointer flex gap-4 px-4 py-3 rounded-xl hover:bg-white hover:shadow-xl">
              <div className="w-6 h-6 bg-gray-500">{/* 아이콘 */}</div>
              <span>알림</span>
            </li>
            <li className="cursor-pointer flex gap-4 px-4 py-3 rounded-xl hover:bg-white hover:shadow-xl">
              <div className="w-6 h-6 bg-gray-500">{/* 아이콘 */}</div>
              <a target="_blank" href="https://chatgpt.com/">
                GPT
              </a>
            </li>
            <li className="cursor-pointer flex gap-4 px-4 py-3 rounded-xl hover:bg-white hover:shadow-xl">
              <div className="w-6 h-6 bg-gray-500">{/* 아이콘 */}</div>
              <a target="_blank" href="https://gemini.google.com/">
                Gemini
              </a>
            </li>
            <li className="cursor-pointer flex gap-4 px-4 py-3 rounded-xl hover:bg-white hover:shadow-xl">
              <div className="w-6 h-6 bg-gray-500">{/* 아이콘 */}</div>
              <span>게시글 작성</span>
            </li>
            <li className="cursor-pointer flex gap-4 px-4 py-3 rounded-xl hover:bg-white hover:shadow-xl">
              <div className="w-6 h-6 bg-gray-500">{/* 아이콘 */}</div>
              <span>채팅</span>
            </li>
            <li className="cursor-pointer flex gap-4 px-4 py-3 rounded-xl hover:bg-white hover:shadow-xl">
              <div className="w-6 h-6 bg-gray-500">{/* 아이콘 */}</div>
              <span>프로필</span>
            </li>
          </ul>
        </aside>

        <main className="h-full overflow-y-auto px-4 py-4 bg-white">
          <div>잠자</div>
        </main>

        <aside className="hidden md:block h-full bg-amber-200">
          <div className="text-sm font-semibold text-slate-600 mb-3">
            Right Sidebar
          </div>
        </aside>
      </div>
    </main>
  );
}
