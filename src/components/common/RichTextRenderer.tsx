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

// 에디터 extensions를 컴포넌트 외부로 이동 (재생성 방지)
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
  if (!content || typeof content !== "object") {
    return content;
  }

  const filterNode = (node: any): any => {
    if (node.type === "image") {
      return null;
    }

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

// 이미지만 표시하는 컴포넌트
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

    if (images.length === 0) {
      return null;
    }

    return (
      <div
        aria-label={title}
        className="block relative w-full aspect-video rounded-lg overflow-hidden bg-gray-200 mt-4"
      >
        <NextImage
          src={images[0]}
          alt={title || ""}
          fill
          className="object-cover"
          loading="lazy"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={false}
        />
      </div>
    );
  }
);

ImageOnlyView.displayName = "ImageOnlyView";

// 메인 에디터 컴포넌트
const RichTextEditor = memo(
  ({ filteredContent }: { filteredContent: Json | null }) => {
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
    }, [editor, filteredContent]);

    if (!editor) {
      return null;
    }

    return <EditorContent editor={editor} />;
  }
);

RichTextEditor.displayName = "RichTextEditor";

// 가상 스크롤링이 적용된 렌더러 (내부 구현)
const LazyRichTextRendererInternal = memo(
  ({
    content,
    imageOnly = false,
    showImage = true,
    postId,
    postType,
    title,
  }: {
    content: Json | null;
    imageOnly?: boolean;
    showImage?: boolean;
    postId?: string;
    postType?: string;
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
      return (
        <ImageOnlyView
          content={content}
          postId={postId}
          postType={postType}
          title={title}
        />
      );
    }

    return <RichTextEditor filteredContent={filteredContent} />;
  }
);

LazyRichTextRendererInternal.displayName = "LazyRichTextRendererInternal";

// 메인 컴포넌트 (가상 스크롤링 적용)
export default function RichTextRenderer({
  content,
  imageOnly = false,
  showImage = true,
  postId,
  postType,
  title,
  lazy = true, // 가상 스크롤링 활성화 옵션
  rootMargin = "200px", // 뷰포트로부터 얼마나 미리 로드할지
}: {
  content: Json | null;
  imageOnly?: boolean;
  showImage?: boolean;
  postId?: string;
  postType?: string;
  title?: string;
  lazy?: boolean;
  rootMargin?: string;
}) {
  const { ref, inView } = useInView({
    triggerOnce: true, // 한 번만 트리거 (스크롤 업 시 언마운트 방지)
    rootMargin: rootMargin, // 뷰포트 기준 미리 로드 거리
    skip: !lazy, // lazy가 false면 intersection observer 스킵
  });

  // lazy 모드가 아니면 바로 렌더링
  if (!lazy) {
    return (
      <LazyRichTextRendererInternal
        content={content}
        imageOnly={imageOnly}
        showImage={showImage}
        postId={postId}
        postType={postType}
        title={title}
      />
    );
  }

  // lazy 모드: placeholder 먼저 표시, 뷰포트 진입 시 실제 콘텐츠 로드
  return (
    <div ref={ref}>
      {inView ? (
        <LazyRichTextRendererInternal
          content={content}
          imageOnly={imageOnly}
          showImage={showImage}
          postId={postId}
          postType={postType}
          title={title}
        />
      ) : (
        // 로딩 플레이스홀더 (옵션)
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      )}
    </div>
  );
}