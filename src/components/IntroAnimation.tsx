"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { TextPlugin } from "gsap/TextPlugin";

gsap.registerPlugin(TextPlugin);

interface DialogLine {
  text: string;
  duration: number;
  pause: number;
}

export default function IntroAnimation() {
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLHeadingElement>(null);

  const handleStartApp = () => {
    gsap.to(mainRef.current, {
      opacity: 0,
      duration: 0.7,
      ease: "power2.in",
      onComplete: () => setIsAnimationComplete(true),
    });
  };

  useEffect(() => {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = "0px";
    };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const dialogContent: DialogLine[] = [
        {
          text: "시스템 준비 완료... 환영합니다. 프롬프터.",
          duration: 1.5,
          pause: 1.0,
        },
        {
          text: "당신의 다음 질문은 무엇인가요? Algo가 기다리고 있습니다.",
          duration: 2.0,
          pause: 1.0,
        },
        {
          text: "가장 지혜로운 프롬프트를 찾아 떠나 볼까요?",
          duration: 1.8,
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

        const isLast = index === dialogContent.length - 1;

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
              opacity: isLast ? 1 : 0,
              duration: 0.3,
              ease: "power1.in",
            },
            `>+=${content.pause}`
          );
      });

      tl.fromTo(
        ".final-title",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power2.out",
        },
        ">"
      ).fromTo(
        ".final-button",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power2.out",
        },
        "<+0.2"
      );
    }, mainRef);

    return () => ctx.revert();
  }, []);

  if (isAnimationComplete) {
    return null;
  }

  return (
    <div
      ref={mainRef}
      className="fixed inset-0 z-50 flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gray-950 text-white"
    >
      <div className="intro-background absolute inset-0 z-0 bg-gray-950"></div>

      <div className="z-10 flex flex-col items-center justify-center text-center p-4">
        <h1
          ref={counterRef}
          className="counter text-8xl font-light text-gray-200"
        >
          0%
        </h1>

        <div className="relative min-h-[150px] w-full">
          <p className="dialog-text dialog-1 absolute left-0 right-0 top-1/2 -translate-y-1/2 text-lg text-gray-300 opacity-0 md:text-xl">
            &nbsp;
          </p>
          <p className="dialog-text dialog-2 absolute left-0 right-0 top-1/2 -translate-y-1/2 text-lg text-gray-300 opacity-0 md:text-xl">
            &nbsp;
          </p>
          <p className="dialog-text dialog-3 absolute left-0 right-0 top-1/2 -translate-y-1/2 text-lg text-gray-300 opacity-0 md:text-xl">
            &nbsp;
          </p>
        </div>

        <h2 className="final-title mt-10 text-4xl font-extrabold text-white opacity-0 md:text-5xl">
          AI 프롬프트 & 결과물 커뮤니티
        </h2>
        <button
          onClick={handleStartApp}
          className="final-button mt-10 cursor-pointer rounded-xl bg-indigo-600 px-8 py-3 text-lg font-bold text-white opacity-0 transition-all duration-300 hover:bg-indigo-500 hover:ring-2 hover:ring-indigo-500 hover:ring-offset-2 hover:ring-offset-gray-950"
        >
          Algo 시작하기
        </button>
      </div>
    </div>
  );
}
