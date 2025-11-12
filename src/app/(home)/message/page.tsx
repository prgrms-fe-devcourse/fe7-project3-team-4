"use client";

import { createClient } from "@/utils/supabase/client";
import { Image as ImageIcon, Search, Send } from "lucide-react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ChatProfile = {
  id: string;
  display_name: string;
  avatar_url: string;
  email: string;
};
type ChatRoom = { id: string; pair_min: string; pair_max: string };
type ChatMessage = {
  id: string;
  created_at: string;
  room_id: string;
  sender_id: string;
  content: string | null;
};
type RoomListItem = {
  id: string;
  other_id: string;
  other_name: string | null;
  other_avatar: string | null;
  last_message_at: string | null;
  last_message_text: string | null;
};
export default function Page() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();

  const roomId = searchParams.get("roomId");
  const peerIdParam = searchParams.get("peerId");

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [me, setMe] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ChatProfile[]>([]);
  const isLoading = debouncedQ !== "" && loading;

  const [peerId, setPeerId] = useState<string | null>(null);
  const [peer, setPeer] = useState<ChatProfile | null>(null);
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");

  const [isSearching, setIsSearching] = useState(false);
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  // URL의 peerId를 state로 동기화 (roomId가 없을 때만)
  useEffect(() => {
    if (roomId) return; // room 모드가 우선
    Promise.resolve().then(() => setPeerId(peerIdParam ?? null));
  }, [peerIdParam, roomId]);

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

  // 내 채팅방 목록 불러오기 (검색 모드가 아닐 때 표시)
  useEffect(() => {
    let cancelled = false;
    if (!me) return;
    (async () => {
      setRoomsLoading(true);
      // 내가 속한 방 목록
      const { data: rlist, error: rErr } = await supabase
        .from("message_rooms")
        .select("id, pair_min, pair_max, last_message_at, last_message_text")
        .or(`pair_min.eq.${me},pair_max.eq.${me}`)
        .order("last_message_at", { ascending: false, nullsFirst: false });
      if (rErr || !rlist) {
        if (!cancelled) {
          setRooms([]);
          setRoomsLoading(false);
        }
        return;
      }

      // 상대 아이디 목록
      const otherIds = rlist
        .map((r) => (r.pair_min === me ? r.pair_max : r.pair_min))
        .filter(Boolean) as string[]; // falsy 제외하고 유효한 값(uuid)만 filter

      // 상대가 하나도 없으면 바로 반영
      if (otherIds.length === 0) {
        if (!cancelled) {
          setRooms([]);
          setRoomsLoading(false);
        }
        return;
      }

      // 상대 프로필 일괄 조회
      const { data: plist } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", otherIds);

      const byId = new Map(plist?.map((p) => [p.id, p]) ?? []);

      // 룸 리스트 가공
      const hydrated: RoomListItem[] = rlist.flatMap((r) => {
        const candidate = r.pair_min === me ? r.pair_max : r.pair_min; // string | null
        if (!candidate) return []; // 불완전한 행은 스킵
        const other_id: string = candidate; // 여기서 string 보장

        const p = byId.get(other_id);
        return [
          {
            id: r.id,
            other_id,
            other_name: p?.display_name ?? null,
            other_avatar: p?.avatar_url ?? null,
            last_message_at: r.last_message_at ?? null,
            last_message_text: r.last_message_text ?? null,
          },
        ];
      });

      if (!cancelled) {
        setRooms(hydrated);
        setRoomsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [me, supabase]);

  // 실시간: 내가 속한 방의 last_message가 갱신되면 좌측 목록을 즉시 반영
  useEffect(() => {
    if (!me) return;

    const channel = supabase
      .channel(`rooms-realtime-${me}`)
      // pair_min = me 인 방의 UPDATE(트리거로 last_message 갱신)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "message_rooms",
          filter: `pair_min=eq.${me}`,
        },
        (payload) => {
          const r = payload.new;
          const other_id = r.pair_min === me ? r.pair_max : r.pair_min;
          setRooms((prev) => {
            const idx = prev.findIndex((x) => x.id === r.id);
            if (idx >= 0) {
              // 기존 카드 갱신 + 최상단으로 끌어올리기
              const updated: RoomListItem = {
                ...prev[idx],
                last_message_at: r.last_message_at ?? null,
                last_message_text: r.last_message_text ?? null,
              };
              const next = [...prev];
              next.splice(idx, 1);
              return [updated, ...next];
            }
            // 목록에 없던 방(첫 메시지 등) -> 상대 프로필을 조회해서 추가
            // 프로필 조회 후 추가
            (async () => {
              const { data: p } = await supabase
                .from("profiles")
                .select("id, display_name, avatar_url")
                .eq("id", other_id)
                .maybeSingle();
              const item: RoomListItem = {
                id: r.id,
                other_id,
                other_name: p?.display_name ?? null,
                other_avatar: p?.avatar_url ?? null,
                last_message_at: r.last_message_at ?? null,
                last_message_text: r.last_message_text ?? null,
              };
              setRooms((cur) => [item, ...cur]);
            })();
            return prev;
          });
        }
      )
      // pair_max = me 인 방도 동일하게 구독 (OR 지원이 없어 두 번 등록)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "message_rooms",
          filter: `pair_max=eq.${me}`,
        },
        (payload) => {
          const r = payload.new;
          const other_id = r.pair_min === me ? r.pair_max : r.pair_min;
          setRooms((prev) => {
            const idx = prev.findIndex((x) => x.id === r.id);
            if (idx >= 0) {
              const updated: RoomListItem = {
                ...prev[idx],
                last_message_at: r.last_message_at ?? null,
                last_message_text: r.last_message_text ?? null,
              };
              const next = [...prev];
              next.splice(idx, 1);
              return [updated, ...next];
            }
            (async () => {
              const { data: p } = await supabase
                .from("profiles")
                .select("id, display_name, avatar_url")
                .eq("id", other_id)
                .maybeSingle();
              const item: RoomListItem = {
                id: r.id,
                other_id,
                other_name: p?.display_name ?? null,
                other_avatar: p?.avatar_url ?? null,
                last_message_at: r.last_message_at ?? null,
                last_message_text: r.last_message_text ?? null,
              };
              setRooms((cur) => [item, ...cur]);
            })();
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [me, supabase]);

  useEffect(() => {
    let cancelled = false;
    if (!debouncedQ) {
      // 쿼리가 비면 아무 작업도 하지 않음
      return () => {
        cancelled = true;
      };
    }
    (async () => {
      setLoading(true); // 비동기 경로에서만 토글
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, email")
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

  // roomId가 생기면 방 참가자와 상대 프로필 로드
  useEffect(() => {
    let cancelled = false;

    if (!roomId || !me) {
      // 방이 선택되지 않았거나 내 정보가 없으면 이 effect는 아무 것도 하지 않음
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      // 방 정보 가져오기
      const { data: room, error: roomErr } = await supabase
        .from("message_rooms")
        .select("id, pair_min, pair_max")
        .eq("id", roomId)
        .single();
      if (roomErr || !room || cancelled) return;

      const otherId = room.pair_min === me ? room.pair_max : room.pair_min;

      // 동기 업데이트 대신 비동기 큐로 처리
      Promise.resolve().then(() => {
        if (!cancelled) setPeerId(otherId);
      });

      if (otherId) {
        const { data: p } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url, email")
          .eq("id", otherId)
          .maybeSingle();
        if (!cancelled) setPeer(p as ChatProfile | null);
      }

      const { data: mlist } = await supabase
        .from("messages")
        .select("id, created_at, room_id, sender_id, content")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(50);
      if (!cancelled && mlist) setMsgs(mlist as ChatMessage[]);
    })();

    return () => {
      cancelled = true;
    };
  }, [roomId, me, supabase]);

  // pre-chat 모드: peerId만 있고 roomId는 없을 때, 상대 프로필만 로드
  useEffect(() => {
    let cancelled = false;
    if (roomId || !peerId || !me) {
      return () => {
        cancelled = true;
      };
    }
    (async () => {
      const { data: p } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, email")
        .eq("id", peerId)
        .maybeSingle();
      if (!cancelled) setPeer(p as ChatProfile | null);
      if (!cancelled) setMsgs([]); // 아직 방이 없으므로 대화 비움
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId, peerId, me, supabase]);

  const openRoomWith = async (otherUserId: string) => {
    const { data: u } = await supabase.auth.getUser();
    const myId = u?.user?.id;
    if (!myId) return;

    // 두 유저의 정규화된 쌍
    const a = myId < otherUserId ? myId : otherUserId;
    const b = myId < otherUserId ? otherUserId : myId;

    // 1) 기존 방이 있으면 그 방으로 이동 (생성하지 않음)
    const { data: existing } = await supabase
      .from("message_rooms")
      .select("id")
      .eq("pair_min", a)
      .eq("pair_max", b)
      .maybeSingle();

    const sp = new URLSearchParams(searchParams.toString());

    if (existing?.id) {
      sp.delete("peerId");
      sp.set("roomId", existing.id);
      router.push(`/message?${sp.toString()}`, { scroll: false });
      setIsSearching(false);
      return;
    }

    // 2) 없으면 pre-chat 모드로: peerId만 세팅 (방 생성 X)
    sp.delete("roomId");
    sp.set("peerId", otherUserId);
    router.push(`/message?${sp.toString()}`, { scroll: false });
    setIsSearching(false);
  };

  const sendMessage = async () => {
    if ((!roomId && !peerId) || !me || !draft.trim() || sending) return;
    setSending(true);
    const content = draft.trim();
    setDraft("");

    let activeRoomId = roomId;

    if (!activeRoomId && peerId) {
      // 첫 메시지 시점에 방 생성 (RPC 우선, 실패 시 fallback)
      try {
        const { data, error } = await supabase
          .rpc("ensure_direct_room", { other_user_id: peerId })
          .throwOnError();
        if (!data) throw new Error("ensure_direct_room returned no id");
        activeRoomId = data as string;
        const sp = new URLSearchParams(searchParams.toString());
        sp.delete("peerId");
        sp.set("roomId", activeRoomId);
        router.push(`/message?${sp.toString()}`, { scroll: false });
      } catch (rpcErr) {
        console.error("RPC ensure_direct_room failed:", rpcErr);
        const { data: u } = await supabase.auth.getUser();
        const myId = u?.user?.id;
        if (!myId) {
          setSending(false);
          return;
        }
        const a = myId < peerId ? myId : peerId;
        const b = myId < peerId ? peerId : myId;

        // 1) 기존 방 시도
        const { data: existing, error: selErr } = await supabase
          .from("message_rooms")
          .select("id")
          .eq("pair_min", a)
          .eq("pair_max", b)
          .maybeSingle();
        if (selErr) console.error("select existing room error:", selErr);

        if (existing?.id) {
          activeRoomId = existing.id;
        } else {
          // 2) 없으면 upsert로 생성 (복합 unique가 있는 경우 경합 안전)
          const { data: upserted, error: upErr } = await supabase
            .from("message_rooms")
            .upsert(
              { pair_min: a, pair_max: b },
              { onConflict: "pair_min,pair_max" }
            )
            .select("id")
            .single();
          if (upErr) {
            console.error("upsert room error:", upErr);
          }
          activeRoomId = upserted?.id ?? null;
        }

        if (!activeRoomId) {
          setSending(false);
          return;
        }
        const sp = new URLSearchParams(searchParams.toString());
        sp.delete("peerId");
        sp.set("roomId", activeRoomId);
        router.push(`/message?${sp.toString()}`, { scroll: false });
      }
    }

    if (!activeRoomId) {
      setSending(false);
      return;
    }

    // 낙관적 UI
    const temp: ChatMessage = {
      id: `temp-${Date.now()}`,
      created_at: new Date().toISOString(),
      room_id: activeRoomId,
      sender_id: me,
      content,
    };
    setMsgs((prev) => [...prev, temp]);

    const { data, error } = await supabase
      .from("messages")
      .insert([{ room_id: activeRoomId, sender_id: me, content }])
      .select("id, created_at, room_id, sender_id, content")
      .single();

    if (error) {
      console.error("insert message error:", error);
    }

    if (!error && data) {
      setMsgs((prev) =>
        prev.map((m) => (m.id === temp.id ? (data as ChatMessage) : m))
      );
    } else {
      setMsgs((prev) => prev.filter((m) => m.id !== temp.id));
      setDraft(content);
    }

    setSending(false);
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
              onFocus={() => setIsSearching(true)}
              onBlur={() => {
                // 입력값이 비어 있으면 검색 모드 종료
                if (!q.trim()) setIsSearching(false);
              }}
              placeholder="대화 상대 검색..."
              className="w-full bg-transparent focus:outline-none"
            />
          </div>
          {isSearching && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setIsSearching(false);
              }}
              className="ml-3 text-xs text-[#717182] hover:underline"
            >
              검색 종료
            </button>
          )}
        </div>
        {/* 목록: 검색 모드 vs 최근 채팅방 */}
        <div className="divide-y divide-black/5">
          {isSearching ? (
            <>
              {!debouncedQ && (
                <div className="px-8 py-4 text-sm text-[#717182]">
                  검색어를 입력해보세요.
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
                      <Image
                        src={u.avatar_url ?? ""}
                        alt={`${u.display_name} avatar`}
                        width={44}
                        height={44}
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
            </>
          ) : (
            <>
              {roomsLoading && (
                <div className="px-8 py-4 text-sm text-[#717182]">
                  채팅방을 불러오는 중…
                </div>
              )}
              {!roomsLoading && rooms.length === 0 && (
                <div className="px-8 py-4 text-sm text-[#717182]">
                  아직 대화 내역이 없어요. 상단 검색바로 대화를 시작해보세요!
                </div>
              )}
              {!roomsLoading &&
                rooms.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      const sp = new URLSearchParams(searchParams.toString());
                      sp.set("roomId", r.id);
                      router.push(`/message?${sp.toString()}`, {
                        scroll: false,
                      });
                    }}
                    className="relative flex w-full items-center gap-3 h-[76px] px-8 transition-colors duration-150 hover:bg-[#F2F0FF] cursor-pointer rounded-lg"
                  >
                    <div className="w-11 h-11 bg-[#6D6D6D] rounded-full overflow-hidden flex items-center justify-center">
                      <Image
                        src={r.other_avatar ?? ""}
                        alt={`${r.other_name ?? "profile"} avatar`}
                        width={44}
                        height={44}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-left">
                      <div className="text-[#0A0A0A]">
                        {r.other_name ?? "대화 상대"}
                      </div>
                      <div className="text-sm text-[#717182] truncate max-w-[420px]">
                        {r.last_message_text ?? "대화를 시작해보세요"}
                      </div>
                    </div>
                    <div className="absolute right-4 text-xs text-[#717182]">
                      {r.last_message_at
                        ? new Date(r.last_message_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </div>
                  </button>
                ))}
            </>
          )}
        </div>
      </div>
      {/* 오른쪽 */}
      <div className="flex flex-col min-h-[814px] flex-1">
        {/* 헤더 - 채팅상대 */}
        <div className="relative flex items-center gap-3 h-[76px] p-4 bg-white/40 shadow-[0_4px_4px_rgba(0,0,0,0.1)]">
          <div className="w-11 h-11 rounded-full overflow-hidden bg-[#D9D9D9] flex items-center justify-center">
            {peer?.avatar_url ? (
              <Image
                src={peer?.avatar_url ?? "/default-avatar.png"}
                alt={`${peer?.display_name ?? "profile"} avatar`}
                width={44}
                height={44}
                className="rounded-full object-cover"
              />
            ) : (
              <span className="text-xs text-[#717182]">profile</span>
            )}
          </div>
          <div>
            <div className="text-[#0A0A0A]">
              {peer?.display_name ?? (roomId ? "대화 상대" : "대화 상대 선택")}
            </div>
            <div className="text-sm text-[#717182]">
              {peer
                ? `${peer.email}`
                : roomId
                ? "상대 정보를 불러오는 중..."
                : ""}
            </div>
          </div>
        </div>
        {/* 대화 내용 */}
        <div className="relative flex flex-col gap-2 p-4 min-h-[300px]">
          {!roomId && !peerId && (
            <div className="mx-auto mt-12 text-center text-sm text-[#717182]">
              좌측에서 유저를 검색해 대화를 시작해보세요!
            </div>
          )}
          {!roomId && peerId && (
            <div className="mx-auto mt-12 text-center text-sm text-[#717182]">
              첫 대화를 나눠보세요! (메시지를 보내면 채팅방이 생성됩니다)
            </div>
          )}
          {roomId && msgs.length === 0 && (
            <div className="mx-auto mt-12 text-center text-sm text-[#717182]">
              아직 메시지가 없어요. 대화를 시작해보세요!
            </div>
          )}
          {roomId &&
            msgs.map((m) => {
              const mine = m.sender_id === me;
              return (
                <div
                  key={m.id}
                  className={`flex items-end gap-1 ${
                    mine ? "justify-end" : ""
                  }`}
                >
                  {mine && (
                    <span className="text-[#717182] text-xs">
                      {new Date(m.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                  <div
                    className={`${
                      mine
                        ? "bg-[#6758FF] text-white"
                        : "bg-white/50 text-[#0A0A0A]"
                    } border border-[#6758FF]/30 rounded-xl px-4 py-2 max-w-[70%]`}
                  >
                    {m.content}
                  </div>
                  {!mine && (
                    <span className="text-[#717182] text-xs">
                      {new Date(m.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              );
            })}
        </div>
        {/* 메시지 입력창 */}
        <div className="mt-auto flex items-center gap-3 border border-[#E5E5E5] rounded-lg p-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={
              roomId
                ? "메시지 입력..."
                : peerId
                ? "메시지를 보내면 채팅방이 생성됩니다"
                : "대화 상대를 먼저 선택하세요"
            }
            disabled={(!roomId && !peerId) || sending}
            className="w-full focus:outline-none disabled:opacity-60 bg-transparent"
          />
          <ImageIcon className="text-[#717182] w-6 h-6" strokeWidth={1} />

          <button
            type="button"
            onClick={sendMessage}
            disabled={(!roomId && !peerId) || sending || !draft.trim()}
            className="bg-[#6758FF] p-1.5 rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Send className="text-white w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
