interface SelectionMarqueeProps {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export default function SelectionMarquee({ startX, startY, currentX, currentY }: SelectionMarqueeProps) {
  const left = Math.min(startX, currentX);
  const top = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);

  if (width < 2 && height < 2) return null;

  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        border: '1.5px dashed rgba(59, 130, 246, 0.8)',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        borderRadius: '2px',
      }}
    />
  );
}
