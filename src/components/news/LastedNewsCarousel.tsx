"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

type LastedNews = {
  id: string;
  title: string;
  images?: string[] | null;
};

type LastedNewsCarouselProps = {
  newsList: LastedNews[];
};

const MAX_VISIBILITY = 3;

export default function PopularNewsCarousel({
  newsList,
}: LastedNewsCarouselProps) {
  const [active, setActive] = useState(0);
  const count = newsList.length;

  useEffect(() => {
    if (count === 0) return;
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % count);
    }, 5000);
    return () => clearInterval(interval);
  }, [count]);

  if (count === 0) return null;

  return (
    // 1. 전체 컴포넌트 박스 (w-83, h-59.5)
    <div
      className="hidden lg:block fixed right-6 z-40
                  w-[20.75rem] h-[14.875rem]
                  bg-white rounded-2xl shadow-lg p-4
                  flex flex-col"
      aria-label="인기 뉴스 캐러셀"
    >
      <div className="mb-5 flex items-center gap-x-2">
        <Image
          src="/news-carousel-logo.svg"
          alt="인기 뉴스"
          width={24}
          height={24}
          priority
        />
        <span className="font-bold text-sm text-gray-700">
          최신 뉴스 - GPT & Gemini
        </span>
      </div>

      {/* 3. 캐러셀 영역 */}
      <div
        className="flex-1 relative flex items-center justify-center
                   perspective-500 overflow-hidden"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* [수정] 이전 버튼 */}
        {active > 0 && (
          <button
            onClick={() => setActive((i) => i - 1)}
            // [수정] 배경색, 그림자, 원형, 중앙 정렬 클래스 추가
            className="absolute left-6 top-1/2 -translate-y-1/2 z-30
                       w-10 h-10 rounded-full flex items-center justify-center
                       transition-all
                       bg-white/[.15] backdrop-blur-md 
                       border border-white/[.25]
                       shadow-lg hover:bg-white/[.25] hover:shadow-xl"
            aria-label="이전 뉴스"
          >
            <Image
              src="/news-silde-prev.svg"
              alt="이전"
              width={44}
              height={42}
              className="object-contain"
            />
          </button>
        )}

        {/* 4. 3D 캐러셀 무대 (w-37.5, h-36.5) */}
        <div className="relative w-[9.375rem] h-[9.125rem]">
          {/* 5. 카드들 */}
          {newsList.map((news, i) => {
            const offset = (active - i) / 3;
            const direction = Math.sign(active - i);
            const absOffset = Math.abs(active - i) / 3;
            const isActive = i === active;
            const isVisible = Math.abs(active - i) < MAX_VISIBILITY;

            return (
              <div
                key={news.id}
                className="absolute inset-0 w-full h-full transition-all duration-300 ease-out"
                style={{
                  transform: `
                    rotateY(${offset * 50}deg)
                    scaleY(${1 + absOffset * -0.3})
                    translateZ(${absOffset * -12}rem)
                    translateX(${direction * -2.5}rem)
                  `,
                  filter: `blur(${absOffset * 0.4}rem)`,
                  opacity: isVisible ? 1 : 0,
                  pointerEvents: isActive ? "auto" : "none",
                  zIndex: isActive ? 20 : 10 - Math.abs(active - i),
                  display: isVisible ? "block" : "none",
                }}
                role="tabpanel"
                aria-hidden={!isActive}
              >
                <Link href={`/news/${news.id}`}>
                  <div
                    className="w-full h-full rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow cursor-pointer border border-gray-100"
                    style={{
                      backgroundColor: `hsl(280, 40%, ${
                        100 - absOffset * 30
                      }%)`,
                      transition: "all 0.3s ease-out",
                    }}
                  >
                    {/* 썸네일 (h-full) */}
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 relative overflow-hidden">
                      {news.images?.[0] ? (
                        <img
                          src={news.images[0]}
                          alt={news.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg
                            className="w-16 h-16"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                            />
                          </svg>
                        </div>
                      )}

                      {/* 순위 배지 (v6에서 복원) */}
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                        #{i + 1}
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {/* [수정] 다음 버튼 */}
        {active < count - 1 && (
          <button
            onClick={() => setActive((i) => i + 1)}
            // [수정] 배경색, 그림자, 원형, 중앙 정렬 클래스 추가
            className="absolute right-6 top-1/2 -translate-y-1/2 z-30
                       w-10 h-10 rounded-full flex items-center justify-center
                       transition-all
                       bg-white/[.15] backdrop-blur-md 
                       border border-white/[.25]
                       shadow-lg hover:bg-white/[.25] hover:shadow-xl"
            aria-label="다음 뉴스"
          >
            <Image
              src="/news-silde-next.svg"
              alt="다음"
              width={44}
              height={42}
              className="object-contain"
            />
          </button>
        )}
      </div>
    </div>
  );
}
