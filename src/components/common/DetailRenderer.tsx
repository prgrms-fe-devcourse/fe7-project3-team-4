// ============================================
// 2. DetailRenderer.tsx (상세 페이지용 - TipTap 에디터)
// ============================================
"use client";

import { useEditor, EditorContent, type Content } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { useEffect } from "react";
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

export function DetailRenderer({ content }: { content: Json | null }) {
  const editor = useEditor({
    editable: false,
    immediatelyRender: false,
    content: content as Content,
    extensions: editorExtensions,
    editorProps: {
      attributes: { class: "prose prose-lg max-w-none" },
    },
  }, []);

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content as Content, { emitUpdate: false });
    }
  }, [editor, content]);

  if (!editor) return null;

  return <EditorContent editor={editor} />;
}
