import React from 'react';
import { useCanvasStore } from '@/store/useCanvasStore';

const RESUME_FONTS = [
  { label: 'Inter (Modern Sans)', value: 'Inter, sans-serif', family: 'Inter' },
  { label: 'Roboto (Clean Sans)', value: 'Roboto, sans-serif', family: 'Roboto' },
  { label: 'Poppins (Geometric Sans)', value: 'Poppins, sans-serif', family: 'Poppins' },
  { label: 'Merriweather (Executive Serif)', value: 'Merriweather, serif', family: 'Merriweather' },
  { label: 'Playfair Display (Classic Serif)', value: '"Playfair Display", serif', family: 'Playfair Display' },
  { label: 'Georgia (Traditional Serif)', value: 'Georgia, serif', family: 'Georgia' },
  { label: 'JetBrains Mono (Tech Code)', value: '"JetBrains Mono", monospace', family: 'JetBrains Mono' },
  { label: 'Arial (Neutral Sans)', value: 'Arial, sans-serif', family: 'Arial' },
];

const FONT_SIZES = ['8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '40px'];

const COLOR_SWATCHES = [
  { label: 'Charcoal', color: '#1e293b' },
  { label: 'Slate Gray', color: '#64748b' },
  { label: 'Navy Blue', color: '#1e40af' },
  { label: 'Crimson', color: '#b91c1c' },
  { label: 'Emerald', color: '#047857' },
  { label: 'Deep Purple', color: '#6d28d9' },
];

export default function Sidebar() {
  const addItem = useCanvasStore((s) => s.addItem);
  const canvasItems = useCanvasStore((s) => s.canvasItems);
  const selectedItemIds = useCanvasStore((s) => s.selectedItemIds);
  const activeEditor = useCanvasStore((s) => s.activeEditor);
  const deleteItem = useCanvasStore((s) => s.deleteItem);
  const copy = useCanvasStore((s) => s.copy);
  const paste = useCanvasStore((s) => s.paste);
  const defaultTextStyles = useCanvasStore((s) => s.defaultTextStyles);
  const setDefaultTextStyles = useCanvasStore((s) => s.setDefaultTextStyles);

  const updateItemContent = useCanvasStore((s) => s.updateItemContent);

  const selectedItem = selectedItemIds.length === 1
    ? canvasItems.find((i) => i.id === selectedItemIds[0])
    : null;

  // Active values derived from active editor or fallback to default styles
  const currentFontSize = activeEditor?.getAttributes('textStyle').fontSize || defaultTextStyles.fontSize;
  const currentFontFamily = activeEditor?.getAttributes('textStyle').fontFamily || defaultTextStyles.fontFamily;
  const currentColor = activeEditor?.getAttributes('textStyle').color || defaultTextStyles.color;

  const isBold = activeEditor ? activeEditor.isActive('bold') : defaultTextStyles.bold;
  const isItalic = activeEditor ? activeEditor.isActive('italic') : defaultTextStyles.italic;
  const isUnderline = activeEditor ? activeEditor.isActive('underline') : defaultTextStyles.underline;
  const currentAlign = activeEditor
    ? activeEditor.isActive({ textAlign: 'center' })
      ? 'center'
      : activeEditor.isActive({ textAlign: 'right' })
      ? 'right'
      : 'left'
    : defaultTextStyles.textAlign;

  const updateSelectedTextHTML = (updater: (tempDiv: HTMLElement) => void) => {
    if (!selectedItem || selectedItem.type !== 'text') return;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = selectedItem.content;
    updater(tempDiv);
    updateItemContent(selectedItem.id, tempDiv.innerHTML);
  };

  const handleFontSizeChange = (size: string) => {
    setDefaultTextStyles({ fontSize: size });
    if (activeEditor) {
      if (activeEditor.state.selection.empty) {
        (activeEditor.chain().focus().selectAll() as any).setFontSize(size).run();
      } else {
        (activeEditor.chain().focus() as any).setFontSize(size).run();
      }
    } else if (selectedItem && selectedItem.type === 'text') {
      updateSelectedTextHTML((div) => {
        const els = div.querySelectorAll('span, p, h1, h2, h3, h4, h5, h6');
        els.forEach((el) => {
          (el as HTMLElement).style.fontSize = size;
        });
      });
    }
  };

  const handleFontFamilyChange = (font: string) => {
    setDefaultTextStyles({ fontFamily: font });
    if (activeEditor) {
      if (activeEditor.state.selection.empty) {
        (activeEditor.chain().focus().selectAll() as any).setFontFamily(font).run();
      } else {
        (activeEditor.chain().focus() as any).setFontFamily(font).run();
      }
    } else if (selectedItem && selectedItem.type === 'text') {
      updateSelectedTextHTML((div) => {
        const els = div.querySelectorAll('span, p, h1, h2, h3, h4, h5, h6');
        els.forEach((el) => {
          (el as HTMLElement).style.fontFamily = font;
        });
        if (els.length === 0) {
          div.innerHTML = `<p><span style="font-family: ${font};">${div.textContent || 'Click to edit text...'}</span></p>`;
        }
      });
    }
  };

  const handleColorChange = (color: string) => {
    setDefaultTextStyles({ color });
    if (activeEditor) {
      if (activeEditor.state.selection.empty) {
        activeEditor.chain().focus().selectAll().setColor(color).run();
      } else {
        activeEditor.chain().focus().setColor(color).run();
      }
    } else if (selectedItem && selectedItem.type === 'text') {
      updateSelectedTextHTML((div) => {
        const els = div.querySelectorAll('span, p, h1, h2, h3, h4, h5, h6');
        els.forEach((el) => {
          (el as HTMLElement).style.color = color;
        });
      });
    }
  };

  const handleToggleBold = () => {
    if (activeEditor) {
      activeEditor.chain().focus().toggleBold().run();
    } else {
      const next = !defaultTextStyles.bold;
      setDefaultTextStyles({ bold: next });
      if (selectedItem && selectedItem.type === 'text') {
        updateSelectedTextHTML((div) => {
          if (next) {
            div.innerHTML = `<strong>${div.innerHTML}</strong>`;
          } else {
            div.querySelectorAll('strong, b').forEach((b) => {
              b.replaceWith(...Array.from(b.childNodes));
            });
          }
        });
      }
    }
  };

  const handleToggleItalic = () => {
    if (activeEditor) {
      activeEditor.chain().focus().toggleItalic().run();
    } else {
      const next = !defaultTextStyles.italic;
      setDefaultTextStyles({ italic: next });
      if (selectedItem && selectedItem.type === 'text') {
        updateSelectedTextHTML((div) => {
          if (next) {
            div.innerHTML = `<em>${div.innerHTML}</em>`;
          } else {
            div.querySelectorAll('em, i').forEach((i) => {
              i.replaceWith(...Array.from(i.childNodes));
            });
          }
        });
      }
    }
  };

  const handleToggleUnderline = () => {
    if (activeEditor) {
      activeEditor.chain().focus().toggleUnderline().run();
    } else {
      const next = !defaultTextStyles.underline;
      setDefaultTextStyles({ underline: next });
      if (selectedItem && selectedItem.type === 'text') {
        updateSelectedTextHTML((div) => {
          if (next) {
            div.innerHTML = `<u>${div.innerHTML}</u>`;
          } else {
            div.querySelectorAll('u').forEach((u) => {
              u.replaceWith(...Array.from(u.childNodes));
            });
          }
        });
      }
    }
  };

  const handleAlign = (align: 'left' | 'center' | 'right') => {
    setDefaultTextStyles({ textAlign: align });
    if (activeEditor) {
      activeEditor.chain().focus().setTextAlign(align).run();
    } else if (selectedItem && selectedItem.type === 'text') {
      updateSelectedTextHTML((div) => {
        const paragraphs = div.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
        paragraphs.forEach((p) => {
          (p as HTMLElement).style.textAlign = align;
        });
      });
    }
  };

  return (
    <aside
      className="w-72 bg-white/95 backdrop-blur-md border-r border-slate-200 flex flex-col shrink-0 no-print select-none overflow-y-auto z-40 text-slate-800"
      onMouseDown={(e) => {
        const tag = (e.target as HTMLElement).tagName;
        if (tag !== 'SELECT' && tag !== 'INPUT' && tag !== 'OPTION') {
          e.preventDefault();
        }
      }}
    >
      <div className="p-4 space-y-5 flex-1">
        {/* Insert Elements Section */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Add Element
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => addItem('text')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Add Text
            </button>
            <button
              onClick={() => addItem('image')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-500 active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Add Image
            </button>
          </div>
        </div>

        {/* Typography Section (Always Available) */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Font Family
            </label>
            <select
              value={currentFontFamily}
              onChange={(e) => handleFontFamilyChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer font-medium"
            >
              {RESUME_FONTS.map((font) => (
                <option
                  key={font.value}
                  value={font.value}
                  style={{ fontFamily: font.family }}
                >
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size & Weight */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Size
              </label>
              <select
                value={currentFontSize}
                onChange={(e) => handleFontSizeChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
              >
                {FONT_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Style
              </label>
              <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 gap-0.5">
                <button
                  type="button"
                  onClick={handleToggleBold}
                  className={`flex-1 py-1 text-xs font-bold rounded transition-colors cursor-pointer ${
                    isBold
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Bold"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={handleToggleItalic}
                  className={`flex-1 py-1 text-xs italic font-medium rounded transition-colors cursor-pointer ${
                    isItalic
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Italic"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={handleToggleUnderline}
                  className={`flex-1 py-1 text-xs underline font-medium rounded transition-colors cursor-pointer ${
                    isUnderline
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Underline"
                >
                  U
                </button>
              </div>
            </div>
          </div>

          {/* Alignment */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Alignment
            </label>
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 gap-0.5">
              <button
                type="button"
                onClick={() => handleAlign('left')}
                className={`flex-1 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  currentAlign === 'left'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
                title="Align Left"
              >
                Left
              </button>
              <button
                type="button"
                onClick={() => handleAlign('center')}
                className={`flex-1 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  currentAlign === 'center'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
                title="Align Center"
              >
                Center
              </button>
              <button
                type="button"
                onClick={() => handleAlign('right')}
                className={`flex-1 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  currentAlign === 'right'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
                title="Align Right"
              >
                Right
              </button>
            </div>
          </div>

          {/* Text Color */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Color Palette
            </label>
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg border border-slate-200 bg-slate-50">
              {COLOR_SWATCHES.map((s) => (
                <button
                  key={s.color}
                  type="button"
                  onClick={() => handleColorChange(s.color)}
                  className="w-5 h-5 rounded-full border border-slate-300 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                  style={{ backgroundColor: s.color }}
                  title={s.label}
                />
              ))}
              <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />
              <input
                type="color"
                value={currentColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-5 h-5 bg-transparent border-0 cursor-pointer rounded overflow-hidden"
                title="Custom Color"
              />
            </div>
          </div>
        </div>

        {/* Position & Size Card (Appears when any item is selected) */}
        {selectedItem && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Position & Size
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 text-[10px] block">X / Y</span>
                <span className="font-semibold text-slate-700">{selectedItem.x}px, {selectedItem.y}px</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 text-[10px] block">W × H</span>
                <span className="font-semibold text-slate-700">{selectedItem.width}×{selectedItem.height}px</span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  copy();
                  paste();
                }}
                className="flex-1 py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer text-center"
                title="Duplicate Element (Cmd+C, Cmd+V)"
              >
                Duplicate
              </button>
              <button
                onClick={() => deleteItem(selectedItem.id)}
                className="py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition-colors cursor-pointer text-center border border-red-200"
                title="Delete Element (Delete / Backspace)"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
