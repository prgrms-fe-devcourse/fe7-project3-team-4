import { Search, SendHorizonal } from "lucide-react";

export default function Page() {
  return (
    <>
      <section className="max-w-2xl mx-auto">
        <form className="bg-white border border-[#F6F6F8] rounded-xl shadow">
          <Search size={20} />
          <input type="text" placeholder="검색하기..." />
          <button type="submit" className="cursor-pointer">
            <SendHorizonal size={20} />
          </button>
        </form>
      </section>
    </>
  );
}
