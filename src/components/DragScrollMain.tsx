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

  // [추가] 1. 스크롤 복원 타이머를 참조할 ref
  const restoreTimerRef = useRef<NodeJS.Timeout | null>(null);

  // [추가] 2. 스크롤 복원 루프를 중단시키는 함수
  const cancelRestoreLoop = () => {
    if (restoreTimerRef.current) {
      clearTimeout(restoreTimerRef.current);
      restoreTimerRef.current = null;
    }
  };

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
      cancelRestoreLoop(); // [추가] 페이지 이동 전에도 혹시 모를 루프 중단
      const key = getKey();
      sessionStorage.setItem(key, scrollEl.scrollTop.toString());
    };

    const restoreScrollPosition = () => {
      cancelRestoreLoop(); // [추가] 새 복원 시작 전, 이전 루프 중단

      const key = getKey();
      const savedPosition = sessionStorage.getItem(key);
      
      if (savedPosition) {
        const scrollPos = parseInt(savedPosition, 10);
        if (isNaN(scrollPos)) return;

        const attemptRestore = (attempts = 0) => {
          // [개선] 1. 시도 횟수 감소 (30 -> 10)
          if (attempts > 10) { 
            restoreTimerRef.current = null;
            return;
          }

          scrollEl.scrollTo(0, scrollPos);
          
          // [개선] 2. 시도 횟수 및 간격 감소 (100ms -> 50ms)
          if (scrollEl.scrollTop !== scrollPos && attempts < 10) {
            // [수정] 3. 타이머 ID를 ref에 저장
            restoreTimerRef.current = setTimeout(() => attemptRestore(attempts + 1), 50);
          } else {
            restoreTimerRef.current = null;
          }
        };
        
        // [수정] 3. 타이머 ID를 ref에 저장
        restoreTimerRef.current = setTimeout(attemptRestore, 50); 
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
      cancelRestoreLoop(); // [추가] 컴포넌트 언마운트 시 루프 중단
    };
  }, [pathname, searchParams]); 

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    cancelRestoreLoop(); // [추가] 4. 드래그 시작 시 스크롤 복원 중단

    if (e.button !== 0) return;
    const el = ref.current;
    if (!el) return;

    if (el.scrollHeight <= el.clientHeight + 1) return;

    setIsMouseDown(true);
    setIsDragging(false);
    setLastY(e.clientY);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    // ... (기존 로직 동일) ...
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
    // ... (기존 로직 동일) ...
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
      onWheel={cancelRestoreLoop} // [추가] 4. 네이티브 스크롤(휠) 시 복원 중단
    >
      {children}
    </div>
  );
}
// "use client";

// import { useRef, useState, MouseEvent, useEffect } from "react";
// import { usePathname, useSearchParams } from 'next/navigation';

// export default function DragScrollMain({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const ref = useRef<HTMLDivElement | null>(null);

//   const [isMouseDown, setIsMouseDown] = useState(false);
//   const [isDragging, setIsDragging] = useState(false);
//   const [lastY, setLastY] = useState(0);

//   const pathname = usePathname();
//   const searchParams = useSearchParams();

//   useEffect(() => {
//     const scrollEl = ref.current;
//     if (!scrollEl) return;

//     if ('scrollRestoration' in window.history) {
//       window.history.scrollRestoration = 'manual';
//     }

//     const getKey = () => {
//       const paramsString = searchParams?.toString();
//       return `scroll-pos-${pathname}${paramsString ? `?${paramsString}` : ''}`;
//     };

//     const saveScrollPosition = () => {
//       const key = getKey();
//       sessionStorage.setItem(key, scrollEl.scrollTop.toString());
//     };

//     const restoreScrollPosition = () => {
//       const key = getKey();
//       const savedPosition = sessionStorage.getItem(key);
      
//       if (savedPosition) {
//         const scrollPos = parseInt(savedPosition, 10);
//         if (isNaN(scrollPos)) return;

//         const attemptRestore = (attempts = 0) => {
//           if (attempts > 30) return;

//           scrollEl.scrollTo(0, scrollPos);
          
//           if (scrollEl.scrollTop !== scrollPos && attempts < 30) {
//             setTimeout(() => attemptRestore(attempts + 1), 100);
//           }
//         };
        
//         setTimeout(attemptRestore, 100);
//       }
//     };

//     const handleLinkClick = (e: MouseEvent) => {
//       const target = e.target as HTMLElement;
//       const link = target.closest('a');
      
//       if (link && link.href && link.href.startsWith(window.location.origin)) {
//         saveScrollPosition();
//       }
//     };
    
//     const handleLinkClickGlobal = (e: Event) => handleLinkClick(e as unknown as MouseEvent);

//     const handleBeforeUnload = () => {
//       saveScrollPosition();
//     };

//     document.addEventListener('click', handleLinkClickGlobal, true);
//     window.addEventListener('beforeunload', handleBeforeUnload);

//     restoreScrollPosition();

//     return () => {
//       document.removeEventListener('click', handleLinkClickGlobal, true);
//       window.removeEventListener('beforeunload', handleBeforeUnload);
//     };
//   }, [pathname, searchParams]); 
//   const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
//     if (e.button !== 0) return;
//     const el = ref.current;
//     if (!el) return;

//     if (el.scrollHeight <= el.clientHeight + 1) return;

//     setIsMouseDown(true);
//     setIsDragging(false);
//     setLastY(e.clientY);
//   };

//   const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
//     const el = ref.current;
//     if (!el || !isMouseDown) return;

//     const deltaY = e.clientY - lastY;

//     if (!isDragging) {
//       const selection = window.getSelection();
//       if (selection && selection.toString().length > 0) {
//         return;
//       }

//       if (Math.abs(deltaY) < 5) {
//         return;
//       }

//       setIsDragging(true);
//       el.style.cursor = "grabbing";
//       el.style.userSelect = "none";
//     }

//     el.scrollTop -= deltaY;
//     setLastY(e.clientY);
//     e.preventDefault();
//   };

//   const stopDrag = () => {
//     const el = ref.current;
//     setIsMouseDown(false);
//     setIsDragging(false);
//     if (el) {
//       el.style.cursor = "";
//       el.style.userSelect = "";
//     }
//   };

//   return (
//     <div
//       ref={ref}
//       className="overflow-y-auto scrollbar-custom"
//       onMouseDown={handleMouseDown}
//       onMouseMove={handleMouseMove}
//       onMouseUp={stopDrag}
//       onMouseLeave={stopDrag}
//     >
//       {children}
//     </div>
//   );
// }
