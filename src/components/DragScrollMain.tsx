"use client";

import { useRef, useState, MouseEvent } from "react";

export default function DragScrollMain({
  children,
}: {
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startScrollTop, setStartScrollTop] = useState(0);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    setIsDragging(true);
    setStartY(e.clientY);
    setStartScrollTop(ref.current.scrollTop);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !ref.current) return;
    const deltaY = e.clientY - startY;
    ref.current.scrollTop = startScrollTop - deltaY; // 위로 드래그하면 아래로 스크롤
  };

  const stopDrag = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={ref}
      className={`overflow-y-auto scrollbar-custom ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
    >
      {children}
    </div>
  );
}
