/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { createClient } from "@/utils/supabase/client";
import {
  ArrowLeft,
  Image as ImageIcon,
  Search,
  Send,
  Smile,
  X,
} from "lucide-react";
// 🌟 1. UserAvatar 임포트 (Logo는 헤더에서만 사용)
import Logo from "../../../assets/svg/Logo";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { JSX } from "react";
import uploadImageMessage from "@/utils/supabase/storage/messages";
import UserAvatar from "@/components/shop/UserAvatar";
import { EmojiPicker } from "@ferrucc-io/emoji-picker";

/* =========================
 * 타입
 * ========================= */
// 🌟 2. ChatProfile 타입에 뱃지 ID 추가
type ChatProfile = {
  id: string;
  display_name: string;
  avatar_url: string;
  email: string;
  equipped_badge_id: string | null; // 👈 뱃지 ID 추가
};
type ChatMessage = {
  id: string;
  created_at: string;
  room_id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
};
// 🌟 3. RoomListItem 타입에 뱃지 ID 추가
type RoomListItem = {
  id: string;
  other_id: string;
  other_name: string | null;
  other_avatar: string | null;
  other_equipped_badge_id: string | null; // 👈 뱃지 ID 추가
  last_message_at: string | null;
  last_message_text: string | null;
  unread_count: number;
};

/* =========================
 * 유틸: 로컬 기준 YYYY-MM-DD, 날짜 라벨
 * ========================= */
// ... (ymdLocal, formatDateLabel 함수 동일) ...
// 로컬(브라우저) 기준 YYYY-MM-DD
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
  const weekday = d.toLocaleDateString("ko-KR", { weekday: "short" }); // (목) 같은 형식

  if (kTarget === kToday) return `${kTarget} ${weekday}요일`;
  if (kTarget === kYesterday) return `${kTarget} ${weekday}요일`;
  return `${kTarget} (${weekday})`;
};

