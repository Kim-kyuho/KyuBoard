"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Extension, markInputRule, markPasteRule } from "@tiptap/core";
import Highlight from "@tiptap/extension-highlight";
import StarterKit from "@tiptap/starter-kit";

const InlineMarkdownInputRules = Extension.create({
  name: "inlineMarkdownInputRules",

  addInputRules() {
    const marks = this.editor.schema.marks;

    return [
      markInputRule({
        find: /\*\*(?!\s+\*\*)((?:[^*]+))\*\*(?!\s+\*\*)$/,
        type: marks.bold,
      }),
      markInputRule({
        find: /__(?!\s+__)((?:[^_]+))__(?!\s+__)$/,
        type: marks.bold,
      }),
      markInputRule({
        find: /(?<!\*)\*(?!\*)((?:[^*]+))(?<!\*)\*(?!\*)$/,
        type: marks.italic,
      }),
      markInputRule({
        find: /_(?!\s+_)((?:[^_]+))_(?!\s+_)$/,
        type: marks.italic,
      }),
      markInputRule({
        find: /~~(?!\s+~~)((?:[^~]+))~~(?!\s+~~)$/,
        type: marks.strike,
      }),
      markInputRule({
        find: /`([^`]+)`(?!`)$/,
        type: marks.code,
      }),
      markInputRule({
        find: /==(?!\s+==)((?:[^=]+))==(?!\s+==)$/,
        type: marks.highlight,
      }),
    ];
  },

  addPasteRules() {
    const marks = this.editor.schema.marks;

    return [
      markPasteRule({
        find: /\*\*(?!\s+\*\*)((?:[^*]+))\*\*(?!\s+\*\*)/g,
        type: marks.bold,
      }),
      markPasteRule({
        find: /__(?!\s+__)((?:[^_]+))__(?!\s+__)/g,
        type: marks.bold,
      }),
      markPasteRule({
        find: /(?<!\*)\*(?!\*)((?:[^*]+))(?<!\*)\*(?!\*)/g,
        type: marks.italic,
      }),
      markPasteRule({
        find: /_(?!\s+_)((?:[^_]+))_(?!\s+_)/g,
        type: marks.italic,
      }),
      markPasteRule({
        find: /~~(?!\s+~~)((?:[^~]+))~~(?!\s+~~)/g,
        type: marks.strike,
      }),
      markPasteRule({
        find: /`([^`]+)`(?!`)/g,
        type: marks.code,
      }),
      markPasteRule({
        find: /==(?!\s+==)((?:[^=]+))==(?!\s+==)/g,
        type: marks.highlight,
      }),
    ];
  },
});

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
      InlineMarkdownInputRules,
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
