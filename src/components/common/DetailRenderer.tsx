"use client";

import { useEditor, EditorContent, type Content } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { useEffect, useMemo } from "react";
import { Json } from "@/utils/supabase/supabase";

const editorExtensions = [
  StarterKit.configure({
    dropcursor: false,
    gapcursor: false,
    codeBlock: false,
  }),
  Image.configure({
    inline: true,
    allowBase64: true,
    HTMLAttributes: { class: "rounded-lg max-w-full h-auto" },
  }),
];

// Json → Content 타입으로 변환
function toTiptapContent(value: Json | null): Content | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object") return value as Content;
  return undefined;
}

export function DetailRenderer({ content }: { content: Json | null }) {
  const editor = useEditor({
    editable: false,
    immediatelyRender: false,
    content: content as Content,
    extensions: editorExtensions,
    editorProps: {
      attributes: { class: "prose prose-lg max-w-none" },
    },
    [],
  );

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content as Content, { emitUpdate: false });
    }
  }, [editor, tiptapContent]);

  if (!editor) return null;
  return <EditorContent editor={editor} />;
}
