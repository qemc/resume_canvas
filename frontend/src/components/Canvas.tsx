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
  const setSelectedItems = useCanvasStore((s) => s.setSelectedItems);
  const setEditingItem = useCanvasStore((s) => s.setEditingItem);
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
  const isAdditiveMarquee = useRef(false);
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
      if (e.key === 'Escape') {
        e.preventDefault();
        setEditingItem(null);
        selectItem(null);
        return;
      }

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
      } else if (cmdOrCtrl && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setEditingItem(null);
        selectItem(null);
        setTimeout(() => {
          window.print();
        }, 50);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        deleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copy, paste, selectAll, deleteSelected, editingItemId, undo, redo, setEditingItem, selectItem]);

  // Marquee mouse handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    const isAdditive = e.shiftKey || e.metaKey;
    isAdditiveMarquee.current = isAdditive;
    isMarqueeActive.current = true;
    setMarquee({ startX: x, startY: y, currentX: x, currentY: y });

    if (!isAdditive) {
      selectItem(null);
    }
  };

  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!isMarqueeActive.current || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;

      setMarquee((prev) => prev ? { ...prev, currentX: x, currentY: y } : null);
    };

    const handleWindowMouseUp = () => {
      if (!isMarqueeActive.current) return;

      setMarquee((currentMarquee) => {
        if (currentMarquee) {
          const mx = Math.min(currentMarquee.startX, currentMarquee.currentX);
          const my = Math.min(currentMarquee.startY, currentMarquee.currentY);
          const mw = Math.abs(currentMarquee.currentX - currentMarquee.startX);
          const mh = Math.abs(currentMarquee.currentY - currentMarquee.startY);

          if (mw > 3 || mh > 3) {
            const currentItems = useCanvasStore.getState().canvasItems;
            const intersecting = currentItems.filter((item) =>
              rectsIntersect(item.x, item.y, item.width, item.height, mx, my, mw, mh)
            );

            const intersectingIds = intersecting.map((item) => item.id);
            if (intersectingIds.length > 0) {
              setSelectedItems(intersectingIds, isAdditiveMarquee.current);
            }
          }
        }
        return null;
      });

      isMarqueeActive.current = false;
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [setSelectedItems, zoom]);

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          handleCanvasMouseDown(e);
        }
      }}
      className="flex items-start justify-center pt-10 pb-32 px-6 sm:px-12 w-full min-w-0 select-none overflow-auto"
    >
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
          id="resume-print-root"
          ref={canvasRef}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              handleCanvasMouseDown(e);
            }
          }}
          className="relative bg-white shadow-2xl ring-1 ring-gray-300 overflow-visible"
          style={{
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }}
        >
          {/* Paper Sheet Badge */}
          <div className="absolute -top-7 left-0 flex items-center gap-1.5 text-[11px] text-gray-500 font-medium font-sans pointer-events-none no-print">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            A4 ({CANVAS_WIDTH} × {CANVAS_HEIGHT} px)
          </div>

          {/* Canvas Items */}
          {canvasItems.map((item) => (
            <CanvasItem key={item.id} item={item} />
          ))}

          {/* Alignment Guide Lines Overlay (Razor-sharp vector rendering) */}
          {activeGuides.length > 0 && (
            <>
              <svg className="absolute inset-0 pointer-events-none z-50 overflow-visible w-full h-full no-print">
                {activeGuides.map((guide) => {
                  const pos = Math.round(guide.position);
                  if (guide.type === 'vertical') {
                    return (
                      <line
                        key={guide.id}
                        x1={pos}
                        y1={0}
                        x2={pos}
                        y2={CANVAS_HEIGHT}
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                      />
                    );
                  } else {
                    return (
                      <line
                        key={guide.id}
                        x1={0}
                        y1={pos}
                        x2={CANVAS_WIDTH}
                        y2={pos}
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                      />
                    );
                  }
                })}
              </svg>
              {activeGuides.map((guide) => {
                const pos = Math.round(guide.position);
                if (!guide.label) return null;
                if (guide.type === 'vertical') {
                  return (
                    <div
                      key={`label-${guide.id}`}
                      className="absolute top-2 pointer-events-none z-50 -translate-x-1/2 whitespace-nowrap no-print"
                      style={{ left: `${pos}px` }}
                    >
                      <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow font-mono">
                        {guide.label} ({pos}px)
                      </span>
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={`label-${guide.id}`}
                      className="absolute left-2 pointer-events-none z-50 -translate-y-1/2 whitespace-nowrap no-print"
                      style={{ top: `${pos}px` }}
                    >
                      <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow font-mono">
                        {guide.label} ({pos}px)
                      </span>
                    </div>
                  );
                }
              })}
            </>
          )}

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
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 pointer-events-none no-print">
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
