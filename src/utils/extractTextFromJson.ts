/**
 * Tiptap/ProseMirror JSON 객체를 순회하며 텍스트와 이미지 정보를 추출합니다.
 * @param content Tiptap/ProseMirror의 content (Json | null)
 * @returns 추출된 텍스트 (이미지는 [Image] 플레이스홀더로 표시)
 */
export function extractTextFromJson(content: JSON | null): string {
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
      text += extractTextFromJson(childNode as JSON);
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
export function extractImagesFromJson(content: JSON | null): string[] {
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
      images.push(...extractImagesFromJson(childNode as JSON));
    }
  }

  return images;
}

/* PromptDetail에 사용하려고... */
type PMMark = { type?: string; attrs?: any };
type PMNode = {
  type?: string;
  content?: any[];
  text?: string;
  marks?: PMMark[];
};

export function pickNthParagraphDoc(doc: any, n = 0) {
  if (!doc || typeof doc !== "object" || !Array.isArray(doc.content)) {
    return { type: "doc", content: [] };
  }

  // 최상위에서 paragraph만 수집 (필요 시 재귀로 바꿀 수 있음)
  const paras = doc.content.filter(
    (node: PMNode) => node?.type === "paragraph" && Array.isArray(node.content)
  );

  // 음수/범위초과 방어
  const idx = Math.max(0, Math.min(n, paras.length - 1));
  const target = paras[idx];

  return target
    ? { type: "doc", content: [target] }
    : { type: "doc", content: [] };
}

// 문자열만 필요할 때
export function getNthParagraphText(doc: any, n = 0): string {
  const onlyDoc = pickNthParagraphDoc(doc, n);
  const para = onlyDoc.content?.[0];
  if (!para?.content) return "";

  const pieces: string[] = [];
  const walk = (node: PMNode) => {
    if (!node) return;
    if (node.type === "text" && typeof node.text === "string")
      pieces.push(node.text);
    if (node.type === "hardBreak") pieces.push("\n");
    if (Array.isArray(node.content)) node.content.forEach(walk);
  };
  para.content.forEach(walk);
  return pieces.join("").trim();
}

/* 이미지 경로 뽑기 */
export function extractImageSrcArr(doc: any): string[] {
  const out: string[] = [];

  const walk = (node: PMNode) => {
    if (!node || typeof node !== "object") return;

    if (node.type === "image") {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : ""; // 문자열 아니면 빈 문자열로 치환
      out.push(src);
    }

    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        walk(child as PMNode);
      }
    }
  };

  walk(doc as PMNode);
  return out;
}

export function extractFirstLinkHref(doc: any): string {
  let found: string = "";

  const walk = (node: PMNode) => {
    if (found || !node || typeof node !== "object") return;

    // text 노드의 marks에서 link 탐색
    if (
      node.type === "text" &&
      typeof node.text === "string" &&
      Array.isArray(node.marks)
    ) {
      const link = node.marks.find(
        (m) => m?.type === "link" && typeof m.attrs?.href === "string"
      );
      if (link) {
        found = link.attrs.href as string;
        return;
      }
    }

    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        walk(child as PMNode);
        if (found) break;
      }
    }
  };

  walk(doc as PMNode);
  return found;
}
