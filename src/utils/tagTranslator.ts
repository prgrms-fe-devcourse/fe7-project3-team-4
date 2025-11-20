// [✅ 새 파일] src/utils/tagTranslator.ts

// 1. 태그 매핑 객체
const tagMap: Record<string, string> = {
  marketing: "마케팅",
  develop: "개발",
  content: "콘텐츠",
  writing: "글쓰기",
  business: "비즈니스",
  script: "스크립트",
  sns: "sns",
  education: "교육",
  art: "예술",
  play: "놀이",
  research: "연구", 
  summary: "요약",
};

// 2. 태그 번역 함수 (export)
export const getTranslatedTag = (tag: string): string => {
  const cleanTag = tag.startsWith("#") ? tag.substring(1) : tag;
  const lowerTag = cleanTag.toLowerCase();
  return tagMap[lowerTag] || cleanTag; // 매핑된 값 또는 원래 값
};