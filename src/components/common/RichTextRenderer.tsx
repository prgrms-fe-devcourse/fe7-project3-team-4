/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

// [수정] 'type Content'를 @tiptap/react 임포트에 추가합니다.
import { useEditor, EditorContent, type Content } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Json } from "@/utils/supabase/supabase";
import { useEffect, useMemo, memo } from "react";
import NextImage from "next/image";
// import Link from "next/link";
import { useInView } from "react-intersection-observer";

// ===============================
// Json → Tiptap Content 변환 함수
// ===============================
function toTiptapContent(value: Json | null): Content | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object") return value as Content;
  return undefined;
}

// 에디터 extensions
const editorExtensions = [
  StarterKit.configure({
    dropcursor: false,
    gapcursor: false,
    codeBlock: false,
  }),
  Image.configure({
    inline: true,
    allowBase64: true,
    HTMLAttributes: {
      class: "rounded-lg max-w-full h-auto",
    },
  }),
];

// 이미지 URL 추출
function extractImages(content: any): string[] {
  if (!content || typeof content !== "object") return [];

  const images: string[] = [];

  const traverse = (node: any) => {
    if (node.type === "image" && node.attrs?.src) {
      images.push(node.attrs.src);
    }
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  };

  if (content.type === "doc" && content.content) {
    content.content.forEach(traverse);
  }

  return images;
}

// 이미지 노드 제거
function filterOutImages(content: any): any {
  if (!content || typeof content !== "object") return content;

  const filterNode = (node: any): any => {
    if (node.type === "image") return null;

    if (node.content && Array.isArray(node.content)) {
      const filteredContent = node.content
        .map(filterNode)
        .filter((n: any) => n !== null);

      return {
        ...node,
        content: filteredContent.length > 0 ? filteredContent : undefined,
      };
    }

    return node;
  };

  if (content.type === "doc" && content.content) {
    const filteredContent = content.content
      .map(filterNode)
      .filter((n: any) => n !== null);

    return {
      type: "doc",
      content: filteredContent,
    };
  }

  return content;
}

// ==================================================
// 이미지만 프리뷰하는 컴포넌트
// ==================================================
const ImageOnlyView = memo(
  ({
    content,
    // postId,
    // postType,
    title,
  }: {
    content: Json | null;
    postId?: string;
    postType?: string;
    title?: string;
  }) => {
    const images = useMemo(() => extractImages(content), [content]);
    if (images.length === 0) return null;

    return (
      <div className="block relative w-full aspect-video rounded-lg overflow-hidden bg-gray-200 mt-4">
        <NextImage
          src={images[0]}
          alt={title || ""}
          fill
          className="object-cover"
          loading="lazy"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
    );
  }
);

ImageOnlyView.displayName = "ImageOnlyView";

// ==================================================
// TipTap 본문 렌더링 컴포넌트
// ==================================================
const RichTextEditor = memo(
  ({ filteredContent }: { filteredContent: Json | null }) => {
    // Json → Content 변환
    const tiptapContent = useMemo(
      () => toTiptapContent(filteredContent),
      [filteredContent]
    );

    const editor = useEditor(
      {
        editable: false,
        immediatelyRender: false,
        // 👇 [수정 1/2] 'filteredContent'를 'Content' 타입으로 단언합니다. (오류 발생 지점)
        content: filteredContent as Content,
        extensions: editorExtensions,
        editorProps: {
          attributes: {
            class: "prose prose-lg max-w-none",
          },
        },
      },
      []
    );

    useEffect(() => {
      if (editor && filteredContent) {
        // 👇 [수정 2/2] 'setContent' 호출 시에도 동일하게 타입 단언을 추가합니다.
        editor.commands.setContent(filteredContent as Content, { emitUpdate: false });
      }
    }, [editor, tiptapContent]);

    if (!editor) return null;
    return <EditorContent editor={editor} />;
  }
);

RichTextEditor.displayName = "RichTextEditor";

// ==================================================
// Lazy renderer (이미지 필터링 포함)
// ==================================================
const LazyRichTextRendererInternal = memo(
  ({
    content,
    imageOnly = false,
    showImage = true,
    title,
  }: {
    content: Json | null;
    imageOnly?: boolean;
    showImage?: boolean;
    title?: string;
  }) => {
    // 👇 [수정] 'Rules of Hooks' 오류를 해결하기 위해 useMemo를 최상단으로 이동
    // 필터링된 콘텐츠를 메모이제이션
    const filteredContent = useMemo(
      () => (showImage ? content : filterOutImages(content)),
      [content, showImage]
    );

    // 이미지만 표시하는 경우
    if (imageOnly) {
      return <ImageOnlyView content={content} title={title} />;
    }

    return <RichTextEditor filteredContent={filteredContent} />;
  }
);

LazyRichTextRendererInternal.displayName =
  "LazyRichTextRendererInternal";

// ==================================================
// 최종 렌더러
// ==================================================
export default function RichTextRenderer({
  content,
  imageOnly = false,
  showImage = true,
  title,
  lazy = true,
  rootMargin = "200px",
}: {
  content: Json | null;
  imageOnly?: boolean;
  showImage?: boolean;
  title?: string;
  lazy?: boolean;
  rootMargin?: string;
}) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: rootMargin,
    skip: !lazy,
  });

  if (!lazy) {
    return (
      <LazyRichTextRendererInternal
        content={content}
        imageOnly={imageOnly}
        showImage={showImage}
        title={title}
      />
    );
  }

  return (
    <div ref={ref}>
      {inView ? (
        <LazyRichTextRendererInternal
          content={content}
          imageOnly={imageOnly}
          showImage={showImage}
          title={title}
        />
      ) : (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      )}
    </div>
  );
}