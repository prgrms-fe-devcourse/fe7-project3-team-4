"use client";

import { useRef, useState, MouseEvent } from "react";

export default function DragScrollMain({
  children,
}: {
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lastY, setLastY] = useState(0);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const el = ref.current;
    if (!el) return;

    if (el.scrollHeight <= el.clientHeight + 1) return;

    setIsMouseDown(true);
    setIsDragging(false);
    setLastY(e.clientY);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !isMouseDown) return;

    const deltaY = e.clientY - lastY;

    if (!isDragging) {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) {
        return;
      }

      if (Math.abs(deltaY) < 5) {
        return;
      }

      setIsDragging(true);
      el.style.cursor = "grabbing";
      el.style.userSelect = "none";
    }

    el.scrollTop -= deltaY;
    setLastY(e.clientY);
    e.preventDefault();
  };

  const stopDrag = () => {
    const el = ref.current;
    setIsMouseDown(false);
    setIsDragging(false);
    if (el) {
      el.style.cursor = "";
      el.style.userSelect = "";
    }
  };

  return (
    <div
      ref={ref}
      className="overflow-y-auto scrollbar-custom"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
    >
      {children}
    </div>
  );
}
