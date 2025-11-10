"use client";

import { Search, SendHorizonal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FormClient({
  searchTerm,
  tagTerm,
}: {
  searchTerm: string;
  tagTerm: string;
}) {
  const router = useRouter();
  const [terms, setTerms] = useState(searchTerm);
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("q", terms);
    if (tagTerm) {
      params.set("tag", tagTerm);
    }
    router.replace("?" + params.toString());
  };
  return (
    <>
      <form
        className="mt-6 p-4 flex gap-3 bg-white border border-[#F6F6F8] rounded-xl shadow mb-4"
        onSubmit={handleFormSubmit}
      >
        <Search size={20} className="text-[#D1D5DB]" />
        <input
          name="q"
          type="text"
          placeholder="검색하기..."
          className="flex-1 outline-none"
          defaultValue={terms}
          onChange={(e) => setTerms(e.target.value)}
        />
        <button type="submit" className="cursor-pointer text-[#D1D5DB]">
          <SendHorizonal size={20} />
        </button>
      </form>
    </>
  );
}
