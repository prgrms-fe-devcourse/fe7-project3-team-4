/* eslint-disable @typescript-eslint/no-explicit-any */
function extractPlainTextFromNode(node: any): string {
  if (!node) return "";
  if (node.type === "text") return node.text ?? "";
  if (Array.isArray(node.content)) {
    return node.content.map(extractPlainTextFromNode).join("");
  }
  return "";
}

export type ParsedPostContent = {
  promptInput: string | null;
  resultText: string | null; // resultMode === "Text" 일 때
  resultImageUrl: string | null; // resultMode === "Image" 일 때
  resultLink: string | null;
};

export function parsePostContent(doc: any): ParsedPostContent {
  if (!doc || !Array.isArray(doc.content)) {
    return {
      promptInput: null,
      resultText: null,
      resultImageUrl: null,
      resultLink: null,
    };
  }

  const content = doc.content as any[];

  let promptInput: string | null = null;
  let resultText: string | null = null;
  let resultImageUrl: string | null = null;
  let resultLink: string | null = null;

  for (let i = 0; i < content.length; i++) {
    const node = content[i];

    const isParagraph =
      node.type === "paragraph" && Array.isArray(node.content);
    const firstText = isParagraph ? node.content[0]?.text : undefined;

    // 1) PromptInput 라벨 → 다음 노드가 실제 프롬프트 텍스트
    if (isParagraph && firstText === "PromptInput") {
      const valueNode = content[i + 1];
      promptInput = extractPlainTextFromNode(valueNode);
      i += 1; // 값까지 건너뛰기
      continue;
    }

    // 2) PromptResult 라벨 (Text 결과)
    if (isParagraph && firstText === "PromptResult") {
      const valueNode = content[i + 1];
      resultText = extractPlainTextFromNode(valueNode);
      i += 1;
      continue;
    }

    // 3) Result 라벨 (Image 결과)
    if (isParagraph && firstText === "Result") {
      const valueNode = content[i + 1];

      if (valueNode?.type === "image" && valueNode.attrs?.src) {
        resultImageUrl = valueNode.attrs.src;
      } else if (valueNode) {
        // 혹시라도 텍스트가 들어오는 경우에도 대비 (보너스 처리)
        const maybeText = extractPlainTextFromNode(valueNode);
        if (maybeText) {
          resultText = maybeText;
        }
      }

      i += 1;
      continue;
    }

    // 4) 링크 문단 (Result 링크)
    if (
      isParagraph &&
      node.content[0]?.marks?.some((m: any) => m.type === "link")
    ) {
      resultLink = node.content[0].text ?? null;
      continue;
    }
  }

  return {
    promptInput,
    resultText,
    resultImageUrl,
    resultLink,
  };
}
