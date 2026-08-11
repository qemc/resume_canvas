import { create } from 'zustand';
import { temporal } from 'zundo';
import { nanoid } from 'nanoid';
import { Editor } from '@tiptap/react';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  DEFAULT_TEXT_WIDTH,
  DEFAULT_TEXT_HEIGHT,
  DEFAULT_IMAGE_WIDTH,
  DEFAULT_IMAGE_HEIGHT,
} from '@/lib/constants';

export interface CanvasItem {
  id: string;
  type: 'text' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
}

export interface AlignmentGuide {
  id: string;
  type: 'vertical' | 'horizontal';
  position: number;
  label?: string;
}

interface CanvasStore {
  canvasItems: CanvasItem[];
  selectedItemIds: string[];
  clipboard: CanvasItem[];
  editingItemId: string | null;
  activeGuides: AlignmentGuide[];
  activeEditor: Editor | null;
  zoom: number;

  // Actions
  addItem: (type: 'text' | 'image') => void;
  updateItemCoords: (id: string, x: number, y: number) => void;
  updateMultiplePositions: (positions: { id: string; x: number; y: number }[]) => void;
  updateItemSize: (id: string, width: number, height: number) => void;
  updateItemContent: (id: string, content: string) => void;
  deleteItem: (id: string) => void;
  deleteSelected: () => void;
  selectItem: (id: string | null, multi?: boolean) => void;
  selectAll: () => void;
  copy: () => void;
  paste: () => void;
  setEditingItem: (id: string | null) => void;
  setActiveGuides: (guides: AlignmentGuide[]) => void;
  clearActiveGuides: () => void;
  setActiveEditor: (editor: Editor | null) => void;
  setZoom: (zoom: number) => void;
}

/** Helper for immutable item field updates */
const updateItems = (
  items: CanvasItem[],
  id: string,
  patch: Partial<CanvasItem>
): CanvasItem[] => items.map((item) => (item.id === id ? { ...item, ...patch } : item));

export const useCanvasStore = create<CanvasStore>()(
  temporal(
    (set, get) => ({
      canvasItems: [],
      selectedItemIds: [],
      clipboard: [],
      editingItemId: null,
      activeGuides: [],
      activeEditor: null,
      zoom: 1,

      addItem: (type) =>
        set((state) => {
          const width = type === 'text' ? DEFAULT_TEXT_WIDTH : DEFAULT_IMAGE_WIDTH;
          const height = type === 'text' ? DEFAULT_TEXT_HEIGHT : DEFAULT_IMAGE_HEIGHT;

          const sameTypeCount = state.canvasItems.filter((i) => i.type === type).length;
          const offset = sameTypeCount * 20;

          const x = Math.max(0, Math.min(
            Math.round((CANVAS_WIDTH - width) / 2) + offset,
            CANVAS_WIDTH - width
          ));
          const y = Math.max(0, Math.min(
            Math.round((CANVAS_HEIGHT - height) / 2) + offset,
            CANVAS_HEIGHT - height
          ));

          const newItem: CanvasItem = {
            id: nanoid(),
            type,
            x,
            y,
            width,
            height,
            content: type === 'text' ? '<p>Click to edit text...</p>' : '',
          };

          return {
            canvasItems: [...state.canvasItems, newItem],
            selectedItemIds: [newItem.id],
          };
        }),

      updateItemCoords: (id, x, y) =>
        set((state) => ({
          canvasItems: updateItems(state.canvasItems, id, { x, y }),
        })),

      updateMultiplePositions: (positions) =>
        set((state) => {
          const map = new Map(positions.map((p) => [p.id, p]));
          return {
            canvasItems: state.canvasItems.map((item) => {
              const pos = map.get(item.id);
              return pos ? { ...item, x: pos.x, y: pos.y } : item;
            }),
          };
        }),

      updateItemSize: (id, width, height) =>
        set((state) => ({
          canvasItems: updateItems(state.canvasItems, id, { width, height }),
        })),

      updateItemContent: (id, content) =>
        set((state) => ({
          canvasItems: updateItems(state.canvasItems, id, { content }),
        })),

      deleteItem: (id) =>
        set((state) => ({
          canvasItems: state.canvasItems.filter((item) => item.id !== id),
          selectedItemIds: state.selectedItemIds.filter((itemId) => itemId !== id),
          activeEditor: state.editingItemId === id ? null : state.activeEditor,
          editingItemId: state.editingItemId === id ? null : state.editingItemId,
        })),

      deleteSelected: () =>
        set((state) => {
          const remainingItems = state.canvasItems.filter((item) => !state.selectedItemIds.includes(item.id));
          const isEditingDeleted = state.editingItemId && state.selectedItemIds.includes(state.editingItemId);
          return {
            canvasItems: remainingItems,
            selectedItemIds: [],
            editingItemId: isEditingDeleted ? null : state.editingItemId,
            activeEditor: isEditingDeleted ? null : state.activeEditor,
          };
        }),

      selectItem: (id, multi) =>
        set((state) => {
          if (id === null) {
            return { selectedItemIds: [], editingItemId: null, activeEditor: null };
          }

          let newSelectedIds = state.selectedItemIds;
          if (multi) {
            newSelectedIds = newSelectedIds.includes(id)
              ? newSelectedIds.filter((i) => i !== id)
              : [...newSelectedIds, id];
          } else {
            newSelectedIds = [id];
          }

          return {
            selectedItemIds: newSelectedIds,
            editingItemId: id === state.editingItemId ? state.editingItemId : null,
            activeEditor: id === state.editingItemId ? state.activeEditor : null,
          };
        }),

      selectAll: () =>
        set((state) => {
          if (state.editingItemId) return state;
          return {
            selectedItemIds: state.canvasItems.map((i) => i.id),
          };
        }),

      copy: () => {
        const state = get();
        if (state.editingItemId) return;
        const copiedItems = state.canvasItems.filter((item) => state.selectedItemIds.includes(item.id));
        set({ clipboard: copiedItems });
      },

      paste: () => {
        const state = get();
        if (state.editingItemId || state.clipboard.length === 0) return;

        const newItems = state.clipboard.map((item) => ({
          ...item,
          id: nanoid(),
          x: item.x + 20,
          y: item.y + 20,
        }));

        set({
          canvasItems: [...state.canvasItems, ...newItems],
          selectedItemIds: newItems.map((i) => i.id),
        });
      },

      setEditingItem: (id) =>
        set(() => ({
          editingItemId: id,
          selectedItemIds: id ? [id] : [],
        })),

      setActiveGuides: (guides) => set(() => ({ activeGuides: guides })),

      clearActiveGuides: () => set(() => ({ activeGuides: [] })),

      setActiveEditor: (editor) => set(() => ({ activeEditor: editor })),

      setZoom: (zoom) =>
        set(() => ({
          zoom: Math.max(0.25, Math.min(2, zoom)),
        })),
    }),
    {
      partialize: (state) => ({ canvasItems: state.canvasItems }),
    }
  )
);
