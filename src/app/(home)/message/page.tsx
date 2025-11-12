"use client";

import { createClient } from "@/utils/supabase/client";
import {
  ArrowLeft,
  Image as ImageIcon,
  Search,
  Send,
  Trash,
  X,
} from "lucide-react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { JSX } from "react";

type ChatProfile = {
  id: string;
  display_name: string;
  avatar_url: string;
  email: string;
};
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
  unread_count: number;
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
  const [myLastReadAt, setMyLastReadAt] = useState<string | null>(null);
  const [peerLastReadAt, setPeerLastReadAt] = useState<string | null>(null);

  /* 모바일 */
  const isThreadOpen = !!(roomId || peerId);

  /* 입력창 포커스 제어용 */
  const inputRef = useRef<HTMLInputElement | null>(null);

  // 채팅 전송 시 대화창 맨 아래로 스크롤 되도록
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "end",
    });
  };

  // 자정 리렌더용 상태
  const [nowTs, setNowTs] = useState<number>(() => Date.now());

  // 다음 자정까지 대기했다가 nowTs 갱신 → 리렌더 유도
  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1, // 내일 00:00
      0,
      0,
      0,
      0
    );
    const ms = nextMidnight.getTime() - now.getTime();

    const t = setTimeout(() => {
      setNowTs(Date.now()); // 상태만 바꿔도 리렌더됨
    }, ms);

    return () => clearTimeout(t);
  }, [nowTs]);

  // 한국시간 기준으로 만들기
  const ymdLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}년 ${m}월 ${day}일`;
  };

  // 날짜 라벨: 오늘/어제는 접두어 + (YYYY-MM-DD, 요일), 그 외는 YYYY-MM-DD (요일)
  const formatDateLabel = (d: Date) => {
    const today = new Date();
    const yesterday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - 1
    );

    const kToday = ymdLocal(today);
    const kYesterday = ymdLocal(yesterday);
    const kTarget = ymdLocal(d);
    const weekday = d.toLocaleDateString("ko-KR", { weekday: "short" }); // 예: (목)

    if (kTarget === kToday) return `${kTarget} ${weekday}요일`;
    if (kTarget === kYesterday) return `${kTarget} ${weekday}요일`;
    return `${kTarget} (${weekday})`;
  };

  // URL의 peerId를 state로 동기화 (roomId가 없을 때만)
  useEffect(() => {
    if (roomId) return; // room 모드가 우선
    Promise.resolve().then(() => setPeerId(peerIdParam ?? null));
  }, [peerIdParam, roomId]);

  // 방 또는 pre-chat에 진입하면 검색 UI 정리
  useEffect(() => {
    if (roomId || peerId) {
      setQ("");
      setDebouncedQ("");
      setResults([]);
      setIsSearching(false);
    }
  }, [roomId, peerId]);

  // 아무 방/프리챗도 선택되지 않은 상태가 되면 우측 패널 상태 초기화
  useEffect(() => {
    if (!roomId && !peerId) {
      setPeer(null);
      setPeerId(null);
      setMsgs([]);
      setMyLastReadAt(null);
      setPeerLastReadAt(null);
    }
  }, [roomId, peerId]);

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
        .select(
          "id, pair_min, pair_max, last_message_at, last_message_text, last_read_at_min, last_read_at_max"
        )
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

      // 룸 리스트 가공 (기본 정보 + 내 last_read 기준 임시 저장)
      const baseList: (RoomListItem & { _lastReadAt: string | null })[] =
        rlist.flatMap((r) => {
          const candidate = r.pair_min === me ? r.pair_max : r.pair_min; // string | null
          if (!candidate) return []; // 불완전한 행은 스킵
          const other_id: string = candidate; // 여기서 string 보장
          const p = byId.get(other_id);
          const lastReadAt =
            r.pair_min === me ? r.last_read_at_min : r.last_read_at_max;

          return [
            {
              id: r.id,
              other_id,
              other_name: p?.display_name ?? null,
              other_avatar: p?.avatar_url ?? null,
              last_message_at: r.last_message_at ?? null,
              last_message_text: r.last_message_text ?? null,
              unread_count: 0, // ⬅︎ 일단 0으로 채워두고
              _lastReadAt: lastReadAt ?? null, // ⬅︎ 나중에 카운트 쿼리에서 사용
            },
          ];
        });

      // 각 방의 미읽음 개수 계산 (내가 안 읽은, 상대가 보낸 메시지 수)
      const counts = await Promise.all(
        baseList.map(async (item) => {
          let q = supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("room_id", item.id)
            .neq("sender_id", me!); // 상대가 보낸 것만

          if (item._lastReadAt) {
            q = q.gt("created_at", item._lastReadAt); // 마지막 읽음 이후만
          }

          const { count } = await q;
          return count ?? 0;
        })
      );

      // 최종 리스트에 unread_count 주입 (불필요한 바인딩 없이 명시적으로 구성)
      const hydrated: RoomListItem[] = baseList.map((item, idx) => ({
        id: item.id,
        other_id: item.other_id,
        other_name: item.other_name,
        other_avatar: item.other_avatar,
        last_message_at: item.last_message_at,
        last_message_text: item.last_message_text,
        unread_count: counts[idx],
      }));

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
          if (roomId === r.id) {
            const peerLR =
              r.pair_min === me ? r.last_read_at_max : r.last_read_at_min;
            setPeerLastReadAt(peerLR ?? null);
          }
          const other_id = r.pair_min === me ? r.pair_max : r.pair_min;
          setRooms((prev) => {
            const idx = prev.findIndex((x) => x.id === r.id);
            const newLastAt = r.last_message_at ?? null;
            const newLastText = r.last_message_text ?? null;

            if (idx >= 0) {
              const prevItem = prev[idx];
              const changed =
                prevItem.last_message_at !== newLastAt ||
                prevItem.last_message_text !== newLastText;
              const updated: RoomListItem = {
                ...prevItem,
                last_message_at: newLastAt,
                last_message_text: newLastText,
              };
              if (changed) {
                const next = [...prev];
                next.splice(idx, 1);
                return [updated, ...next];
              } else {
                const next = [...prev];
                next[idx] = updated;
                return next; // 순서 유지
              }
            }

            // 리스트에 없는 방은 '마지막 메시지'가 생겼을 때만 추가 (단순 읽음 업데이트로는 추가하지 않음)
            if (!newLastAt && !newLastText) {
              return prev;
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
                last_message_at: newLastAt,
                last_message_text: newLastText,
                unread_count: 0,
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
          if (roomId === r.id) {
            const peerLR =
              r.pair_min === me ? r.last_read_at_max : r.last_read_at_min;
            setPeerLastReadAt(peerLR ?? null);
          }
          const other_id = r.pair_min === me ? r.pair_max : r.pair_min;
          setRooms((prev) => {
            const idx = prev.findIndex((x) => x.id === r.id);
            const newLastAt = r.last_message_at ?? null;
            const newLastText = r.last_message_text ?? null;

            if (idx >= 0) {
              const prevItem = prev[idx];
              const changed =
                prevItem.last_message_at !== newLastAt ||
                prevItem.last_message_text !== newLastText;
              const updated: RoomListItem = {
                ...prevItem,
                last_message_at: newLastAt,
                last_message_text: newLastText,
              };
              if (changed) {
                const next = [...prev];
                next.splice(idx, 1);
                return [updated, ...next];
              } else {
                const next = [...prev];
                next[idx] = updated;
                return next; // 순서 유지
              }
            }

            if (!newLastAt && !newLastText) {
              return prev;
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
                last_message_at: newLastAt,
                last_message_text: newLastText,
                unread_count: 0,
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
  }, [me, roomId, supabase]);

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
        .select("id, pair_min, pair_max, last_read_at_min, last_read_at_max")
        .eq("id", roomId)
        .single();
      if (roomErr || !room || cancelled) return;

      // 내 마지막 읽음 시각을 상태로 보관 (메시지별 unread UI 계산용)
      const initialMyLR =
        room.pair_min === me ? room.last_read_at_min : room.last_read_at_max;
      if (!cancelled) setMyLastReadAt(initialMyLR ?? null);
      // 상대의 마지막 읽음 시각 (내가 보낸 메시지의 읽음 여부 판단용)
      const initialPeerLR =
        room.pair_min === me ? room.last_read_at_max : room.last_read_at_min;
      setPeerLastReadAt(initialPeerLR ?? null);

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
      // 읽음 처리: 방 진입 시 내 마지막 읽음 시각 갱신 + 좌측 뱃지 0
      try {
        await supabase.rpc("mark_room_read", { room_id: roomId });
        setMyLastReadAt(new Date().toISOString());
        setRooms((prev) =>
          prev.map((x) => (x.id === roomId ? { ...x, unread_count: 0 } : x))
        );
      } catch (e) {
        console.error("mark_room_read failed", e);
      }
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
      setQ("");
      setDebouncedQ("");
      setResults([]);
      setIsSearching(false);
      return;
    }

    // 2) 없으면 pre-chat 모드로: peerId만 세팅 (방 생성 X)
    sp.delete("roomId");
    sp.set("peerId", otherUserId);
    router.push(`/message?${sp.toString()}`, { scroll: false });
    setQ("");
    setDebouncedQ("");
    setResults([]);
    setIsSearching(false);
  };

  const sendMessage = async () => {
    if ((!roomId && !peerId) || !me || !draft.trim() || sending) return;
    setSending(true);
    const content = draft.trim();
    setDraft("");

    /* 포커스를 input으로 */
    queueMicrotask(() => inputRef.current?.focus());

    let activeRoomId = roomId;

    if (!activeRoomId && peerId) {
      // 첫 메시지 시점에 방 생성 (RPC 우선, 실패 시 fallback)
      try {
        const { data } = await supabase
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
          /* 포커스 복구 */
          queueMicrotask(() => inputRef.current?.focus());
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
      /* 포커스 복구 */
      queueMicrotask(() => inputRef.current?.focus());
      return;
    }

    if (activeRoomId === roomId) {
      setMyLastReadAt(new Date().toISOString());
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

    /* 대화창 맨 아래로 */
    setTimeout(() => scrollToBottom(true), 0);

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

    /* 대화창 맨 아래로 */
    setTimeout(() => scrollToBottom(true), 0);

    /* 포커스 복구 */
    queueMicrotask(() => inputRef.current?.focus());
  };

  const goBackToList = () => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("roomId");
    sp.delete("peerId");
    router.push(`/message?${sp.toString()}`, { scroll: false });
  };

  // 스레드가 열리거나 전송 종료될 때 포커스
  useEffect(() => {
    if (isThreadOpen && !sending) {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [isThreadOpen, sending]);

  // 스레드가 열리면(또는 전송 종료) 맨 아래로
  useEffect(() => {
    if (isThreadOpen && !sending) {
      const t = setTimeout(() => scrollToBottom(false), 0);
      return () => clearTimeout(t);
    }
  }, [isThreadOpen, sending]);

  // 메시지가 추가/교체되면 맨 아래로
  useEffect(() => {
    if (isThreadOpen) {
      const t = setTimeout(() => scrollToBottom(true), 0);
      return () => clearTimeout(t);
    }
  }, [msgs.length, roomId, isThreadOpen]);

  return (
    <>
      <div className="w-full h-full pt-10 lg:p-18">
        <div className="lg:max-w-250 mx-auto">
          <div className="bg-white/40 rounded-xl shadow-md lg:shadow-xl h-200 lg:min-w-50 flex flex-row">
            {/* 왼쪽 */}
            <div
              className={`flex-none h-full w-full lg:w-auto
              ${isThreadOpen ? "hidden" : "block"} lg:block`}
            >
              {/* Top */}
              <div className="p-4 bg-white/40 rounded-tl-xl border-b border-b-[#E5E5E5]">
                <div className="relative flex items-center gap-3 border border-[#E5E5E5] rounded-lg p-3">
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
                  {isSearching && (
                    <button
                      type="button"
                      onClick={() => {
                        setQ("");
                        setIsSearching(false);
                      }}
                      className="cursor-pointer absolute right-2 text-xs text-[#717182]"
                    >
                      <X />
                    </button>
                  )}
                </div>
              </div>
              {/* 대화 상대 */}
              <div>
                {/* 목록: 검색 모드 vs 최근 채팅방 */}
                <div className="divide-y divide-black/5">
                  {isSearching ? (
                    <>
                      {debouncedQ && isLoading && (
                        <div className="flex items-center justify-center min-h-180 text-[#717182] text-center">
                          <p>검색 중…</p>
                        </div>
                      )}
                      {debouncedQ && !isLoading && results.length === 0 && (
                        <div className="flex items-center justify-center min-h-180 text-[#717182] text-center">
                          <p>검색 결과가 없어요.</p>
                        </div>
                      )}

                      {debouncedQ &&
                        !isLoading &&
                        results.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => openRoomWith(u.id)}
                            className="cursor-pointer relative flex w-full items-center gap-3 px-6 py-4 hover:bg-[#EAE8FF]"
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
                              <div className="text-[#0A0A0A]">
                                {u.display_name}
                              </div>
                            </div>
                          </button>
                        ))}
                    </>
                  ) : (
                    <>
                      {roomsLoading && (
                        <div className="p-4 pt-10 text-[#717182] text-center">
                          <p>채팅방을 불러오는 중…</p>
                        </div>
                      )}
                      {!roomsLoading && rooms.length === 0 && (
                        <div className="flex items-center justify-center min-h-180 text-[#717182] text-center">
                          <p>
                            아직 대화 내역이 없어요.
                            <br />
                            상단 검색바로 대화를 시작해보세요!
                          </p>
                        </div>
                      )}

                      {!roomsLoading &&
                        rooms.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => {
                              const sp = new URLSearchParams(
                                searchParams.toString()
                              );
                              sp.set("roomId", r.id);
                              router.push(`/message?${sp.toString()}`, {
                                scroll: false,
                              });
                            }}
                            className="relative flex w-full items-center gap-3 px-6 py-4 hover:bg-[#EAE8FF] cursor-pointer"
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
                            <div className="absolute right-4 flex flex-col items-end">
                              <div className="text-xs text-[#717182]">
                                {r.last_message_at
                                  ? new Date(
                                      r.last_message_at
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : ""}
                              </div>
                              {r.unread_count > 0 && (
                                <span className="mt-1 inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-[#6758FF] text-white text-[10px] px-1">
                                  {r.unread_count > 99 ? "99+" : r.unread_count}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                    </>
                  )}
                </div>
              </div>
            </div>
            {/* 오른쪽 */}
            <div
              className={`${isThreadOpen ? "flex" : "hidden"} lg:flex
              flex-1 flex-col justify-between h-full`}
            >
              {/* Top */}
              <div className="flex justify-between p-4 bg-white/40 rounded-tr-xl border-b border-b-[#E5E5E5]">
                {/* 모바일 전용 뒤로가기 */}
                <button
                  type="button"
                  onClick={goBackToList}
                  className="lg:hidden pl-3 text-[#717182] cursor-pointer"
                  aria-label="목록으로"
                  title="목록으로"
                >
                  {/* lucide-react에서 ArrowLeft 써도 좋아요 */}
                  <ArrowLeft size={26} />
                </button>
                <div className="flex gap-3 items-center">
                  {/* 이미지 */}
                  <div className="w-[50px] h-[50px] bg-gray-400 rounded-full">
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
                  {/* 이름 및 이메일 */}
                  <div>
                    <p>
                      {peer?.display_name ??
                        (roomId ? "대화 상대" : "대화 상대 선택")}
                    </p>
                    <p className="text-[#717182] text-sm">
                      {peer
                        ? `${peer.email}`
                        : roomId
                        ? "상대 정보를 불러오는 중..."
                        : ""}
                    </p>
                  </div>
                </div>
                {/* 대화방 삭제 버튼 */}
                {/* 모달창과 함께 구현하면 좋을 것 같음 */}
                <button
                  type="button"
                  className="cursor-pointer text-[#717182] pr-3"
                >
                  <Trash />
                </button>
              </div>

              {/* 대화 내용 */}
              <div className="px-6 py-4 flex flex-col gap-2 overflow-x-hidden overflow-y-auto">
                {/* 대화 내용 영역 */}
                <div>
                  {!roomId && !peerId && (
                    <div className="flex items-center justify-center text-[#717182]">
                      <p>좌측에서 유저를 검색해 대화를 시작해보세요!</p>
                    </div>
                  )}
                  {!roomId && peerId && (
                    <div className="flex items-center justify-center text-[#717182]">
                      <p>
                        첫 대화를 나눠보세요! (메시지를 보내면 채팅방이
                        생성됩니다)
                      </p>
                    </div>
                  )}
                  {roomId && msgs.length === 0 && (
                    <div className="flex items-center justify-center text-[#717182]">
                      <p>아직 메시지가 없어요. 대화를 시작해보세요!</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    {(roomId || peerId) &&
                      (() => {
                        let lastDateKey = "";
                        const blocks = msgs.flatMap((m) => {
                          const mine = m.sender_id === me;
                          const dt = new Date(m.created_at);
                          const dateKey = ymdLocal(dt); // YYYY-MM-DD
                          const needSep = dateKey !== lastDateKey;
                          lastDateKey = dateKey;

                          const parts: JSX.Element[] = [];

                          if (needSep) {
                            const label = formatDateLabel(dt);
                            parts.push(
                              <div
                                key={`sep-${dateKey}`}
                                className="relative my-4"
                              >
                                <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-black/10"></div>
                                <div className="relative mx-auto w-fit rounded-full border border-black/10 bg-white/60 px-3 py-1 text-xs text-[#4B4B57] backdrop-blur">
                                  {label}
                                </div>
                              </div>
                            );
                          }

                          parts.push(
                            <div
                              key={m.id}
                              className={`flex items-end gap-2 ${
                                mine ? "justify-end" : ""
                              }`}
                            >
                              {mine && (
                                <div className="flex flex-col items-end">
                                  {(() => {
                                    // 내가 보낸 메시지에 대해, 상대가 아직 읽지 않았다면 점 표시
                                    const unreadByPeer =
                                      !peerLastReadAt ||
                                      m.created_at > peerLastReadAt;
                                    return unreadByPeer ? (
                                      <span
                                        title="상대 미읽음"
                                        className="inline-block rounded-full text-xs font-semibold text-[#6758FF]"
                                      >
                                        1
                                      </span>
                                    ) : null;
                                  })()}
                                  <span className="text-[#717182] text-xs">
                                    {dt.toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              )}

                              {/* 메시지 버블 */}
                              <div
                                className={`${
                                  mine
                                    ? "bg-[#6758FF] text-white"
                                    : "bg-white/50 text-[#0A0A0A]"
                                } border border-[#6758FF]/30 rounded-xl px-4 py-2 max-w-[70%]`}
                              >
                                {m.content}
                              </div>

                              {/* 시간 + (상대 메시지일 때만) unread 점표시 */}
                              {!mine && (
                                <div className="flex items-center gap-2">
                                  <span className="text-[#717182] text-xs">
                                    {dt.toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                  {(() => {
                                    const unread =
                                      !myLastReadAt ||
                                      m.created_at > myLastReadAt;
                                    return unread ? (
                                      <span
                                        title="미읽음"
                                        className="inline-block w-2 h-2 rounded-full bg-[#6758FF]"
                                      ></span>
                                    ) : null;
                                  })()}
                                </div>
                              )}
                            </div>
                          );

                          return parts;
                        });

                        // 자정을 지나 ‘오늘’이 되었는데 아직 오늘 메시지가 하나도 없으면, 맨 아래에 "오늘" 구분선 가상 추가
                        const todayKey = ymdLocal(new Date(nowTs));
                        const hasToday = msgs.some(
                          (m) => ymdLocal(new Date(m.created_at)) === todayKey
                        );
                        if (!hasToday) {
                          blocks.push(
                            <div
                              key={`sep-${todayKey}`}
                              className="relative my-4"
                            >
                              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-black/10"></div>
                              <div className="relative mx-auto w-fit rounded-full border border-black/10 bg-white/60 px-3 py-1 text-xs text-[#4B4B57] backdrop-blur">
                                {formatDateLabel(new Date(nowTs))}
                              </div>
                            </div>
                          );
                        }

                        return blocks;
                      })()}
                  </div>
                  {/* 스크롤 바닥 센티넬 */}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* 메시지 입력창 */}
              <div className="p-4">
                <div className="flex items-center gap-3 border border-[#E5E5E5] rounded-lg p-3">
                  <input
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                        setTimeout(() => inputRef.current?.focus(), 0);
                      }
                    }}
                    placeholder={
                      roomId
                        ? "메시지 입력..."
                        : peerId
                        ? "메시지를 보내면 채팅방이 생성됩니다"
                        : "대화 상대를 먼저 선택하세요"
                    }
                    disabled={!roomId && !peerId}
                    aria-busy={sending || undefined}
                    className="w-full focus:outline-none disabled:opacity-60 bg-transparent"
                  />
                  <ImageIcon
                    className="text-[#717182] w-6 h-6"
                    strokeWidth={1}
                  />

                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={(!roomId && !peerId) || sending || !draft.trim()}
                    className="bg-[#6758FF] p-1.5 rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <Send className="text-white w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
