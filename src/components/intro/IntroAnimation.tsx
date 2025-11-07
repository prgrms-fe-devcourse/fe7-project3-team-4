"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { TextPlugin } from "gsap/TextPlugin";
import { Zap } from "lucide-react";
gsap.registerPlugin(TextPlugin);

interface DialogLine {
  text: string;
  duration: number;
  pause: number;
}

const STORAGE_KEY = "algoIntroSeen";

export default function IntroAnimation() {
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);

  const [isVisible, setIsVisible] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLHeadingElement>(null);
  const handleStartApp = () => {
    gsap.to(mainRef.current, {
      scale: 0.95,
      filter: "blur(10px)",
      opacity: 0,
      duration: 0.7,
      ease: "power3.in",
      onComplete: () => {
        try {
          localStorage.setItem(STORAGE_KEY, "true");
        } catch (error) {
          console.error("localStorage 저장 실패:", error);
        }
        setIsAnimationComplete(true);
      },
    });
  };

  useEffect(() => {
    const timerId = setTimeout(() => {
      try {
        const hasSeenIntro = localStorage.getItem(STORAGE_KEY);
        if (hasSeenIntro === "true") {
          setIsAnimationComplete(true);
        } else {
          setIsVisible(true);
          const scrollbarWidth =
            window.innerWidth - document.documentElement.clientWidth;
          document.body.style.overflow = "hidden";
          document.body.style.paddingRight = `${scrollbarWidth}px`;
        }
      } catch (error) {
        console.error("localStorage 접근 실패:", error);
        setIsVisible(true);
      }
    }, 0);

    return () => {
      clearTimeout(timerId);
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
      const counterEl = counterRef.current;
      const tl = gsap.timeline();
      const counter = { value: 0 };
      tl.to(counter, {
        value: 100,
        duration: 2.5,
        ease: "power2.out",
        onUpdate: () => {
          if (counterEl) {
            counterEl.textContent = `${Math.round(counter.value)}%`;
          }
        },
      }).to(
        counterEl,
        {
          scale: 0.8,
          opacity: 0,
          duration: 0.4,
          ease: "power1.in",
        },
        ">-0.5"
      );
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
              opacity: 0, //
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
            duration: 1.0,
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
            duration: 1.0,
            ease: "expo.out",
          },
          "<+0.2"
        );
    }, mainRef);

    return () => ctx.revert();
  }, [isVisible]);

  if (isAnimationComplete || !isVisible) {
    return null;
  }

  return (
    <div
      ref={mainRef}
      className="fixed inset-0 z-50 flex h-full w-full flex-col items-center justify-center overflow-hidden bg-black text-neutral-100 font-sans"
    >
      <div className="z-10 flex flex-col items-center justify-center text-center p-4">
        <h1
          ref={counterRef}
          className="counter text-9xl font-thin text-neutral-300"
        >
          0%
        </h1>
        <div className="relative min-h-[180px] w-full">
          <p className="dialog-text dialog-1 absolute left-0 right-0 top-1/2 -translate-y-1/2 text-xl font-medium text-neutral-400 opacity-0 md:text-2xl">
            &nbsp;
          </p>
          <p className="dialog-text dialog-2 absolute left-0 right-0 top-1/2 -translate-y-1/2 text-xl font-medium text-neutral-400 opacity-0 md:text-2xl">
            &nbsp;
          </p>
          <p className="dialog-text dialog-3 absolute left-0 right-0 top-1/2 -translate-y-1/2 text-xl font-medium text-neutral-400 opacity-0 md:text-2xl">
            &nbsp;
          </p>
          <div className="final-icon absolute left-0 right-0 top-[calc(30%)] -translate-y-1/2 opacity-0">
            <Zap size={180} className="mx-auto text-[#6758FF]" />
          </div>
        </div>
        <h2 className="final-title mt-10 text-4xl font-extrabold text-neutral-100 opacity-0 md:text-5xl">
          AI 프롬프트 & 결과물 커뮤니티
        </h2>
        <button
          onClick={handleStartApp}
          className="final-button mt-10 cursor-pointer rounded-full bg-[#6758FF] px-8 py-3 text-lg font-semibold text-white opacity-0 transition-all duration-300 hover:opacity-90 hover:scale-105"
        >
          Algo 시작하기
        </button>
      </div>
    </div>
  );
}
