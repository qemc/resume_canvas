import { useCanvasStore } from '@/store/useCanvasStore';

interface ImageNodeProps {
  id: string;
  content: string;
  isEditing?: boolean;
}

export default function ImageNode({ id, content, isEditing }: ImageNodeProps) {
  const updateItemContent = useCanvasStore((s) => s.updateItemContent);
  const setEditingItem = useCanvasStore((s) => s.setEditingItem);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          updateItemContent(id, event.target.result as string);
          setEditingItem(null);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  return (
    <div className="w-full h-full relative group select-none pointer-events-none">
      <input
        id={`image-input-${id}`}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageChange}
      />
      {content ? (
        <div className="w-full h-full relative pointer-events-none">
          <img
            src={content}
            alt="Canvas element"
            className="w-full h-full object-cover rounded pointer-events-none select-none"
          />
          <div
            className={`absolute inset-0 bg-black/40 ${
              isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            } transition-opacity flex items-center justify-center text-white text-xs rounded font-medium pointer-events-none no-print`}
          >
            📷 Double-click to Change Image
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded text-gray-400 text-sm select-none p-2 pointer-events-none no-print">
          <span className="text-2xl mb-1">🖼️</span>
          <span className="font-medium text-xs text-gray-600">Image Block</span>
          <span className="text-[10px] text-blue-500 font-medium mt-1">Double-click to upload image</span>
        </div>
      )}
    </div>
  );
}
