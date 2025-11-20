import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { TextPlugin } from "gsap/TextPlugin";
import MacbookIntro from "./MacbookIntro";
import PromptIntro from "./PromptIntro";
import LaserIntro from "./LaserIntro";
gsap.registerPlugin(TextPlugin);

interface DialogLine {
  text: string;
  duration: number;
  pause: number;
}

export default function IntroAnimation() {
  type Phase = "macbook" | "laser" | "done";

  const [phase, setPhase] = useState<Phase>("macbook");
  const STORAGE_KEY = "algoIntroSeen";

  // [수정됨] 깜빡임 방지를 위해 기본값을 '이미 완료됨(true)'으로 설정
  const [isAnimationComplete, setIsAnimationComplete] = useState(true);

  // [수정됨] 기본값을 '안 보임(false)'으로 설정
  const [isVisible, setIsVisible] = useState(false);

  const mainRef = useRef<HTMLDivElement>(null);

  const [isFadingOut, setIsFadingOut] = useState(false);
  const finishIntro = () => {
    if (isFadingOut) return;
    setIsFadingOut(true);

    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
    const target = mainRef.current;
    if (target) {
      gsap.to(target, {
        opacity: 0,
        duration: 0.8,
        ease: "power2.inOut",
        onComplete: () => {
          setIsAnimationComplete(true);
          setIsVisible(false);
          setPhase("done");
        },
      });
    } else {
      setIsAnimationComplete(true);
      setIsVisible(false);
      setPhase("done");
    }
  };

  const handleStartLaser = () => {
    const macbookElement = mainRef.current?.querySelector(".macbook-wrapper");

    const tl = gsap.timeline({
      onComplete: () => {
        setPhase("laser");
      },
    });

    if (macbookElement) {
      tl.to(macbookElement, {
        scale: 8,
        duration: 1.5,
        ease: "power3.inOut",
        transformOrigin: "50% 50%",
        opacity: 0,
      });
    } else {
      setPhase("laser");
    }
  };

  useEffect(() => {
    try {
      const hasSeenIntro = localStorage.getItem(STORAGE_KEY);

      // [수정됨] "true"가 아닐 경우(처음 방문)에만 상태를 변경하여 애니메이션 실행
      if (hasSeenIntro !== "true") {
        const scrollbarWidth =
          window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = "hidden";
        document.body.style.paddingRight = `${scrollbarWidth}px`;

        // 이때 비로소 보이게 설정
        setIsAnimationComplete(false);
        setIsVisible(true);
      }
      // 이미 본 사람(hasSeenIntro === "true")은
      // 초기값이 hidden/complete 상태이므로 아무것도 하지 않음 (깜빡임 없음)
    } catch (error) {
      console.error("localStorage 접근 실패:", error);
      // 에러 시 안전하게 보여주려면 여기서 true로 전환 고려 가능
    }

    return () => {
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = "0px";
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const ctx = gsap.context(() => {
      const dialogContent: DialogLine[] = [
        {
          text: "시스템 준비 완료... 환영합니다. 프롬프터.",
          duration: 1.0,
          pause: 1.0,
        },
        {
          text: "당신의 다음 질문은 무엇인가요? Algo가 기다리고 있습니다.",
          duration: 1.5,
          pause: 1.0,
        },
        {
          text: "가장 지혜로운 프롬프트를 찾아 떠나 볼까요?",
          duration: 1.3,
          pause: 0.5,
        },
      ];

      const dialogElements =
        gsap.utils.toArray<HTMLParagraphElement>(".dialog-text");
      const tl = gsap.timeline();
      dialogContent.forEach((content, index) => {
        const el = dialogElements[index];
        if (!el) return;
        tl.fromTo(
          el,
          { y: 15, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: "power3.out",
          },
          ">"
        )
          .to(
            el,
            {
              text: content.text,
              duration: content.duration,
              ease: "none",
            },
            "<+0.1"
          )
          .to(
            el,
            {
              opacity: 0,
              duration: 0.3,
              ease: "power1.in",
            },
            `>+=${content.pause}`
          );
      });

      tl.fromTo(
        ".final-icon",
        { y: 20, opacity: 0, scale: 0.8 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1.2,
          ease: "expo.out",
        },
        ">"
      )
        .fromTo(
          ".final-title",
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: "expo.out",
          },
          "<+0.2"
        )
        .fromTo(
          ".final-button",
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: "expo.out",
          },
          "<+0.2"
        );
    }, mainRef);
    return () => {
      ctx.revert();
    };
  }, [isVisible, phase]);

  useEffect(() => {
    if (!isVisible || isAnimationComplete) return;

    const delaySeconds = 7 * 0.4;

    const timer = gsap.delayedCall(delaySeconds, () => {
      handleStartLaser();
    });

    return () => {
      timer.kill();
    };
  }, [isVisible, isAnimationComplete]);

  if (isAnimationComplete || !isVisible) {
    return null;
  }

  if (phase === "done") {
    return null;
  }

  return (
    <div
      ref={mainRef}
      className="fixed inset-0 z-50 flex h-full w-full flex-col items-center justify-center overflow-hidden bg-black text-neutral-100 font-sans"
    >
      {phase === "macbook" && <MacbookIntro />}
      {phase === "laser" && (
        <>
          <LaserIntro onComplete={() => {}} />
          <PromptIntro onStartApp={finishIntro} />
        </>
      )}
    </div>
  );
}
