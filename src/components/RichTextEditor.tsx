"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import { useEffect } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Highlighter,
  Table as TableIcon, Plus, Minus,
} from "lucide-react";

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export default function RichTextEditor({
  content, onChange, placeholder = "Take a note...", editable = true, autoFocus = false, className = "",
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    editable,
    immediatelyRender: false,
    autofocus: autoFocus ? "end" : false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none focus:outline-none min-h-[200px] text-gray-800 dark:text-gray-100 dark:prose-invert leading-relaxed",
      },
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className={`rich-editor ${className}`}>
      {editable && (
        <div className="flex flex-wrap items-center gap-0.5 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700/60">
          {/* Text formatting */}
          <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
            <Bold size={18} />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
            <Italic size={18} />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
            <UnderlineIcon size={18} />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
            <Strikethrough size={18} />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} title="Highlight">
            <Highlighter size={18} />
          </ToolBtn>

          <Sep />

          {/* Lists */}
          <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
            <List size={18} />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list">
            <ListOrdered size={18} />
          </ToolBtn>

          <Sep />

          {/* Alignment */}
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align left">
            <AlignLeft size={18} />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align center">
            <AlignCenter size={18} />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align right">
            <AlignRight size={18} />
          </ToolBtn>

          <Sep />

          {/* Table */}
          <ToolBtn onClick={insertTable} active={editor.isActive("table")} title="Insert table">
            <TableIcon size={18} />
          </ToolBtn>
          {editor.isActive("table") && (
            <>
              <ToolBtn onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add column">
                <span className="text-xs font-bold flex items-center gap-0.5"><Plus size={12} />Col</span>
              </ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().addRowAfter().run()} title="Add row">
                <span className="text-xs font-bold flex items-center gap-0.5"><Plus size={12} />Row</span>
              </ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete column" danger>
                <span className="text-xs font-bold flex items-center gap-0.5"><Minus size={12} />Col</span>
              </ToolBtn>
              <ToolBtn onClick={() => editor.chain().focus().deleteRow().run()} title="Delete row" danger>
                <span className="text-xs font-bold flex items-center gap-0.5"><Minus size={12} />Row</span>
              </ToolBtn>
            </>
          )}
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1.5" />;
}

function ToolBtn({ onClick, active, title, children, danger }: {
  onClick: () => void; active?: boolean; title: string; children: React.ReactNode; danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`p-2 rounded-lg transition-colors ${
        danger
          ? "text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          : active
          ? "bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800"
          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200"
      }`}
    >
      {children}
    </button>
  );
}
