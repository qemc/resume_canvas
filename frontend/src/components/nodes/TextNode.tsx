import { useEffect } from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { useCanvasStore } from '@/store/useCanvasStore';

interface TextNodeProps {
  id: string;
  content: string;
  isSelected: boolean;
  isEditing: boolean;
}

// Custom FontSize extension that adds a proper setFontSize command
const FontSize = Extension.create({
  name: 'fontSize',

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (size: string) =>
        ({ chain }: { chain: any }) => {
          return chain().setMark('textStyle', { fontSize: size }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }: { chain: any }) => {
          return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
        },
    };
  },
});

export default function TextNode({ id, content, isSelected, isEditing }: TextNodeProps) {
  const updateItemContent = useCanvasStore((s) => s.updateItemContent);
  const setActiveEditor = useCanvasStore((s) => s.setActiveEditor);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontSize,
      Color,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[100%] max-w-none text-slate-800 leading-normal',
      },
    },
    onFocus: () => {
      if (editor) setActiveEditor(editor);
    },
    onUpdate: ({ editor }) => {
      updateItemContent(id, editor.getHTML());
    },
    immediatelyRender: false,
  });

  // Synchronize external content changes (e.g. Undo/Redo via Zundo)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  // Auto-focus the editor when entering editing mode
  useEffect(() => {
    if (isEditing && editor && !editor.isFocused) {
      editor.commands.focus();
    }
  }, [isEditing, editor]);

  useEffect(() => {
    if (isSelected && editor) {
      setActiveEditor(editor);
    }
    return () => {
      const currentActive = useCanvasStore.getState().activeEditor;
      if (currentActive === editor) {
        setActiveEditor(null);
      }
    };
  }, [isSelected, editor, setActiveEditor]);

  return (
    <div className="w-full h-full relative flex flex-col group">
      <div className="w-full h-full px-1 py-0.5 overflow-hidden bg-transparent cursor-text select-text">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}
