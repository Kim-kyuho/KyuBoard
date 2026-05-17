"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import Highlight from "@tiptap/extension-highlight";
import StarterKit from "@tiptap/starter-kit";

export default function MemoEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (content: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: content,
    editorProps: {
      attributes: {
        class: "memo-editor-content",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor || editor.getHTML() === content) return;

    editor.commands.setContent(content, { emitUpdate: false });
  }, [content, editor]);

  return <EditorContent className="h-full w-full" editor={editor} />;
}
