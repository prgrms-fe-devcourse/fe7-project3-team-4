"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image"; // Image 임포트 확인

type LatestNews = {
  id: string;
  title: string;
  images?: string[] | null;
};

type LatestNewsCarouselProps = {
  newsList: LatestNews[];
};

const MAX_VISIBILITY = 3;

export default function LatestNewsCarousel({
  newsList,
}: LatestNewsCarouselProps) {
  const [active, setActive] = useState(0);
  const count = newsList.length;

  // [수정] useEffect의 의존성 배열에 'active'를 추가합니다.
  useEffect(() => {
    // 슬라이드가 1개 이하면 타이머를 설정하지 않습니다.
    if (count <= 1) return;

    // 5초 타이머 설정
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % count);
    }, 5000);

    // cleanup 함수:
    // 1. 컴포넌트가 언마운트될 때
    // 2. 'active' 또는 'count' 상태가 변경되어 effect가 다시 실행되기 직전에
    //    이전 타이머를 제거합니다.
    return () => clearInterval(interval);
  }, [active, count]); // 'active'가 변경될 때마다 타이머를 리셋합니다.

  if (count === 0) return null;

  return (
    <div
      className="flex-1 relative flex items-center justify-center
                 perspective-500 overflow-hidden"
      style={{ transformStyle: "preserve-3d" }}
      aria-label="인기 뉴스 캐러셀"
    >
      {/* 이전 버튼 */}
      {count > 1 && (
        <button
          // 버튼 클릭 시 setActive가 호출되고,
          // 'active' 상태가 변경되면 위의 useEffect가 리셋됩니다.
          onClick={() => setActive((i) => (i - 1 + count) % count)}
          className="cursor-pointer absolute left-5 top-1/2 -translate-y-1/2 z-30
                       w-10 h-10 rounded-full flex items-center justify-center
                       transition-all
                       bg-white/15 backdrop-blur-md 
                       border border-white/25
                       shadow-lg hover:bg-white/25 hover:shadow-xl"
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

      {/* 3D 캐러셀 무대 */}
      <div className="relative w-37.5 h-36.5">
        {/* 카드들 */}
        {newsList.map((news, i) => {
          let rawDiff = active - i;

          if (count > MAX_VISIBILITY) {
            if (rawDiff > count / 2) {
              rawDiff -= count;
            } else if (rawDiff < -count / 2) {
              rawDiff += count;
            }
          }

          const offset = rawDiff / 3;
          const direction = Math.sign(rawDiff);
          const absOffset = Math.abs(offset);
          const isActive = i === active;
          const isVisible = Math.abs(rawDiff) < MAX_VISIBILITY;

          return (
            <div
              key={news.id}
              className="absolute inset-0 w-full h-full transition-all duration-300 ease-out rounded-xl overflow-hidden"
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
                zIndex: isActive ? 20 : 10 - Math.abs(rawDiff),
                display: isVisible ? "block" : "none",
              }}
              role="tabpanel"
              aria-hidden={!isActive}
            >
              <Link href={`/news/${news.id}`}>
                <div
                  className="group w-full h-full rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow cursor-pointer"
                  style={{
                    backgroundColor: `hsl(280, 40%, ${100 - absOffset * 30}%)`,
                    transition: "all 0.3s ease-out",
                  }}
                >
                  {/* 썸네일 */}
                  <div className="w-full h-full bg-linear-to-br from-blue-100 to-purple-100 relative overflow-hidden">
                    {news.images?.[0] ? (
                      // ============= [수정됨] =============
                      <Image
                        src={news.images[0]}
                        alt={news.title}
                        fill // 1. fill 속성 사용
                        className="object-cover" // 2. w-full, h-full 제거
                        loading="lazy"
                        // 3. (권장) fill 사용 시 sizes 추가
                        sizes="10vw" 
                      />
                      // ====================================
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

                    {/* 순위 배지 */}
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                      #{i + 1}
                    </div>

                    {/* 마우스 호버 시 뉴스 타이틀 표시 */}
                    {/* <div
                      className="absolute bottom-0 left-0 right-0 p-3 bg-linear-to-t from-black/80 to-transparent
                                 opacity-0 group-hover:opacity-100
                                 translate-y-2 group-hover:translate-y-0
                                 transition-all duration-300 ease-in-out"
                    >
                      <p className="text-white text-xs font-semibold line-clamp-2">
                        {news.title}
                      </p>
                    </div> */}  
                  {/* 뉴스 타이틀 표시 */}
                  <div
                    className="absolute bottom-0 left-0 right-0 p-3 bg-linear-to-t from-black/80 to-transparent
                               transition-all duration-300 ease-in-out"
                  >
                    <p className="text-white text-xs font-semibold line-clamp-2">
                      {news.title}
                    </p>
                  </div>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* 다음 버튼 */}
      {count > 1 && (
        <button
          // 버튼 클릭 시 setActive가 호출되고,
          // 'active' 상태가 변경되면 위의 useEffect가 리셋됩니다.
          onClick={() => setActive((i) => (i + 1) % count)}
          className="cursor-pointer absolute right-5 top-1/2 -translate-y-1/2 z-30
                       w-10 h-10 rounded-full flex items-center justify-center
                       transition-all
                       bg-white/15 backdrop-blur-md 
                       border border-white/25
                       shadow-lg hover:bg-white/25 hover:shadow-xl"
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
  );
}
