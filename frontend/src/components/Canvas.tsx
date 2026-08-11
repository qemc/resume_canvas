import { useEffect, useRef, useState, useCallback } from 'react';
import { useCanvasStore } from '@/store/useCanvasStore';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/lib/constants';
import CanvasItem from './CanvasItem';
import SelectionMarquee from './SelectionMarquee';

// AABB intersection test
function rectsIntersect(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export default function Canvas() {
  const canvasItems = useCanvasStore((s) => s.canvasItems);
  const selectItem = useCanvasStore((s) => s.selectItem);
  const activeGuides = useCanvasStore((s) => s.activeGuides);
  const zoom = useCanvasStore((s) => s.zoom);
  
  const copy = useCanvasStore((s) => s.copy);
  const paste = useCanvasStore((s) => s.paste);
  const selectAll = useCanvasStore((s) => s.selectAll);
  const deleteSelected = useCanvasStore((s) => s.deleteSelected);
  const editingItemId = useCanvasStore((s) => s.editingItemId);

  // Marquee state
  const [marquee, setMarquee] = useState<{
    startX: number; startY: number;
    currentX: number; currentY: number;
  } | null>(null);
  const isMarqueeActive = useRef(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Undo/Redo via zundo temporal store
  const undo = useCallback(() => {
    useCanvasStore.temporal.getState().undo();
  }, []);
  const redo = useCallback(() => {
    useCanvasStore.temporal.getState().redo();
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        editingItemId ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copy();
      } else if (cmdOrCtrl && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        paste();
      } else if (cmdOrCtrl && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectAll();
      } else if (cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        redo();
      } else if (cmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        deleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copy, paste, selectAll, deleteSelected, editingItemId, undo, redo]);

  // Marquee mouse handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.button !== 0) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    isMarqueeActive.current = true;
    setMarquee({ startX: x, startY: y, currentX: x, currentY: y });

    if (!e.shiftKey && !e.metaKey) {
      selectItem(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMarqueeActive.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    setMarquee((prev) => prev ? { ...prev, currentX: x, currentY: y } : null);
  };

  const handleCanvasMouseUp = () => {
    if (!isMarqueeActive.current || !marquee) {
      isMarqueeActive.current = false;
      setMarquee(null);
      return;
    }

    const mx = Math.min(marquee.startX, marquee.currentX);
    const my = Math.min(marquee.startY, marquee.currentY);
    const mw = Math.abs(marquee.currentX - marquee.startX);
    const mh = Math.abs(marquee.currentY - marquee.startY);

    if (mw > 3 || mh > 3) {
      const intersecting = canvasItems.filter((item) =>
        rectsIntersect(item.x, item.y, item.width, item.height, mx, my, mw, mh)
      );

      if (intersecting.length > 0) {
        intersecting.forEach((item, idx) => {
          selectItem(item.id, idx > 0);
        });
      }
    }

    isMarqueeActive.current = false;
    setMarquee(null);
  };

  return (
    <div className="flex items-start justify-center pt-12 pb-32 px-36 min-w-max select-none overflow-auto">
      {/* Wrapper that reserves the scaled size in the layout flow */}
      <div
        style={{
          width: `${CANVAS_WIDTH * zoom}px`,
          height: `${CANVAS_HEIGHT * zoom}px`,
          flexShrink: 0,
        }}
      >
        {/* Scaled paper sheet canvas with pasteboard overflow enabled */}
        <div
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          className="relative bg-white shadow-2xl border border-gray-300 overflow-visible rounded-xs"
          style={{
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }}
        >
          {/* Paper Sheet Badge */}
          <div className="absolute -top-7 left-0 flex items-center gap-1.5 text-[11px] text-gray-500 font-medium font-sans pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            A4 Resume Document Page ({CANVAS_WIDTH} × {CANVAS_HEIGHT} px)
          </div>

          {/* Canvas Items */}
          {canvasItems.map((item) => (
            <CanvasItem key={item.id} item={item} />
          ))}

          {/* Alignment Guide Lines Overlay */}
          {activeGuides.map((guide) => {
            if (guide.type === 'vertical') {
              return (
                <div
                  key={guide.id}
                  className="absolute top-0 bottom-0 pointer-events-none z-50 flex flex-col items-center"
                  style={{ left: `${guide.position}px` }}
                >
                  <div className="w-[1.5px] h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  {guide.label && (
                    <span className="absolute top-2 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow font-mono -translate-x-1/2 whitespace-nowrap">
                      {guide.label} ({Math.round(guide.position)}px)
                    </span>
                  )}
                </div>
              );
            } else {
              return (
                <div
                  key={guide.id}
                  className="absolute left-0 right-0 pointer-events-none z-50 flex items-center justify-start"
                  style={{ top: `${guide.position}px` }}
                >
                  <div className="h-[1.5px] w-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  {guide.label && (
                    <span className="absolute left-2 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow font-mono -translate-y-1/2 whitespace-nowrap">
                      {guide.label} ({Math.round(guide.position)}px)
                    </span>
                  )}
                </div>
              );
            }
          })}

          {/* Selection Marquee */}
          {marquee && (
            <SelectionMarquee
              startX={marquee.startX}
              startY={marquee.startY}
              currentX={marquee.currentX}
              currentY={marquee.currentY}
            />
          )}

          {/* Empty State */}
          {canvasItems.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 pointer-events-none">
              <svg
                className="w-16 h-16 mb-2 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              <p className="text-sm font-medium">Canvas is empty</p>
              <p className="text-xs">Use the toolbar above to add text or image blocks</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
