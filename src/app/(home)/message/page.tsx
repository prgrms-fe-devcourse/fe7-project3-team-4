"use client";

import { createClient } from "@/utils/supabase/client";
import { Image as ImageIcon, Search, Send } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ChatProfile = { id: string; display_name: string; avatar_url: string };
export default function Page() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [me, setMe] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ChatProfile[]>([]);
  const isLoading = debouncedQ !== "" && loading;

  // fetch current user id
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      setMe(data.user?.id ?? null);
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    if (!debouncedQ) {
      // 쿼리가 비면 아무 작업도 하지 않음 (동기 setState 회피)
      return () => {
        cancelled = true;
      };
    }
    (async () => {
      setLoading(true); // 비동기 경로에서만 토글
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .neq("id", me ?? "00000000-0000-0000-0000-000000000000")
        .ilike("display_name", `%${debouncedQ}%`)
        .limit(20);
      if (!cancelled) {
        if (!error && data) setResults(data as ChatProfile[]);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, me, supabase]);

  // ensure room and navigate
  const openRoomWith = async (otherUserId: string) => {
    const { data, error } = await supabase.rpc("ensure_direct_room", {
      other_user_id: otherUserId,
    });
    if (error) {
      console.error(error);
      return;
    }
    const roomId = data as string;
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("roomId", roomId);
    router.push(`/message?${sp.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col md:flex-row max-w-[1092px] min-h-[814px] pb-4 rounded-xl shadow-xl">
      {/* 왼쪽 */}
      <div className="flex-1 shrink-0">
        {/* 헤더 - 검색바 */}
        <div className="flex items-center bg-white/40 h-[76px] px-8 shadow-[0_4px_4px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-3 border border-[#E5E5E5] rounded-lg p-3">
            <Search className="text-[#DBDBDB]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="대화 상대 검색..."
              className="w-full bg-transparent focus:outline-none"
            />
          </div>
        </div>
        {/* 목록 (검색 결과) */}
        <div className="divide-y divide-black/5">
          {!debouncedQ && (
            <div className="px-8 py-4 text-sm text-[#717182]">
              상단에서 유저명을 입력해보세요.
            </div>
          )}
          {debouncedQ && isLoading && (
            <div className="px-8 py-4 text-sm text-[#717182]">검색 중…</div>
          )}
          {debouncedQ && !isLoading && results.length === 0 && (
            <div className="px-8 py-4 text-sm text-[#717182]">
              검색 결과가 없어요.
            </div>
          )}
          {debouncedQ &&
            !isLoading &&
            results.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => openRoomWith(u.id)}
                className="relative flex w-full items-center gap-3 h-[76px] px-8 transition-colors duration-150 hover:bg-[#F2F0FF] cursor-pointer rounded-lg"
              >
                <div className="w-11 h-11 bg-[#6D6D6D] rounded-full overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={u.avatar_url ?? ""}
                    alt={`${u.display_name} avatar`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <div className="text-[#0A0A0A]">{u.display_name}</div>
                  <div className="text-sm text-[#717182]">
                    클릭해서 대화를 시작하세요
                  </div>
                </div>
                <div className="absolute right-4 text-xs text-[#717182]">
                  새 채팅
                </div>
              </button>
            ))}
        </div>
      </div>
      {/* 오른쪽 */}
      <div className="flex flex-col">
        {/* 헤더 - 채팅상대 */}
        <div className="relative flex items-center gap-3 h-[76px] p-4 bg-white/40 shadow-[0_4px_4px_rgba(0,0,0,0.1)]">
          <div className="w-11 h-11 bg-[#6D6D6D] rounded-full">profile</div>
          <div className="">
            <div className="text-[#0A0A0A]">닉네임</div>
            <div className="text-sm text-[#717182]">@이메일</div>
          </div>
        </div>
        {/* 채팅 */}
        <div className="relative flex flex-col gap-8 p-4">
          <div className="flex items-end gap-1">
            <div className="self-start max-w-[70%] text-[#0A0A0A] border border-[#6758FF]/30 rounded-xl px-4 py-2">
              안녕하세요! 협업 제안드리고 싶은 게 있어요.
            </div>
            <span className="text-[#717182] text-xs">10:30</span>
          </div>
          <div className="flex justify-end items-end gap-1">
            <span className="text-[#717182] text-xs">10:36</span>
            <div className="self-end max-w-[70%] bg-[#6758FF] text-white border border-[#6758FF]/30 rounded-xl px-4 py-2">
              좋아요! 어떤 프로젝트인지 자세히 알려주세요
            </div>
          </div>
          <div className="flex items-end gap-1">
            <div className="self-start max-w-[70%] text-[#0A0A0A] border border-[#6758FF]/30 rounded-xl px-4 py-2">
              네, 내일 오전에 회의 가능해요!
            </div>
            <span className="text-[#717182] text-xs">10:37</span>
          </div>
        </div>
        {/* 메시지 입력창 */}
        <div className="mt-auto flex items-center gap-3 border border-[#E5E5E5] rounded-lg p-3">
          <input
            placeholder="메시지 입력..."
            className="w-full focus:outline-none"
          />
          <ImageIcon className="text-[#717182] w-6 h-6" strokeWidth={1} />

          <div className="bg-[#6758FF] p-1.5 rounded-md">
            <Send className="text-white w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
