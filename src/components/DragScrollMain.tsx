"use client";

import { useRef, useState, useEffect, MouseEvent } from "react";

export default function DragScrollMain({
  children,
}: {
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startScrollTop, setStartScrollTop] = useState(0);

  // 스크롤 가능 여부 체크
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const checkScrollable = () => {
      setIsScrollable(el.scrollHeight > el.clientHeight + 1);
    };

    checkScrollable();

    const observer = new ResizeObserver(checkScrollable);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current || !isScrollable) return; // 스크롤 불가면 드래그 비활성
    setIsDragging(true);
    setStartY(e.clientY);
    setStartScrollTop(ref.current.scrollTop);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !ref.current) return;
    const deltaY = e.clientY - startY;
    ref.current.scrollTop = startScrollTop - deltaY;
  };

  const stopDrag = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={ref}
      className={`overflow-y-auto scrollbar-custom ${
        isScrollable ? (isDragging ? "cursor-grabbing" : "cursor-grab") : ""
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
