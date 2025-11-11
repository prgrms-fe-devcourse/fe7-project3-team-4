"use client";

import { memo, useMemo } from "react";
import NextImage from "next/image";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import { Json } from "@/utils/supabase/supabase";

function renderTipTapNode(node: any): string {
  if (!node) return "";
  switch (node.type) {
    case "doc":
      return node.content?.map(renderTipTapNode).join("") || "";
    case "paragraph":
      const pContent = node.content?.map(renderTipTapNode).join("") || "";
      return pContent ? `<p>${pContent}</p>` : "";
    case "text":
      let text = node.text || "";
      if (node.marks) {
        node.marks.forEach((mark: any) => {
          switch (mark.type) {
            case "bold": text = `<strong>${text}</strong>`; break;
            case "italic": text = `<em>${text}</em>`; break;
            case "code": text = `<code class="bg-gray-100 px-1 rounded">${text}</code>`; break;
            case "link": text = `<a href="${mark.attrs.href}" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">${text}</a>`; break;
          }
        });
      }
      return text;
    case "heading":
      const level = node.attrs?.level || 1;
      const hContent = node.content?.map(renderTipTapNode).join("") || "";
      return `<h${level} class="font-bold">${hContent}</h${level}>`;
    case "bulletList":
      return `<ul class="list-disc pl-5">${node.content?.map(renderTipTapNode).join("") || ""}</ul>`;
    case "orderedList":
      return `<ol class="list-decimal pl-5">${node.content?.map(renderTipTapNode).join("") || ""}</ol>`;
    case "listItem":
      return `<li>${node.content?.map(renderTipTapNode).join("") || ""}</li>`;
    case "blockquote":
      return `<blockquote class="border-l-4 border-gray-300 pl-4 italic">${node.content?.map(renderTipTapNode).join("") || ""}</blockquote>`;
    case "hardBreak":
      return "<br>";
    default:
      return node.content?.map(renderTipTapNode).join("") || "";
  }
}

function extractImages(content: any): string[] {
  if (!content || typeof content !== "object") return [];
  const images: string[] = [];
  const traverse = (node: any) => {
    if (node.type === "image" && node.attrs?.src) images.push(node.attrs.src);
    if (node.content) node.content.forEach(traverse);
  };
  if (content.type === "doc" && content.content) content.content.forEach(traverse);
  return images;
}

function removeImages(node: any): any {
  if (!node) return null;
  if (node.type === "image") return null;
  if (node.content) {
    const filtered = node.content.map(removeImages).filter((n: any) => n !== null);
    return filtered.length > 0 ? { ...node, content: filtered } : null;
  }
  return node;
}

// 텍스트 미리보기 컴포넌트
const TextPreview = memo(({ content }: { content: Json | null }) => {
  const htmlContent = useMemo(() => {
    if (!content) return "";
    const withoutImages = removeImages(content);
    return renderTipTapNode(withoutImages);
  }, [content]);

  if (!htmlContent) return null;

  return (
    <div 
      className="line-clamp-3 text-gray-700 text-sm"
      dangerouslySetInnerHTML={{ __html: htmlContent }} 
    />
  );
});

TextPreview.displayName = "TextPreview";

// 이미지 미리보기 컴포넌트
const ImagePreview = memo(({ 
  content, 
  postUrl, 
  title 
}: { 
  content: Json | null;
  postUrl: string;
  title: string;
}) => {
  const images = useMemo(() => extractImages(content), [content]);
  
  if (images.length === 0) return null;

  return (
    <Link
      href={postUrl}
      scroll={false}
      aria-label={title}
      className="block relative w-full aspect-video rounded-lg overflow-hidden bg-gray-200 mt-4 hover:opacity-95 transition-opacity"
    >
      <NextImage
        src={images[0]}
        alt={title}
        fill
        className="object-cover"
        loading="lazy"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </Link>
  );
});

ImagePreview.displayName = "ImagePreview";

export { TextPreview, ImagePreview };