import React from 'react';
import { Rnd } from 'react-rnd';
import { CanvasItem as CanvasItemType, useCanvasStore } from '@/store/useCanvasStore';
import TextNode from './nodes/TextNode';
import ImageNode from './nodes/ImageNode';
import { calculateAlignmentSnapping } from '@/lib/alignment';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/lib/constants';

interface CanvasItemProps {
  item: CanvasItemType;
}

function CanvasItemInner({ item }: CanvasItemProps) {
  const canvasItems = useCanvasStore((s) => s.canvasItems);
  const updateItemCoords = useCanvasStore((s) => s.updateItemCoords);
  const updateMultiplePositions = useCanvasStore((s) => s.updateMultiplePositions);
  const updateItemSize = useCanvasStore((s) => s.updateItemSize);
  const deleteItem = useCanvasStore((s) => s.deleteItem);
  const selectedItemIds = useCanvasStore((s) => s.selectedItemIds);
  const editingItemId = useCanvasStore((s) => s.editingItemId);
  const selectItem = useCanvasStore((s) => s.selectItem);
  const setEditingItem = useCanvasStore((s) => s.setEditingItem);
  const setActiveGuides = useCanvasStore((s) => s.setActiveGuides);
  const clearActiveGuides = useCanvasStore((s) => s.clearActiveGuides);

  const isSelected = selectedItemIds.includes(item.id);
  const isEditing = editingItemId === item.id;

  const isOutsidePage =
    item.x < 0 ||
    item.x + item.width > CANVAS_WIDTH ||
    item.y < 0 ||
    item.y + item.height > CANVAS_HEIGHT;

  const dragStartPositions = React.useRef<Map<string, { x: number; y: number }>>(new Map());

  return (
    <Rnd
      position={{ x: item.x, y: item.y }}
      size={{ width: item.width, height: item.height }}
      minWidth={50}
      minHeight={30}
      scale={useCanvasStore((s) => s.zoom)}
      disableDragging={isEditing}
      onDragStart={(e) => {
        useCanvasStore.temporal.getState().pause();
        const multi = 'shiftKey' in e ? e.shiftKey || e.metaKey : false;
        if (!selectedItemIds.includes(item.id)) {
          selectItem(item.id, multi);
        }

        // Store initial positions of all selected items for relative delta calculation
        const storeState = useCanvasStore.getState();
        const currentSelectedIds = storeState.selectedItemIds.includes(item.id)
          ? storeState.selectedItemIds
          : [item.id];

        const map = new Map<string, { x: number; y: number }>();
        storeState.canvasItems.forEach((it) => {
          if (currentSelectedIds.includes(it.id)) {
            map.set(it.id, { x: it.x, y: it.y });
          }
        });
        dragStartPositions.current = map;
      }}
      onDrag={(_e, data) => {
        const storeState = useCanvasStore.getState();
        const currentSelectedIds = storeState.selectedItemIds.includes(item.id)
          ? storeState.selectedItemIds
          : [item.id];

        // Calculate live magnet guide lines against raw mouse position without mutating state mid-drag
        // (prevents re-render feedback loops and wiggling)
        const { guides } = calculateAlignmentSnapping(
          data.x,
          data.y,
          item.width,
          item.height,
          storeState.canvasItems,
          currentSelectedIds,
          CANVAS_WIDTH,
          CANVAS_HEIGHT
        );
        setActiveGuides(guides);
      }}
      onDragStop={(_e, data) => {
        clearActiveGuides();
        useCanvasStore.temporal.getState().resume();

        const storeState = useCanvasStore.getState();
        const currentSelectedIds = storeState.selectedItemIds.includes(item.id)
          ? storeState.selectedItemIds
          : [item.id];

        // Compute final snap position instantaneously on mouse release frame (0ms latency)
        const { snappedX, snappedY } = calculateAlignmentSnapping(
          data.x,
          data.y,
          item.width,
          item.height,
          storeState.canvasItems,
          currentSelectedIds,
          CANVAS_WIDTH,
          CANVAS_HEIGHT
        );

        const startPos = dragStartPositions.current.get(item.id) ?? { x: item.x, y: item.y };
        const deltaX = snappedX - startPos.x;
        const deltaY = snappedY - startPos.y;

        const finalUpdates = currentSelectedIds.map((id) => {
          const orig = dragStartPositions.current.get(id) ?? { x: 0, y: 0 };
          return {
            id,
            x: orig.x + deltaX,
            y: orig.y + deltaY,
          };
        });

        updateMultiplePositions(finalUpdates);
      }}
      onResizeStart={() => selectItem(item.id)}
      onResize={(_e, _direction, ref, _delta, position) => {
        const w = parseInt(ref.style.width, 10);
        const h = parseInt(ref.style.height, 10);
        const { guides } = calculateAlignmentSnapping(
          position.x,
          position.y,
          w,
          h,
          canvasItems,
          selectedItemIds,
          CANVAS_WIDTH,
          CANVAS_HEIGHT
        );
        setActiveGuides(guides);
      }}
      onResizeStop={(_e, _direction, ref, _delta, position) => {
        const w = parseInt(ref.style.width, 10);
        const h = parseInt(ref.style.height, 10);
        const { snappedX, snappedY } = calculateAlignmentSnapping(
          position.x,
          position.y,
          w,
          h,
          canvasItems,
          selectedItemIds,
          CANVAS_WIDTH,
          CANVAS_HEIGHT
        );
        updateItemSize(item.id, Math.round(w), Math.round(h));
        updateItemCoords(item.id, snappedX, snappedY);
        clearActiveGuides();
      }}
      onDoubleClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingItem(item.id);
        if (item.type === 'image') {
          const input = document.getElementById(`image-input-${item.id}`) as HTMLInputElement;
          if (input) {
            input.click();
          }
        }
      }}
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        const multi = e.shiftKey || e.metaKey;
        selectItem(item.id, multi);
      }}
      className={isSelected ? 'z-40' : 'z-10'}
      style={isEditing ? { cursor: 'text' } : undefined}
    >
      {/* Node Content */}
      <div
        className={`w-full h-full relative group transition-all rounded ${
          isSelected
            ? 'ring-2 ring-blue-500 shadow-md'
            : 'hover:ring-1 hover:ring-gray-300'
        } ${isOutsidePage ? 'bg-amber-50/60 border border-amber-200/80' : ''}`}
        style={{ pointerEvents: isEditing && item.type === 'text' ? 'auto' : 'none' }}
      >
        {/* Outside Page Badge */}
        {isOutsidePage && (
          <span className="absolute -top-4 left-1 bg-amber-500 text-white text-[9px] px-1 py-0.2 rounded font-mono shadow-xs opacity-75 pointer-events-none">
            Off-page pasteboard
          </span>
        )}

        {item.type === 'text' ? (
          <TextNode id={item.id} content={item.content} isSelected={isSelected} isEditing={isEditing} />
        ) : (
          <ImageNode id={item.id} content={item.content} isEditing={isEditing} />
        )}

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteItem(item.id);
          }}
          className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all z-50"
          title="Delete element"
          style={{ pointerEvents: 'auto' }}
        >
          ×
        </button>
      </div>
    </Rnd>
  );
}

const CanvasItem = React.memo(CanvasItemInner);
export default CanvasItem;
