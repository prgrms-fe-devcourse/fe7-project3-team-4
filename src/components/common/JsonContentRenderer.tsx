"use client";

import { Json } from "@/utils/supabase/supabase";

/**
 * Safely renders content stored in a Supabase 'Json | null' column.
 * Handles null, strings, and JSON objects.
 */
export default function JsonContentRenderer({ content }: { content: Json | null }) {
  
  // Case 1: Content is null or undefined
  if (content === null || typeof content === "undefined") {
    return null; // Render nothing
  }

  // Case 2: Content is a string (most likely from the <textarea>)
  if (typeof content === "string") {
    // <pre> 태그를 사용해 <textarea>의 줄바꿈과 공백을 보존합니다.
    return (
      <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed">
        {content}
      </pre>
    );
  }

  // Case 3: Content is a number or boolean
  if (typeof content === "number" || typeof content === "boolean") {
    return (
      <pre className="whitespace-pre-wrap font-sans text-base">
        {String(content)}
      </pre>
    );
  }

  // Case 4: Content is an object or array (e.g., old data format)
  if (typeof content === "object") {
    try {
      // JSON을 보기 좋게 변환하여 <pre> 태그로 렌더링합니다.
      const jsonString = JSON.stringify(content, null, 2);
      return (
        <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
          <code>{jsonString}</code>
        </pre>
      );
    } catch (e) {
      // Fallback
      return (
        <pre className="whitespace-pre-wrap font-sans text-base">
          [표시할 수 없는 JSON 콘텐츠]
        </pre>
      );
    }
  }

  // Fallback for any other unexpected type
  return (
    <pre className="whitespace-pre-wrap font-sans text-base">
      {String(content)}
    </pre>
  );
}