import { Editor } from '@tiptap/react';

interface TextFormattingToolbarProps {
  editor: Editor | null;
}

const FONT_SIZES = ['6px', '7px', '8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '40px'];

const COLOR_SWATCHES = [
  { label: 'Dark', color: '#1e293b' },
  { label: 'Gray', color: '#64748b' },
  { label: 'Blue', color: '#2563eb' },
  { label: 'Red', color: '#dc2626' },
  { label: 'Green', color: '#16a34a' },
  { label: 'Purple', color: '#9333ea' },
];

export default function TextFormattingToolbar({ editor }: TextFormattingToolbarProps) {
  if (!editor) return null;

  const currentFontSize = editor.getAttributes('textStyle').fontSize || '16px';
  const currentColor = editor.getAttributes('textStyle').color || '#1e293b';

  return (
    <div
      onMouseDown={(e) => {
        // Prevent editor focus loss from toolbar button clicks,
        // but allow native select/input elements to work normally
        const tag = (e.target as HTMLElement).tagName;
        if (tag !== 'SELECT' && tag !== 'INPUT' && tag !== 'OPTION') {
          e.preventDefault();
        }
      }}
      className="flex items-center flex-wrap gap-1 p-1 bg-slate-900 text-white rounded-lg shadow-md border border-slate-700 text-xs select-none"
    >
      {/* Bold */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-0.5 rounded font-bold transition-colors ${
          editor.isActive('bold') ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-200'
        }`}
        title="Bold"
      >
        B
      </button>

      {/* Italic */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-0.5 rounded italic transition-colors ${
          editor.isActive('italic') ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-200'
        }`}
        title="Italic"
      >
        I
      </button>

      {/* Underline */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`px-2 py-0.5 rounded underline transition-colors ${
          editor.isActive('underline') ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-200'
        }`}
        title="Underline"
      >
        U
      </button>

      <div className="w-[1px] h-3.5 bg-slate-700 mx-0.5" />

      {/* Font Size Dropdown — uses the custom setFontSize command */}
      <select
        value={currentFontSize}
        onChange={(e) => {
          const size = e.target.value;
          (editor.chain().focus() as any).setFontSize(size).run();
        }}
        className="bg-slate-800 border border-slate-700 text-white text-xs rounded px-1.5 py-0.5 outline-none cursor-pointer"
        title="Font Size"
      >
        {FONT_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>

      <div className="w-[1px] h-3.5 bg-slate-700 mx-0.5" />

      {/* Alignment */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={`px-2 py-0.5 rounded transition-colors ${
          editor.isActive({ textAlign: 'left' }) ? 'bg-blue-600' : 'hover:bg-slate-700'
        }`}
        title="Align Left"
      >
        Left
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={`px-2 py-0.5 rounded transition-colors ${
          editor.isActive({ textAlign: 'center' }) ? 'bg-blue-600' : 'hover:bg-slate-700'
        }`}
        title="Align Center"
      >
        Center
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={`px-2 py-0.5 rounded transition-colors ${
          editor.isActive({ textAlign: 'right' }) ? 'bg-blue-600' : 'hover:bg-slate-700'
        }`}
        title="Align Right"
      >
        Right
      </button>

      <div className="w-[1px] h-3.5 bg-slate-700 mx-0.5" />

      {/* Color Swatches */}
      <div className="flex items-center gap-1 px-1">
        {COLOR_SWATCHES.map((s) => (
          <button
            key={s.color}
            type="button"
            onClick={() => editor.chain().focus().setColor(s.color).run()}
            className="w-3.5 h-3.5 rounded-full border border-slate-500 hover:scale-110 transition-transform"
            style={{ backgroundColor: s.color }}
            title={s.label}
          />
        ))}

        <input
          type="color"
          value={currentColor}
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          className="w-4 h-4 bg-transparent border-0 cursor-pointer rounded overflow-hidden"
          title="Custom Color"
        />
      </div>
    </div>
  );
}
