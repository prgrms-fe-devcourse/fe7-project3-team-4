import { Json } from "./supabase/supabase";

/**
 * Tiptap/ProseMirror JSON 객체를 순회하며 텍스트와 이미지 정보를 추출합니다.
 * @param content Tiptap/ProseMirror의 content (Json | null)
 * @returns 추출된 텍스트 (이미지는 [Image] 플레이스홀더로 표시)
 */
export function extractTextFromJson(content: Json | null): string {
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    // content가 null이거나, 객체가 아니거나, 배열인 경우 (최상위 노드가 아님)
    if (typeof content === "string") return content; // 혹시 모를 일반 string 대비
    return "";
  }

  let text = "";
  const node = content as { [key: string]: any };

  // 1. 'text' 노드인 경우
  if (node.type === "text" && node.text) {
    text += node.text;
  }

  // 2. 'image' 노드인 경우
  if (node.type === "image") {
    // 이미지 URL이 있으면 표시, 없으면 기본 플레이스홀더
    const altText = node.attrs?.alt || "Image";
    text += `[${altText}] `;
  }

  // 3. 'content' 배열을 가진 노드인 경우 (예: doc, paragraph, heading)
  if (node.content && Array.isArray(node.content)) {
    for (const childNode of node.content) {
      text += extractTextFromJson(childNode as Json);
    }
    
    // Tiptap의 paragraph 사이에 공백 추가 (줄바꿈 대신)
    if (node.type === "paragraph" && text.length > 0) {
      text += " ";
    }
  }

  return text.trim();
}

/**
 * Tiptap/ProseMirror JSON 객체에서 이미지 URL 목록을 추출합니다.
 * @param content Tiptap/ProseMirror의 content (Json | null)
 * @returns 이미지 URL 배열
 */
export function extractImagesFromJson(content: Json | null): string[] {
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return [];
  }

  const images: string[] = [];
  const node = content as { [key: string]: any };

  // 1. 'image' 노드인 경우
  if (node.type === "image" && node.attrs?.src) {
    images.push(node.attrs.src);
  }

  // 2. 'content' 배열을 가진 노드인 경우 재귀 탐색
  if (node.content && Array.isArray(node.content)) {
    for (const childNode of node.content) {
      images.push(...extractImagesFromJson(childNode as Json));
    }
  }

  return images;
}