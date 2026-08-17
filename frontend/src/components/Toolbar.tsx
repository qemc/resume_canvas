import { useCanvasStore } from '@/store/useCanvasStore';

export default function Toolbar() {
  const canvasItems = useCanvasStore((s) => s.canvasItems);
  const selectedItemIds = useCanvasStore((s) => s.selectedItemIds);
  const zoom = useCanvasStore((s) => s.zoom);
  const setZoom = useCanvasStore((s) => s.setZoom);
  const selectItem = useCanvasStore((s) => s.selectItem);
  const setEditingItem = useCanvasStore((s) => s.setEditingItem);

  const selectedItem = selectedItemIds.length === 1 ? canvasItems.find((i) => i.id === selectedItemIds[0]) : null;
  const zoomPercent = Math.round(zoom * 100);

  const handlePrint = () => {
    selectItem(null);
    setEditingItem(null);
    setTimeout(() => {
      window.print();
    }, 50);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm py-2 px-4 sm:px-6 flex items-center justify-between min-h-[52px] no-print gap-3 select-none">
      {/* Brand & Stats */}
      <div className="flex items-center space-x-3 shrink-0">
        <span className="font-bold text-gray-800 text-sm sm:text-base flex items-center gap-1.5">
          <svg className="w-4 h-4 text-blue-600 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Resume Canvas
        </span>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium hidden sm:inline-block">
          {canvasItems.length} {canvasItems.length === 1 ? 'element' : 'elements'}
        </span>
      </div>

      {/* Middle Context Status */}
      <div className="flex-1 flex justify-center px-2 min-w-0">
        <div className="text-xs text-gray-400 font-medium hidden md:block">
          {selectedItemIds.length > 1
            ? `${selectedItemIds.length} elements selected`
            : selectedItem
            ? `Editing ${selectedItem.type} block`
            : 'Select an element on the canvas to inspect'}
        </div>
      </div>

      {/* Right side: Zoom + Print as PDF */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-1.5 py-1">
          <button
            onClick={() => setZoom(zoom - 0.1)}
            disabled={zoom <= 0.25}
            className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold cursor-pointer"
            title="Zoom Out"
          >
            −
          </button>
          <span className="text-xs font-medium text-gray-700 w-9 text-center tabular-nums">
            {zoomPercent}%
          </span>
          <button
            onClick={() => setZoom(zoom + 0.1)}
            disabled={zoom >= 2}
            className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold cursor-pointer"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => setZoom(1)}
            className="text-[10px] text-gray-500 hover:text-gray-900 font-medium ml-0.5 cursor-pointer"
            title="Reset to 100%"
          >
            1:1
          </button>
        </div>

        {/* Print as PDF button */}
        <button
          onClick={handlePrint}
          title="Print or Save as PDF (Cmd+P / Ctrl+P)"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-500 transition-colors shadow-sm active:scale-95 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>Print as PDF</span>
        </button>
      </div>
    </header>
  );
}
