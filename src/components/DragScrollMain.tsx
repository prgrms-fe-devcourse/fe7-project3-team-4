"use client";

import { useRef, useState, MouseEvent, useEffect } from "react";
import { usePathname, useSearchParams } from 'next/navigation';

export default function DragScrollMain({
  children,
}: {
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lastY, setLastY] = useState(0);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const scrollEl = ref.current;
    if (!scrollEl) return;

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const getKey = () => {
      const paramsString = searchParams?.toString();
      return `scroll-pos-${pathname}${paramsString ? `?${paramsString}` : ''}`;
    };

    const saveScrollPosition = () => {
      const key = getKey();
      sessionStorage.setItem(key, scrollEl.scrollTop.toString());
    };

    const restoreScrollPosition = () => {
      const key = getKey();
      const savedPosition = sessionStorage.getItem(key);
      
      if (savedPosition) {
        const scrollPos = parseInt(savedPosition, 10);
        if (isNaN(scrollPos)) return;

        const attemptRestore = (attempts = 0) => {
          if (attempts > 30) return;

          scrollEl.scrollTo(0, scrollPos);
          
          if (scrollEl.scrollTop !== scrollPos && attempts < 30) {
            setTimeout(() => attemptRestore(attempts + 1), 100);
          }
        };
        
        setTimeout(attemptRestore, 100);
      }
    };

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && link.href.startsWith(window.location.origin)) {
        saveScrollPosition();
      }
    };
    
    const handleLinkClickGlobal = (e: Event) => handleLinkClick(e as unknown as MouseEvent);

    const handleBeforeUnload = () => {
      saveScrollPosition();
    };

    document.addEventListener('click', handleLinkClickGlobal, true);
    window.addEventListener('beforeunload', handleBeforeUnload);

    restoreScrollPosition();

    return () => {
      document.removeEventListener('click', handleLinkClickGlobal, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pathname, searchParams]); 
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
