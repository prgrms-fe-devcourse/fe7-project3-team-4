"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ModelToggle from "./post/ModelToggle";
import TextWeekly from "./weekly/TextWeekly";
import ImgWeekly from "./weekly/ImgWeekly";
import WeeklyNotice from "./weekly/WeeklyNotice";
import { PostType, WeeklyModel } from "@/types/Post";
import { useTheme } from "../theme/ThemeProvider";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

// [수정] Props 타입 정의 및 핸들러 추가
type WeeklyProps = {
  data: PostType[];
  onLikeToggle?: (id: string) => void;
  onBookmarkToggle?: (id: string, type: "post" | "news") => void;
  activeSubType: string | null;
};

// yyyy-mm-dd 포맷으로 변환
function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 오늘 날짜 키
function getTodayKey() {
  return toDateKey(new Date());
}

// created_at(ISO 문자열)을 yyyy-mm-dd로 변환
function getPostDateKey(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return toDateKey(d);
}

// 날짜 라벨 (YYYY년 M월 D일 요일)
function formatDateLabel(dateKey: string) {
  const base = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(base.getTime())) return dateKey;

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "full",
    timeZone: "Asia/Seoul",
  }).format(base);
}

export default function Weekly({
  data,
  onLikeToggle,
  onBookmarkToggle,
  activeSubType,
}: WeeklyProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDark } = useTheme();

  const [activeModel, setActiveModel] = useState<WeeklyModel>(() => {
    if (activeSubType === "Image") return "Image";
    return "Text";
  });

  // 날짜 상태: URL 쿼리의 ?day=yyyy-mm-dd 를 우선 사용, 없으면 오늘
  const [currentDateKey, setCurrentDateKey] = useState<string>(() => {
    const fromQuery = searchParams.get("day");
    return fromQuery || getTodayKey();
  });

  const currentDateLabel = useMemo(
    () => formatDateLabel(currentDateKey),
    [currentDateKey]
  );

  const updateUrl = (model: WeeklyModel, dateKey: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sub_type", model);
    params.set("day", dateKey);
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  const handleModelChange = (model: WeeklyModel) => {
    setActiveModel(model);
    updateUrl(model, currentDateKey);
  };

  // 날짜 이동 핸들러
  const handleChangeDay = (delta: number) => {
    const base = new Date(`${currentDateKey}T00:00:00`);
    base.setDate(base.getDate() + delta);
    const nextKey = toDateKey(base);
    setCurrentDateKey(nextKey);
    updateUrl(activeModel, nextKey);
  };

  const handleGoToday = () => {
    const todayKey = getTodayKey();
    setCurrentDateKey(todayKey);
    updateUrl(activeModel, todayKey);
  };

  const filtered = useMemo(
    () =>
      data.filter((post) => {
        const modeMatch =
          post.result_mode?.toLowerCase() === activeModel.toLowerCase();
        const dateMatch = getPostDateKey(post.created_at) === currentDateKey;
        return modeMatch && dateMatch;
      }),
    [data, activeModel, currentDateKey]
  );

  return (
    <>
      <ModelToggle
        mode="weekly"
        active={activeModel}
        onChange={handleModelChange}
      />

      {/* 날짜 네비게이션 바 */}
      <div className="mt-4 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-lg text-[#4B4B57] dark:text-slate-200">
          <CalendarDays className="w-4 h-4" />
          <span className="font-medium">{currentDateLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleChangeDay(-1)}
            className="cursor-pointer inline-flex items-center justify-center rounded-full border border-black/10 bg-white/60 px-3 py-1 text-xs shadow-sm hover:bg-white dark:bg-slate-800/70 dark:border-white/15 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="w-3 h-3 mr-1" />
            이전
          </button>

          <button
            type="button"
            onClick={handleGoToday}
            className="cursor-pointer inline-flex items-center justify-center rounded-full bg-[#6758FF] px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-[#4d41cf] dark:bg-[#332c7e]"
          >
            오늘
          </button>

          <button
            type="button"
            onClick={() => handleChangeDay(1)}
            className="cursor-pointer inline-flex items-center justify-center rounded-full border border-black/10 bg-white/60 px-3 py-1 text-xs shadow-sm hover:bg-white dark:bg-slate-800/70 dark:border-white/15 dark:hover:bg-slate-800"
          >
            다음
            <ChevronRight className="w-3 h-3 ml-1" />
          </button>
        </div>
      </div>

      {/* 주간 챌린지 공지 (날짜별로 주제 고정) */}
      <WeeklyNotice active={activeModel} dateKey={currentDateKey} />

      <div className="flex justify-center">
        {isDark ? (
          <svg
            width="75"
            height="70"
            viewBox="0 0 75 70"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g opacity="0.2" clipPath="url(#clip0_592_380)">
              <path
                d="M30.3597 38.3221C31.8929 40.2294 33.849 41.8075 36.0953 42.9495C38.3416 44.0915 40.8256 44.7706 43.3788 44.9407C45.932 45.1109 48.4946 44.7681 50.8929 43.9356C53.2911 43.1032 55.469 41.8005 57.2786 40.116L67.9891 30.1498C71.2407 27.017 73.04 22.8212 72.9993 18.466C72.9587 14.1108 71.0813 9.94476 67.7716 6.86506C64.462 3.78537 59.9848 2.03847 55.3044 2.00063C50.6239 1.96278 46.1148 3.63701 42.7481 6.66272L36.6075 12.3435M44.6403 31.6779C43.1071 29.7706 41.151 28.1925 38.9047 27.0505C36.6584 25.9085 34.1744 25.2294 31.6212 25.0593C29.068 24.8891 26.5054 25.2319 24.1071 26.0644C21.7089 26.8968 19.531 28.1995 17.7214 29.884L7.01092 39.8502C3.75926 42.983 1.96 47.1788 2.00067 51.534C2.04135 55.8892 3.91869 60.0552 7.22836 63.1349C10.538 66.2146 15.0152 67.9615 19.6956 67.9994C24.376 68.0372 28.8852 66.363 32.2519 63.3373L38.3568 57.6565"
                stroke="url(#paint0_linear_592_380)"
                strokeOpacity="0.8"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <defs>
              <linearGradient
                id="paint0_linear_592_380"
                x1="37.5"
                y1="2"
                x2="37.5"
                y2="68"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#DFEFFF" />
                <stop offset="1" stopColor="white" />
              </linearGradient>
              <clipPath id="clip0_592_380">
                <rect width="75" height="70" fill="white" />
              </clipPath>
            </defs>
          </svg>
        ) : (
          <svg
            width="75"
            height="70"
            viewBox="0 0 75 70"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g opacity="0.2" clipPath="url(#clip0_334_4866)">
              <path
                d="M30.3597 38.3221C31.8929 40.2294 33.849 41.8075 36.0953 42.9495C38.3416 44.0915 40.8256 44.7706 43.3788 44.9407C45.932 45.1109 48.4946 44.7681 50.8929 43.9356C53.2911 43.1032 55.469 41.8005 57.2786 40.116L67.9891 30.1498C71.2407 27.017 73.04 22.8212 72.9993 18.466C72.9587 14.1108 71.0813 9.94476 67.7716 6.86506C64.462 3.78537 59.9848 2.03847 55.3044 2.00063C50.6239 1.96278 46.1148 3.63701 42.7481 6.66272L36.6075 12.3435M44.6403 31.6779C43.1071 29.7706 41.151 28.1925 38.9047 27.0505C36.6584 25.9085 34.1744 25.2294 31.6212 25.0593C29.068 24.8891 26.5054 25.2319 24.1071 26.0644C21.7089 26.8968 19.531 28.1995 17.7214 29.884L7.01092 39.8502C3.75926 42.983 1.96 47.1788 2.00067 51.534C2.04135 55.8892 3.91869 60.0552 7.22836 63.1349C10.538 66.2146 15.0152 67.9615 19.6956 67.9994C24.376 68.0372 28.8852 66.363 32.2519 63.3373L38.3568 57.6565"
                stroke="url(#paint0_linear_334_4866)"
                strokeOpacity="0.8"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <defs>
              <linearGradient
                id="paint0_linear_334_4866"
                x1="37.5"
                y1="2"
                x2="37.5"
                y2="68"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#007FFF" />
                <stop offset="1" />
              </linearGradient>
              <clipPath id="clip0_334_4866">
                <rect width="75" height="70" fill="white" />
              </clipPath>
            </defs>
          </svg>
        )}
      </div>

      {/* [수정] 핸들러 props 전달 */}
      {activeModel === "Text" && (
        <TextWeekly
          data={filtered}
          onLikeToggle={onLikeToggle}
          onBookmarkToggle={onBookmarkToggle}
          subType={activeModel}
        />
      )}
      {activeModel === "Image" && (
        <ImgWeekly
          data={filtered}
          onLikeToggle={onLikeToggle}
          onBookmarkToggle={onBookmarkToggle}
          subType={activeModel}
        />
      )}
    </>
  );
}
