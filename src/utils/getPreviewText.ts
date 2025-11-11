import { Json } from "./supabase/supabase";

/**
 * 'Json | null' 타입에서 미리보기용 텍스트를 안전하게 추출합니다.
 */
export function getPreviewText(content: Json | null): string {
  if (content === null || typeof content === "undefined") {
    return "";
  }
  
  // 1순위: 내용이 문자열이면 그대로 반환
  if (typeof content === "string") {
    return content;
  }

  if (typeof content === "number" || typeof content === "boolean") {
    return String(content);
  }
  
  // 2순위: 내용이 객체인 경우
  if (typeof content === "object" && !Array.isArray(content)) {
     // 'prompt' 또는 'content' 키가 있는지 확인 (이전 데이터 형식일 수 있음)
     if (typeof (content as any).prompt === 'string') {
        return (content as any).prompt;
     }
     if (typeof (content as any).content === 'string') {
        return (content as any).content;
     }
     // 그 외 객체는 플레이스홀더 반환
     return "[JSON 콘텐츠]";
  }
  
  // 배열이나 기타 타입
  return "[미리보기를 지원하지 않는 형식]";
}