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
    if (e.button !== 0) return; // 왼쪽 클릭만
    const el = ref.current;
    if (!el) return;

    // 스크롤할 내용이 없으면 드래그 비활성
    if (el.scrollHeight <= el.clientHeight + 1) return;

    setIsMouseDown(true);
    setIsDragging(false);
    setLastY(e.clientY);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !isMouseDown) return;

    const deltaY = e.clientY - lastY;

    // 아직 드래그 시작 전: 살짝 흔들리는 건 무시
    if (!isDragging) {
      if (Math.abs(deltaY) < 3) return;

      // 여기서부터 "드래그 시작"
      setIsDragging(true);
      el.style.cursor = "grabbing";
      el.style.userSelect = "none";
    }

    // 드래그 중일 때만 스크롤 이동
    if (isDragging) {
      el.scrollTop -= deltaY;
      setLastY(e.clientY);
      e.preventDefault();
    }
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
