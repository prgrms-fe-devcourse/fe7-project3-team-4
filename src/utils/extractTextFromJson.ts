/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tiptap/ProseMirror JSON 객체를 순회하며 텍스트와 이미지 정보를 추출합니다.
 * @param content Tiptap/ProseMirror의 content (Json | null)
 * @returns 추출된 텍스트 (이미지는 [Image] 플레이스홀더로 표시)
 */
export function extractTextFromJson(content: JSON | null): string {
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    if (typeof content === "string") return content;
    return "";
  }

  let text = "";
  const node = content as { [key: string]: any };

  // 1. 'text' 노드
  if (node.type === "text" && node.text) {
    text += node.text;
  }

  // 2. 'image' 노드
  if (node.type === "image") {
    const altText = (node as { attrs?: { alt?: string } }).attrs?.alt ?? "Image";
    text += `[${altText}] `;
  }

  // 3. 'content' 배열 재귀
  if (node.content && Array.isArray(node.content)) {
    for (const childNode of node.content) {
      text += extractTextFromJson(childNode as JSON);
    }

    if (node.type === "paragraph" && text.length > 0) {
      text += " ";
    }
  }

  return text.trim();
}

/**
 * 이미지 URL만 추출
 */
export function extractImagesFromJson(content: JSON | null): string[] {
  if (!content || typeof content !== "object" || Array.isArray(content)) return [];

  const images: string[] = [];
  const node = content as { [key: string]: any };

  if (node.type === "image") {
    const src = (node as { attrs?: { src?: string } }).attrs?.src;
    if (typeof src === "string") images.push(src);
  }

  if (node.content && Array.isArray(node.content)) {
    for (const childNode of node.content) {
      images.push(...extractImagesFromJson(childNode as JSON));
    }
  }

  return images;
}

/* PMNode 타입 정의 */
type PMMark = { type?: string; attrs?: any };
type PMNode = {
  attrs: any;
  type?: string;
  content?: PMNode[];
  text?: string;
  marks?: PMMark[];
  attrs?: { [key: string]: any };
};

/**
 * n번째 paragraph만 추출 (doc 반환)
 */
export function pickNthParagraphDoc(doc: any, n = 0) {
  if (!doc || typeof doc !== "object" || !Array.isArray(doc.content)) {
    return { type: "doc", content: [] };
  }

  const paras = doc.content.filter(
    (node: PMNode) => node?.type === "paragraph" && Array.isArray(node.content)
  );

  const idx = Math.max(0, Math.min(n, paras.length - 1));
  const target = paras[idx];

  return target ? { type: "doc", content: [target] } : { type: "doc", content: [] };
}

/**
 * n번째 paragraph 텍스트만 추출
 */
export function getNthParagraphText(doc: any, n = 0): string {
  const onlyDoc = pickNthParagraphDoc(doc, n);
  const para = onlyDoc.content?.[0];
  if (!para?.content) return "";

  const pieces: string[] = [];
  const walk = (node: PMNode) => {
    if (!node) return;
    if (node.type === "text" && typeof node.text === "string") pieces.push(node.text);
    if (node.type === "hardBreak") pieces.push("\n");
    if (Array.isArray(node.content)) node.content.forEach(walk);
  };
  para.content.forEach(walk);
  return pieces.join("").trim();
}

/**
 * 이미지 src 배열 추출
 */
export function extractImageSrcArr(doc: any): string[] {
  const out: string[] = [];

  const walk = (node: PMNode) => {
    if (!node || typeof node !== "object") return;

    if (node.type === "image") {
      const src = (node as PMNode & { attrs?: { src?: string } }).attrs?.src ?? "";
      if (src) out.push(src);
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

/**
 * 첫 번째 link href 추출
 */
export function extractFirstLinkHref(doc: any): string {
  let found = "";

  const walk = (node: PMNode) => {
    if (found || !node || typeof node !== "object") return;

    if (
      node.type === "text" &&
      typeof node.text === "string" &&
      Array.isArray(node.marks)
    ) {
      const link = node.marks.find(
        (m) => m?.type === "link" && typeof m.attrs?.href === "string"
      );
      if (link) {
        found = link.attrs.href;
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
