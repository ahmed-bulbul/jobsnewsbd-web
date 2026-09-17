'use client';

import { useCallback, useRef } from 'react';
import {
  useEditor, EditorContent, type Editor,
  ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExt from '@tiptap/extension-image';
import LinkExt from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { adminUploadImage } from '@/lib/api';

interface Props {
  value: string;
  onChange: (html: string) => void;
  token: string;
  placeholder?: string;
  className?: string;
}

// Reorders an image node among its siblings (same parent) by one step.
// Node views only get an absolute position (getPos) + the live editor, so
// reordering is done as a raw delete-then-reinsert transaction rather than
// a built-in command — Tiptap has no "move node" primitive.
function moveSiblingNode(editor: Editor, getPos: () => number | undefined, direction: -1 | 1) {
  const pos = getPos();
  if (typeof pos !== 'number') return;
  const { state, view } = editor;
  const $pos = state.doc.resolve(pos);
  const parent = $pos.parent;
  const index = $pos.index();
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= parent.childCount) return;

  const thisNode = parent.child(index);
  const otherNode = parent.child(targetIndex);
  const thisStart = pos;

  const tr = state.tr;
  tr.delete(thisStart, thisStart + thisNode.nodeSize);
  const insertPos = direction < 0 ? thisStart - otherNode.nodeSize : thisStart + otherNode.nodeSize;
  tr.insert(insertPos, thisNode);
  view.dispatch(tr);
  editor.commands.focus();
}

// Custom node view for inserted images: adds hover controls to remove the
// image or move it up/down relative to its siblings, since the description
// often has several circular photos in a row that need reordering after
// they're placed. Native drag-to-reorder still works too (data-drag-handle
// below), this just makes it discoverable without relying on drag alone.
function ManagedImageView({ node, deleteNode, editor, getPos, selected }: NodeViewProps) {
  return (
    <NodeViewWrapper
      className={`relative inline-block group/img my-2 max-w-full ${selected ? 'ring-2 ring-primary rounded-xl' : ''}`}
      data-drag-handle
    >
      <img
        src={node.attrs.src}
        alt={node.attrs.alt ?? ''}
        title={node.attrs.title ?? ''}
        className="rounded-xl max-w-full h-auto block cursor-grab active:cursor-grabbing"
      />
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/img:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          type="button"
          title="উপরে সরান"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => moveSiblingNode(editor, getPos, -1)}
          className="w-7 h-7 rounded-full bg-black/60 text-white text-sm flex items-center justify-center hover:bg-black/80"
        >
          ↑
        </button>
        <button
          type="button"
          title="নিচে সরান"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => moveSiblingNode(editor, getPos, 1)}
          className="w-7 h-7 rounded-full bg-black/60 text-white text-sm flex items-center justify-center hover:bg-black/80"
        >
          ↓
        </button>
        <button
          type="button"
          title="মুছে ফেলুন"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => deleteNode()}
          className="w-7 h-7 rounded-full bg-red-600/90 text-white text-sm flex items-center justify-center hover:bg-red-700"
        >
          ×
        </button>
      </div>
    </NodeViewWrapper>
  );
}

const ManagedImageExt = ImageExt.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ManagedImageView);
  },
});

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} // keep editor selection/focus
      onClick={onClick}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        active ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, token }: { editor: Editor | null; token: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImagePick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      e.target.value = '';
      if (files.length === 0 || !editor) return;
      // Upload sequentially (keeps them in picked order) but insert all of
      // them as ONE insertContent call at the end. Calling setImage() once
      // per file was replacing the previous image instead of adding after
      // it — inserting an image turns the selection into a NodeSelection
      // over that image, so the next setImage() replaced it rather than
      // inserting alongside it. Batching into a single insertContent call
      // sidesteps that entirely.
      const urls: string[] = [];
      let failed = 0;
      for (const file of files) {
        try {
          urls.push(await adminUploadImage(token, file));
        } catch {
          failed++;
        }
      }
      if (urls.length > 0) {
        editor
          .chain()
          .focus()
          .insertContent(urls.map((src) => ({ type: 'image', attrs: { src } })))
          .run();
      }
      if (failed > 0) {
        alert(`${failed}টি ছবি আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।`);
      }
    },
    [editor, token]
  );

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('লিংক ইউআরএল (URL):', previousUrl ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-1.5 border border-b-0 border-warm-border rounded-t-xl bg-gray-50">
      <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <span className="font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <span className="italic">I</span>
      </ToolbarButton>
      <ToolbarButton title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <span className="line-through">S</span>
      </ToolbarButton>

      <span className="w-px h-5 bg-warm-border mx-1" />

      <ToolbarButton title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </ToolbarButton>
      <ToolbarButton title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        H3
      </ToolbarButton>
      <ToolbarButton title="Paragraph" active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()}>
        ¶
      </ToolbarButton>

      <span className="w-px h-5 bg-warm-border mx-1" />

      <ToolbarButton title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
      </ToolbarButton>
      <ToolbarButton title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 6h13M7 12h13M7 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
      </ToolbarButton>
      <ToolbarButton title="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <span className="font-serif text-base leading-none">&ldquo;</span>
      </ToolbarButton>

      <span className="w-px h-5 bg-warm-border mx-1" />

      <ToolbarButton title="Link" active={editor.isActive('link')} onClick={setLink}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5" /></svg>
      </ToolbarButton>
      <ToolbarButton title="Image" onClick={handleImagePick}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      </ToolbarButton>
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />

      <span className="w-px h-5 bg-warm-border mx-1" />

      <ToolbarButton title="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
      </ToolbarButton>
      <ToolbarButton title="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" /></svg>
      </ToolbarButton>
    </div>
  );
}

/**
 * Controlled rich-text editor for admin article/quiz content. Stores an HTML
 * string (sanitized again on render on the public side via isomorphic-dompurify).
 * Image uploads go through the existing admin upload endpoint and are inserted
 * as <img src="..."> at the cursor.
 */
export default function RichTextEditor({ value, onChange, token, placeholder, className = '' }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      ManagedImageExt.configure({ HTMLAttributes: { class: 'rounded-xl max-w-full h-auto' } }),
      LinkExt.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline' } }),
      Placeholder.configure({ placeholder: placeholder ?? 'এখানে লিখুন...' }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[220px] px-4 py-3 focus:outline-none [&_img]:my-2',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  return (
    <div className={className}>
      <Toolbar editor={editor} token={token} />
      <div className="border border-warm-border rounded-b-xl bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
