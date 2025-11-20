// src/lib/utils.ts
// [기능]: 프로젝트 전역에서 사용되는 유틸리티 함수

/**
 * ISO 형식의 날짜 문자열을 "N분 전", "N시간 전" 등 상대 시간으로 변환합니다.
 * @param isoDate ISO 8601 형식의 날짜 문자열
 * @returns 변환된 상대 시간 문자열 (예: "3시간 전")
 */
export const formatTimeAgo = (isoDate: string | null): string => {
  if (!isoDate) return "";

  try {
    const date = new Date(isoDate);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // 0초 미만은 "방금 전"
    if (seconds < 1) return "방금 전";

    let interval = seconds / 31536000; // 1년 (초)
    if (interval > 1) return `${Math.floor(interval)}년 전`;
    
    interval = seconds / 2592000; // 1달 (초)
    if (interval > 1) return `${Math.floor(interval)}달 전`;
    
    interval = seconds / 86400; // 1일 (초)
    if (interval > 1) return `${Math.floor(interval)}일 전`;
    
    interval = seconds / 3600; // 1시간 (초)
    if (interval > 1) return `${Math.floor(interval)}시간 전`;
    
    interval = seconds / 60; // 1분 (초)
    if (interval > 1) return `${Math.floor(interval)}분 전`;
    
    return "방금 전"; // 1분 미만
  } catch {
    // 날짜 파싱 실패 시 원본 문자열 반환 (안전 장치)
    return String(isoDate);
  }
};