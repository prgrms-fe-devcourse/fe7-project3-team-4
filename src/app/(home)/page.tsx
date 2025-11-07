"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import All from "@/components/home/All";
import News from "@/components/home/News";
import Prompt from "@/components/home/Prompt";
import TopBar from "@/components/home/TobBar";

type Tab = "전체" | "뉴스" | "프롬프트" | "자유" | "주간";

const typeToTab: Record<string, Tab> = {
  all: "전체",
  news: "뉴스",
  prompt: "프롬프트",
  free: "자유",
  weekly: "주간",
};

const tabToType: Record<Tab, string> = {
  전체: "all",
  뉴스: "news",
  프롬프트: "prompt",
  자유: "free",
  주간: "weekly",
};

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTab: Tab = useMemo(() => {
    const type = searchParams.get("type") || "all";
    return typeToTab[type] ?? "전체";
  }, [searchParams]);

  const handleTabChange = (tab: Tab) => {
    const type = tabToType[tab];

    if (type === "all") {
      router.push("/", { scroll: false });
    } else {
      router.push(`/?type=${type}`, { scroll: false });
    }
  };

  return (
    <section className="max-w-2xl mx-auto">
      <div className="mb-5">
        <TopBar activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {activeTab === "전체" && <All />}
      {activeTab === "뉴스" && <News />}
      {activeTab === "프롬프트" && <Prompt />}
      {activeTab === "자유" && <All />}
      {activeTab === "주간" && <All />}
    </section>
  );
}
