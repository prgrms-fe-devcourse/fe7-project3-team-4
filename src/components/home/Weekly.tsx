"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ModelToggle from "./post/ModelToggle";
import TextWeekly from "./weekly/TextWeekly";
import ImgWeekly from "./weekly/ImgWeekly";
import WeeklyNotice from "./weekly/WeeklyNotice";
import { PostType, WeeklyModel } from "@/types/Post";

// [수정] Props 타입 정의 및 핸들러 추가
type WeeklyProps = {
  data: PostType[];
  onLikeToggle?: (id: string) => void;
  onBookmarkToggle?: (id: string, type: "post" | "news") => void;
  activeSubType: string | null;
};

export default function Weekly({
  data,
  onLikeToggle,
  onBookmarkToggle,
  activeSubType,
}: WeeklyProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeModel, setActiveModel] = useState<WeeklyModel>(() => {
    if (activeSubType === "이미지") return "이미지";
    return "텍스트";
  });

  const handleModelChange = (model: WeeklyModel) => {
    setActiveModel(model);
    const params = new URLSearchParams(searchParams.toString());
    params.set("sub_type", model);
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  const filtered = useMemo(
    () =>
      data.filter(
        (post) => post.result_mode?.toLowerCase() === activeModel.toLowerCase()
      ),
    [data, activeModel]
  );

  return (
    <>
      <ModelToggle
        mode="weekly"
        active={activeModel}
        onChange={handleModelChange}
      />
      {/* 주간 챌린지 공지? */}
      <WeeklyNotice active={activeModel} />

      <div className="flex justify-center">
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