export default function MessagePageClient() {
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

  const [isEmojiOpen, setIsEmojiOpen] = useState(false); // 이모지 모달 상태

  /* 모바일: 우측 스레드 열림 여부 */
  const isThreadOpen = !!(roomId || peerId);

  /* ===== 입력창 포커스 제어: 전송/전환 시 자동 포커스 복구 ===== */
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* ===== 전송 시/로드 시 대화창 맨 아래로 스크롤 ===== */
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "end",
    });
  };

  /* ===== 자정(오전 12시) 지나면 날짜 라벨이 자동으로 갱신되도록 리렌더 유도 ===== */
  // ... (nowTs 로직 동일) ...
  const [nowTs, setNowTs] = useState<number>(() => Date.now());
  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
      0
    );
    const ms = nextMidnight.getTime() - now.getTime();
    const t = setTimeout(() => setNowTs(Date.now()), ms);
    return () => clearTimeout(t);
  }, [nowTs]);

  /* ===== URL의 peerId를 state로 동기화 (roomId가 우선) ===== */
  useEffect(() => {
    if (roomId) return;
    Promise.resolve().then(() => setPeerId(peerIdParam ?? null));
  }, [peerIdParam, roomId]);

  /* ===== 방/프리챗 진입 시 검색 UI 정리 ===== */
  useEffect(() => {
    if (roomId || peerId) {
      setQ("");
      setDebouncedQ("");
      setResults([]);
      setIsSearching(false);
    }
  }, [roomId, peerId]);

  /* ===== 스레드 닫히면 우측 상태 초기화 ===== */
  useEffect(() => {
    if (!roomId && !peerId) {
      setPeer(null);
      setPeerId(null);
      setMsgs([]);
      setMyLastReadAt(null);
      setPeerLastReadAt(null);
    }
  }, [roomId, peerId]);

  /* ===== 내 사용자 ID 로드 ===== */
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

  /* ===== 검색 디바운스 ===== */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  /* ===== 좌측: 내 채팅방 목록 불러오기 ===== */
  useEffect(() => {
    let cancelled = false;
    if (!me) return;
    (async () => {
      setRoomsLoading(true);
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

      const otherIds = rlist
        .map((r) => (r.pair_min === me ? r.pair_max : r.pair_min))
        .filter(Boolean) as string[];

      if (otherIds.length === 0) {
        if (!cancelled) {
          setRooms([]);
          setRoomsLoading(false);
        }
        return;
      }

      // 🌟 4. 쿼리 수정: 뱃지 ID 추가
      const { data: plist } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, equipped_badge_id")
        .in("id", otherIds);

      const byId = new Map(plist?.map((p) => [p.id, p]) ?? []);

      const baseList: (RoomListItem & { _lastReadAt: string | null })[] =
        rlist.flatMap((r) => {
          const candidate = r.pair_min === me ? r.pair_max : r.pair_min;
          if (!candidate) return [];
          const other_id: string = candidate;
          const p = byId.get(other_id);
          const lastReadAt =
            r.pair_min === me ? r.last_read_at_min : r.last_read_at_max;

          // 🌟 5. 매핑 수정: 뱃지 ID 추가
          return [
            {
              id: r.id,
              other_id,
              other_name: p?.display_name ?? null,
              other_avatar: p?.avatar_url ?? null,
              other_equipped_badge_id: p?.equipped_badge_id ?? null, // 👈 뱃지 ID 추가
              last_message_at: r.last_message_at ?? null,
              last_message_text: r.last_message_text ?? null,
              unread_count: 0,
              _lastReadAt: lastReadAt ?? null,
            },
          ];
        });

      // 각 방 미읽음 계산
      const counts = await Promise.all(
        baseList.map(async (item) => {
          let q = supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("room_id", item.id)
            .neq("sender_id", me!);
          if (item._lastReadAt) q = q.gt("created_at", item._lastReadAt);
          const { count } = await q;
          return count ?? 0;
        })
      );

      const hydrated: RoomListItem[] = baseList.map((item, idx) => ({
        id: item.id,
        other_id: item.other_id,
        other_name: item.other_name,
        other_avatar: item.other_avatar,
        other_equipped_badge_id: item.other_equipped_badge_id, // 👈 뱃지 ID 추가
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

  /* ===== 실시간: message_rooms 업데이트 반영 ===== */
  useEffect(() => {
    if (!me) return;

    const patchRoomUpdate = (r: any) => {
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
            return next;
          }
        }

        if (!newLastAt && !newLastText) {
          return prev;
        }

        (async () => {
          // 🌟 6. 쿼리 수정: 뱃지 ID 추가
          const { data: p } = await supabase
            .from("profiles")
            .select("id, display_name, avatar_url, equipped_badge_id")
            .eq("id", other_id)
            .maybeSingle();
          // 🌟 7. 매핑 수정: 뱃지 ID 추가
          const item: RoomListItem = {
            id: r.id,
            other_id,
            other_name: p?.display_name ?? null,
            other_avatar: p?.avatar_url ?? null,
            other_equipped_badge_id: p?.equipped_badge_id ?? null, // 👈 뱃지 ID 추가
            last_message_at: newLastAt,
            last_message_text: newLastText,
            unread_count: 0,
          };
          setRooms((cur) => [item, ...cur]);
        })();
        return prev;
      });
    };

    // ... (channel 구독 로직 동일) ...
    const channel = supabase
      .channel(`rooms-realtime-${me}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "message_rooms",
          filter: `pair_min=eq.${me}`,
        },
        (payload) => patchRoomUpdate(payload.new)
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "message_rooms",
          filter: `pair_max=eq.${me}`,
        },
        (payload) => patchRoomUpdate(payload.new)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [me, roomId, supabase]);

  // 새 메시지 리얼타임 , 내가 보고있지 않은 방에만 뱃지 적용
  // ... (ch 구독 로직 동일) ...
  useEffect(() => {
    if (!me) return;
    const ch = supabase
      .channel(`message-badge-${me}`)
      .on(
        `postgres_changes`,
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const m = payload.new as ChatMessage;
          // 내가 보낸건 빼고
          if (m.sender_id === me) return;
          // 현재 보고있는 방이면: 메시지를 바로 우측 패널에 추가 + 읽음 처리 (뱃지 X)
          if (roomId === m.room_id) {
            setMsgs((prev) => {
              // 혹시 이미 존재하면 중복 추가 방지
              if (prev.some((msg) => msg.id === m.id)) return prev;
              return [...prev, m];
            });

            (async () => {
              try {
                await supabase
                  .rpc("mark_room_read", { room_id: m.room_id })
                  .throwOnError();
                setMyLastReadAt(new Date().toISOString());
                // 좌측 목록 뱃지도 즉시 0으로
                setRooms((prev) =>
                  prev.map((x) =>
                    x.id === m.room_id ? { ...x, unread_count: 0 } : x
                  )
                );
              } catch (err) {
                console.log(err);
              }
            })();

            return;
          }
          // 방 카드가 이미 있을떄 좌측 목록에 뱃지 +1
          setRooms((prev) => {
            const idx = prev.findIndex((x) => x.id === m.room_id);
            if (idx < 0) return prev;
            const next = [...prev];
            next[idx] = {
              ...next[idx],
              unread_count: (next[idx].unread_count ?? 0) + 1,
            };
            return next;
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [me, roomId, supabase]);

  /* ===== 검색 ===== */
  useEffect(() => {
    let cancelled = false;
    if (!debouncedQ) {
      return () => {
        cancelled = true;
      };
    }
    (async () => {
      setLoading(true);
      // 🌟 8. 쿼리 수정: 뱃지 ID 추가
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, email, equipped_badge_id")
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

  /* ===== 방 선택 시: 상대/메시지 로드 + 읽음 처리 ===== */
  useEffect(() => {
    let cancelled = false;
    if (!roomId || !me) {
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      const { data: room, error: roomErr } = await supabase
        .from("message_rooms")
        .select("id, pair_min, pair_max, last_read_at_min, last_read_at_max")
        .eq("id", roomId)
        .single();
      if (roomErr || !room || cancelled) return;

      const initialMyLR =
        room.pair_min === me ? room.last_read_at_min : room.last_read_at_max;
      if (!cancelled) setMyLastReadAt(initialMyLR ?? null);

      const initialPeerLR =
        room.pair_min === me ? room.last_read_at_max : room.last_read_at_min;
      setPeerLastReadAt(initialPeerLR ?? null);

      const otherId = room.pair_min === me ? room.pair_max : room.pair_min;
      Promise.resolve().then(() => {
        if (!cancelled) setPeerId(otherId);
      });

      if (otherId) {
        // 🌟 9. 쿼리 수정: 뱃지 ID 추가
        const { data: p } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url, email, equipped_badge_id")
          .eq("id", otherId)
          .maybeSingle();
        if (!cancelled) setPeer(p as ChatProfile | null);
      }

      const { data: mlist } = await supabase
        .from("messages")
        .select("id, created_at, room_id, sender_id, content, image_url")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(50);
      if (!cancelled && mlist) setMsgs(mlist as ChatMessage[]);

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

  /* ===== pre-chat: peerId만 있을 때 상대 로드 ===== */
  useEffect(() => {
    let cancelled = false;
    if (roomId || !peerId || !me) {
      return () => {
        cancelled = true;
      };
    }
    (async () => {
      // 🌟 10. 쿼리 수정: 뱃지 ID 추가
      const { data: p } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, email, equipped_badge_id")
        .eq("id", peerId)
        .maybeSingle();
      if (!cancelled) setPeer(p as ChatProfile | null);
      if (!cancelled) setMsgs([]); // 아직 방 없음
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId, peerId, me, supabase]);

  /* =========================
   * 방 열기/생성
   * ========================= */
  // ... (openRoomWith 함수 동일) ...
  const openRoomWith = async (otherUserId: string) => {
    const { data: u } = await supabase.auth.getUser();
    const myId = u?.user?.id;
    if (!myId) return;

    const a = myId < otherUserId ? myId : otherUserId;
    const b = myId < otherUserId ? otherUserId : myId;

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

    sp.delete("roomId");
    sp.set("peerId", otherUserId);
    router.push(`/message?${sp.toString()}`, { scroll: false });
    setQ("");
    setDebouncedQ("");
    setResults([]);
    setIsSearching(false);
  };

  /* =========================
   * 전송 (낙관적 UI + 포커스/스크롤)
   * ========================= */

  // ... (sendMessage, handleImageSelected 함수 동일) ...
  const sendMessage = async (opts?: { imageFile?: File }) => {
    const hasImage = !!opts?.imageFile;
    const content = draft.trim();

    if ((!roomId && !peerId) || !me || sending) return;
    if (!hasImage && !content) return;
    if (!hasImage && content) setDraft("");
    setSending(true);

    // 입력 포커스 유지
    queueMicrotask(() => inputRef.current?.focus());

    // 입력 포커스 유지
    queueMicrotask(() => inputRef.current?.focus());

    let activeRoomId = roomId;

    if (!activeRoomId && peerId) {
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
        const a = myId < peerId ? myId : peerId!;
        const b = myId < peerId ? peerId! : myId;

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
          const { data: upserted, error: upErr } = await supabase
            .from("message_rooms")
            .upsert(
              { pair_min: a, pair_max: b },
              { onConflict: "pair_min,pair_max" }
            )
            .select("id")
            .single();
          if (upErr) console.error("upsert room error:", upErr);
          activeRoomId = upserted?.id ?? null;
        }

        if (!activeRoomId) {
          setSending(false);
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
      queueMicrotask(() => inputRef.current?.focus());
      return;
    }
    if (activeRoomId === roomId) {
      setMyLastReadAt(new Date().toISOString());
    }

    let imageUrl: string | null = null;
    if (opts?.imageFile) {
      imageUrl = await uploadImageMessage(
        supabase,
        activeRoomId,
        opts.imageFile
      );
    }

    // 낙관적 메시지
    const temp: ChatMessage = {
      id: `temp-${Date.now()}`,
      created_at: new Date().toISOString(),
      room_id: activeRoomId,
      sender_id: me,
      content: content || null,
      image_url: imageUrl || null,
    };
    setMsgs((prev) => [...prev, temp]);

    // 전송 직후 맨 아래로
    setTimeout(() => scrollToBottom(true), 0);

    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          room_id: activeRoomId,
          sender_id: me,
          content: content || null,
          image_url: imageUrl,
        },
      ])
      .select("id, created_at, room_id, sender_id, content, image_url")
      .single();

    if (error) {
      console.error("insert message error:", error);
    }

    if (!error && data) {
      setMsgs((prev) =>
        prev.map((m) => (m.id === temp.id ? (data as ChatMessage) : m))
      );
    } else {
      // 실패 시 롤백 + 드래프트 복구
      setMsgs((prev) => prev.filter((m) => m.id !== temp.id));
      setDraft(content);
    }

    setSending(false);

    // 전송 완료 후에도 바닥 고정
    setTimeout(() => scrollToBottom(true), 0);

    // 입력 포커스 복구
    queueMicrotask(() => inputRef.current?.focus());
  };

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    sendMessage({ imageFile: file });
    e.target.value = "";
  };

  /* =========================
   * 라우팅: 모바일 뒤로가기
   * ========================= */
  const goBackToList = () => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("roomId");
    sp.delete("peerId");
    router.push(`/message?${sp.toString()}`, { scroll: false });
  };

  /* =========================
   * 포커스 & 스크롤 관리
   * ========================= */
  // ... (포커스/스크롤 useEffects 동일) ...
  useEffect(() => {
    if (isThreadOpen && !sending) {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [isThreadOpen, sending]);

  useEffect(() => {
    if (isThreadOpen && !sending) {
      const t = setTimeout(() => scrollToBottom(false), 0);
      return () => clearTimeout(t);
    }
  }, [isThreadOpen, sending]);

  useEffect(() => {
    if (isThreadOpen) {
      const t = setTimeout(() => scrollToBottom(true), 0);
      return () => clearTimeout(t);
    }
  }, [msgs.length, roomId, isThreadOpen]);

  // 이모지 선택했을 때 텍스트에 붙이고 모달 닫기
  const handleSelectEmoji = (emoji: any) => {
    // 라이브러리 구현에 따라 string 또는 객체일 수 있으니 방어적으로 처리
    const char =
      typeof emoji === "string" ? emoji : emoji?.emoji ?? emoji?.native ?? "";

    if (!char) return;

    setDraft((prev) => prev + char);
    setIsEmojiOpen(false);
  };

  /* =========================
   * 렌더
   * ========================= */
  return (
    <>
      <section className="w-full h-full lg:pt-10">
        <div className="lg:max-w-250 mx-auto px-6 h-full">
          <div className="bg-white/40 rounded-xl border border-white/10 lg:shadow-xl h-full lg:h-200 lg:min-w-50 flex flex-row dark:bg-white/20 dark:shadow-white/20">
            {/* ============ 왼쪽 패널 ============ */}
            <div
              className={`flex-1 flex-col h-full w-full lg:max-w-[300px] ${
                isThreadOpen ? "hidden" : "block"
              } lg:flex `}
            >
              {/* 검색 바 */}
              <div className="p-4 bg-white/40 rounded-xl lg:rounded-tl-xl border-b border-b-[#E5E5E5] dark:bg-white/15 dark:border-b-[#E5E5E5]/50">
                <div className="relative flex items-center gap-3 border border-[#E5E5E5] rounded-lg p-3 dark:border-[#E5E5E5]/50">
                  <Search className="text-[#DBDBDB]" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onFocus={() => setIsSearching(true)}
                    onBlur={() => {
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
                      className="cursor-pointer absolute right-2 text-xs text-[#717182] dark:text-white/60"
                    >
                      <X />
                    </button>
                  )}
                </div>
              </div>

              {/* 목록 */}
              <div className="lg:h-full lg:border-r lg:border-[#E5E5E5]">
                <div className="divide-y divide-black/5">
                  {isSearching ? (
                    <>
                      {debouncedQ && isLoading && (
                        <div className="flex items-center justify-center min-h-180 text-[#717182] text-center dark:text-white/60">
                          <p>검색 중…</p>
                        </div>
                      )}
                      {debouncedQ && !isLoading && results.length === 0 && (
                        <div className="flex items-center justify-center min-h-180 text-[#717182] text-center dark:text-white/60">
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
                            {/* 🌟 11. JSX 수정: 검색 결과 아바타 */}
                            <UserAvatar
                              src={u.avatar_url}
                              alt={`${u.display_name} avatar`}
                              equippedBadgeId={u.equipped_badge_id}
                              className="w-11 h-11 shrink-0"
                            />
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
                        <div className="p-4 pt-10 text-[#717182] text-center dark:text-white/60">
                          <p>채팅방을 불러오는 중…</p>
                        </div>
                      )}
                      {!roomsLoading && rooms.length === 0 && (
                        <div className="flex items-center justify-center min-h-180 text-[#717182] text-center dark:text-white/60">
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
                            className="relative flex w-full items-center gap-3 px-6 py-4 hover:bg-[#EAE8FF] cursor-pointer dark:hover:bg-[#8b80ff]/50"
                          >
                            {/* 🌟 12. JSX 수정: 채팅방 목록 아바타 */}
                            <UserAvatar
                              src={r.other_avatar}
                              alt={`${r.other_name ?? "profile"} avatar`}
                              equippedBadgeId={r.other_equipped_badge_id}
                              className="w-11 h-11 shrink-0"
                            />
                            <div className="text-left">
                              <div>{r.other_name ?? "대화 상대"}</div>
                              <div className="text-sm text-[#717182] truncate max-w-[420px] dark:text-[#A6A6DB]">
                                {r.last_message_text ?? "대화를 시작해보세요"}
                              </div>
                            </div>
                            <div className="absolute right-4 flex flex-col items-end">
                              <div className="text-xs text-[#717182] dark:text-white/60">
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
                                <span className="mt-1 inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-[#6758FF] text-white text-xs px-1">
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

            {/* ============ 오른쪽 스레드 ============ */}
            <div
              className={` ${
                isThreadOpen ? "flex" : "hidden"
              } lg:flex flex-1 flex-col justify-between h-full`}
            >
              {/* 상단 바 */}
              <div className="flex justify-between p-4 bg-white/40 rounded-t-xl lg:rounded-tr-xl border-b border-b-[#E5E5E5] dark:bg-white/15 dark:border-b-[#E5E5E5]/50">
                {/* 모바일 전용 뒤로가기 */}
                <button
                  type="button"
                  onClick={goBackToList}
                  className="lg:hidden pl-3 text-[#717182] cursor-pointer"
                  aria-label="목록으로"
                  title="목록으로"
                >
                  <ArrowLeft size={26} />
                </button>
                <div className="flex gap-3 items-center">
                  {/* 🌟 13. JSX 수정: 채팅방 헤더 아바타 */}
                  <Link
                    href={peer ? `/profile?userId=${peer.id}` : "#"}
                    className={`shrink-0 ${
                      peer ? "hover:opacity-80 transition-opacity" : ""
                    }`}
                  >
                    {peer?.avatar_url ? (
                      <UserAvatar
                        src={peer?.avatar_url}
                        alt={`${peer?.display_name ?? "profile"} avatar`}
                        equippedBadgeId={peer?.equipped_badge_id}
                        className="w-[50px] h-[50px]"
                      />
                    ) : (
                      <div className="w-[50px] h-[50px] flex items-center justify-center bg-white/70 rounded-full overflow-hidden">
                        <Logo size="md" />
                      </div>
                    )}
                  </Link>

                  <div>
                    <p>
                      {peer?.display_name ??
                        (roomId ? "대화 상대" : "대화 상대 선택")}
                    </p>
                    <p className="text-[#717182] text-sm dark:text-[#A6A6DB]">
                      {peer
                        ? `${peer.email}`
                        : roomId
                        ? "상대 정보를 불러오는 중..."
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="w-6 h-6"></div>
              </div>

              {/* 대화 내용 (스크롤 영역) */}
              {/* ... (대화 내용, 입력창 로직은 모두 동일) ... */}
              <div className="px-6 py-4 flex flex-col gap-2 overflow-x-hidden overflow-y-auto">
                <div>
                  {!roomId && !peerId && (
                    <div className="flex items-center justify-center text-[#717182] dark:text-white/60">
                      <p>좌측에서 유저를 검색해 대화를 시작해보세요!</p>
                    </div>
                  )}
                  {!roomId && peerId && (
                    <div className="flex items-center justify-center text-[#717182] dark:text-white/60">
                      <p>
                        첫 대화를 나눠보세요! (메시지를 보내면 채팅방이
                        생성됩니다)
                      </p>
                    </div>
                  )}
                  {roomId && msgs.length === 0 && (
                    <div className="flex items-center justify-center text-[#717182] dark:text-white/60">
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
                          const dateKey = ymdLocal(dt);
                          const needSep = dateKey !== lastDateKey;
                          lastDateKey = dateKey;

                          const parts: JSX.Element[] = [];

                          // [date-sep] 날짜 구분선
                          if (needSep) {
                            const label = formatDateLabel(dt);
                            parts.push(
                              <div
                                key={`sep-${dateKey}`}
                                className="relative my-4"
                              >
                                <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-black/10 dark:bg-gray-400"></div>
                                <div className="relative mx-auto w-fit rounded-full border border-black/10 bg-white/60 px-3 py-1 text-xs text-[#4B4B57] backdrop-blur dark:text-white dark:bg-white/20">
                                  {label}
                                </div>
                              </div>
                            );
                          }

                          // 메시지 버블
                          parts.push(
                            <div
                              key={m.id}
                              className={`flex items-end gap-2 ${
                                mine ? "justify-end" : ""
                              }`}
                            >
                              {/* 내 메시지: 시간/상대 미읽음 표시 */}
                              {mine && (
                                <div className="flex flex-col items-end">
                                  {(() => {
                                    const unreadByPeer =
                                      !peerLastReadAt ||
                                      m.created_at > peerLastReadAt;
                                    return unreadByPeer ? (
                                      <span
                                        title="상대 미읽음"
                                        className="inline-block rounded-full text-xs font-semibold text-[#6758FF] dark:text-[#A6A6DB]"
                                      >
                                        1
                                      </span>
                                    ) : null;
                                  })()}
                                  <span className="text-[#717182] text-xs dark:text-white/60">
                                    {dt.toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              )}

                              {/* 버블 */}
                              <div
                                className={`${
                                  mine
                                    ? "bg-[#6758FF] text-white"
                                    : "bg-white/50 dark:bg-white/20"
                                } border border-[#6758FF]/30 rounded-xl px-4 py-2 max-w-[70%]`}
                              >
                                {m.image_url && (
                                  <div className="mb-1">
                                    <Image
                                      src={m.image_url}
                                      alt="전송한 이미지"
                                      width={240}
                                      height={240}
                                      className="rounded-lg max-w-full h-auto"
                                    />
                                  </div>
                                )}
                                {m.content && <p>{m.content}</p>}
                              </div>

                              {/* 상대 메시지: 시간/내 미읽음 점 */}
                              {!mine && (
                                <div className="flex items-center gap-2">
                                  <span className="text-[#717182] text-xs dark:text-white/60">
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
                                        title="상대 미읽음"
                                        className="inline-block rounded-full text-xs font-semibold text-[#6758FF] dark:text-[#A6A6DB]"
                                      >
                                        1
                                      </span>
                                    ) : null;
                                  })()}
                                </div>
                              )}
                            </div>
                          );

                          return parts;
                        });

                        // [date-sep] 스레드가 열려 있고, 오늘 메시지가 하나도 없으면 '오늘' 라벨을 가상으로 추가
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

                  {/* ✅ 스크롤 바닥 센티넬: 여기를 scrollIntoView로 내려붙임 */}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* 입력창 */}
              <div className="p-4">
                <div className="flex items-center gap-3 border border-[#E5E5E5] rounded-lg p-3 dark:border-[#E5E5E5]/50 ">
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
                    className="w-full focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed bg-transparent"
                  />
                  {/* 이모지 버튼 */}
                  <button
                    type="button"
                    className="cursor-pointer text-[#A6A6DB] hover:text-[#6758FF] disabled:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={!roomId && !peerId}
                    onClick={() => {
                      setIsEmojiOpen(true);
                    }}
                  >
                    <Smile size={20} />
                  </button>
                  <input
                    ref={fileInputRef}
                    disabled={!roomId && !peerId}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelected}
                  />
                  <button
                    className="text-[#717182] w-6 h-6 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={!roomId && !peerId}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon strokeWidth={1} />
                  </button>

                  {/* ✅ 보내기 버튼 (마우스다운으로 포커스 뺏기 방지) */}
                  <button
                    type="button"
                    onClick={() => sendMessage()}
                    disabled={
                      (!roomId && !peerId) ||
                      sending ||
                      (!draft.trim() && !fileInputRef.current?.files?.length)
                    }
                    className="bg-[#6758FF] p-1.5 rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
                    onMouseDown={(e) => e.preventDefault()}
                    aria-label="메시지 전송"
                    title="메시지 전송"
                  >
                    <Send size={12} className="text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 이모지 피커 모달 */}
      {isEmojiOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setIsEmojiOpen(false)} // 바깥 클릭 시 닫힘
        >
          <div
            className="rounded-xl bg-white dark:bg-slate-900 border border-white/70 dark:border-white/10 shadow-2xl p-3 max-w-xl w-full"
            onClick={(e) => e.stopPropagation()} // 안쪽 클릭은 유지
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-slate-500 dark:text-slate-300">
                이모지 선택
              </span>
              <button
                type="button"
                onClick={() => setIsEmojiOpen(false)}
                className="cursor-pointer p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <EmojiPicker onEmojiSelect={handleSelectEmoji}>
              {/* 상단 검색바 */}
              <EmojiPicker.Header className="p-2">
                <EmojiPicker.Input
                  placeholder="."
                  className="w-full pl-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-xs"
                />
              </EmojiPicker.Header>

              {/* 이모지 리스트 */}
              <EmojiPicker.Group className="max-h-64 overflow-y-auto">
                <EmojiPicker.List />
              </EmojiPicker.Group>
            </EmojiPicker>
          </div>
        </div>
      )}
    </>
  );
}
