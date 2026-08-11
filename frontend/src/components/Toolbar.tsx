import { useCanvasStore } from '@/store/useCanvasStore';
import TextFormattingToolbar from './TextFormattingToolbar';

export default function Toolbar() {
  const addItem = useCanvasStore((s) => s.addItem);
  const canvasItems = useCanvasStore((s) => s.canvasItems);
  const activeEditor = useCanvasStore((s) => s.activeEditor);
  const selectedItemIds = useCanvasStore((s) => s.selectedItemIds);
  const zoom = useCanvasStore((s) => s.zoom);
  const setZoom = useCanvasStore((s) => s.setZoom);

  const selectedItem = selectedItemIds.length === 1 ? canvasItems.find((i) => i.id === selectedItemIds[0]) : null;
  const showTextTools = selectedItem?.type === 'text' && activeEditor;

  const zoomPercent = Math.round(zoom * 100);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm py-2.5 px-6 flex items-center justify-between min-h-[56px]">
      {/* Brand & Stats */}
      <div className="flex items-center space-x-3 shrink-0">
        <span className="font-bold text-gray-800 text-base flex items-center gap-2">
          📄 Resume Canvas
        </span>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
          {canvasItems.length} {canvasItems.length === 1 ? 'element' : 'elements'}
        </span>
      </div>

      {/* Middle Contextual Tools */}
      <div className="flex-1 flex justify-center px-4">
        {showTextTools ? (
          <TextFormattingToolbar editor={activeEditor} />
        ) : (
          <div className="text-xs text-gray-400 font-medium hidden md:block">
            {selectedItemIds.length > 1 
              ? `${selectedItemIds.length} items selected`
              : selectedItem
              ? `Selected ${selectedItem.type} block`
              : 'Select an element to format'}
          </div>
        )}
      </div>

      {/* Right side: Zoom + Add buttons */}
      <div className="flex items-center space-x-3 shrink-0">
        <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2 py-1">
          <button
            onClick={() => setZoom(zoom - 0.1)}
            disabled={zoom <= 0.25}
            className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold"
            title="Zoom Out"
          >
            −
          </button>
          <span className="text-xs font-medium text-gray-700 w-10 text-center tabular-nums">
            {zoomPercent}%
          </span>
          <button
            onClick={() => setZoom(zoom + 0.1)}
            disabled={zoom >= 2}
            className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => setZoom(1)}
            className="text-[10px] text-gray-500 hover:text-gray-900 font-medium ml-1"
            title="Reset to 100%"
          >
            Reset
          </button>
        </div>

        {/* Add buttons */}
        <button
          onClick={() => addItem('text')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors shadow-sm active:scale-95"
        >
          <span>📝</span> Add Text
        </button>

        <button
          onClick={() => addItem('image')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-500 transition-colors shadow-sm active:scale-95"
        >
          <span>🖼️</span> Add Image
        </button>
      </div>
    </header>
  );
}
