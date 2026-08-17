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

export interface DefaultTextStyles {
  fontFamily: string;
  fontSize: string;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

interface CanvasStore {
  canvasItems: CanvasItem[];
  selectedItemIds: string[];
  clipboard: CanvasItem[];
  editingItemId: string | null;
  activeGuides: AlignmentGuide[];
  activeEditor: Editor | null;
  zoom: number;
  dragDelta: { deltaX: number; deltaY: number; leaderId: string } | null;
  defaultTextStyles: DefaultTextStyles;

  // Actions
  addItem: (type: 'text' | 'image') => void;
  updateItemCoords: (id: string, x: number, y: number) => void;
  updateMultiplePositions: (positions: { id: string; x: number; y: number }[]) => void;
  updateItemSize: (id: string, width: number, height: number) => void;
  updateItemBounds: (id: string, x: number, y: number, width: number, height: number) => void;
  updateItemContent: (id: string, content: string) => void;
  deleteItem: (id: string) => void;
  deleteSelected: () => void;
  selectItem: (id: string | null, multi?: boolean) => void;
  setSelectedItems: (ids: string[], isAdditive?: boolean) => void;
  selectAll: () => void;
  copy: () => void;
  paste: () => void;
  setEditingItem: (id: string | null) => void;
  setActiveGuides: (guides: AlignmentGuide[]) => void;
  clearActiveGuides: () => void;
  setActiveEditor: (editor: Editor | null) => void;
  setZoom: (zoom: number) => void;
  setDragDelta: (dragDelta: { deltaX: number; deltaY: number; leaderId: string } | null) => void;
  setDefaultTextStyles: (styles: Partial<DefaultTextStyles>) => void;
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
      dragDelta: null,
      defaultTextStyles: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '16px',
        color: '#1e293b',
        textAlign: 'left',
        bold: false,
        italic: false,
        underline: false,
      },

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

          const defaultStyles = state.defaultTextStyles;
          let content = '';
          if (type === 'text') {
            const spanStyle = `font-family: ${defaultStyles.fontFamily}; font-size: ${defaultStyles.fontSize}; color: ${defaultStyles.color};`;
            let inner = 'Click to edit text...';
            if (defaultStyles.bold) inner = `<strong>${inner}</strong>`;
            if (defaultStyles.italic) inner = `<em>${inner}</em>`;
            if (defaultStyles.underline) inner = `<u>${inner}</u>`;
            content = `<p style="text-align: ${defaultStyles.textAlign};"><span style="${spanStyle}">${inner}</span></p>`;
          }

          const newItem: CanvasItem = {
            id: nanoid(),
            type,
            x,
            y,
            width,
            height,
            content,
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

      updateItemBounds: (id, x, y, width, height) =>
        set((state) => ({
          canvasItems: updateItems(state.canvasItems, id, { x, y, width, height }),
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

      setSelectedItems: (ids, isAdditive) =>
        set((state) => {
          if (state.editingItemId) return state;
          const newSelectedIds = isAdditive
            ? Array.from(new Set([...state.selectedItemIds, ...ids]))
            : ids;
          return {
            selectedItemIds: newSelectedIds,
            editingItemId: null,
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
          clipboard: newItems,
        });
      },

      setEditingItem: (id) =>
        set(() => ({
          editingItemId: id,
          selectedItemIds: id ? [id] : [],
        })),

      setActiveGuides: (guides) => set(() => ({ activeGuides: guides })),

      clearActiveGuides: () => set(() => ({ activeGuides: [] })),

      setDragDelta: (dragDelta) => set(() => ({ dragDelta })),

      setActiveEditor: (editor) => set(() => ({ activeEditor: editor })),

      setZoom: (zoom) =>
        set(() => ({
          zoom: Math.max(0.25, Math.min(2, zoom)),
        })),

      setDefaultTextStyles: (styles) =>
        set((state) => ({
          defaultTextStyles: { ...state.defaultTextStyles, ...styles },
        })),
    }),
    {
      partialize: (state) => ({ canvasItems: state.canvasItems }),
    }
  )
);
