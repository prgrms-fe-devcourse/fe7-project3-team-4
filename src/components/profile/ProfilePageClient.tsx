"use client";

import { useState } from "react";
import { ProfileActivityTabs } from "@/components/profile/ProfileActivityTabs";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileEditModal } from "@/components/profile/ProfileEditModal";

const MOCKUP_POSTS: Post[] = [
  {
    id: 3,
    type: "prompt",
    model: "Gemini",
    author: "yeon.codes",
    email: "yeon@algo.dev",
    createdAt: "2025-11-08T09:05:00+09:00",
    title: "[UI] 글래스모피즘 대시보드 한 번에 뽑기",
    content:
      "“글래스모피즘 카드 4개와 상단 요약 영역을 가진, 밝은 톤의 SaaS 대시보드 레이아웃을 Tailwind 코드와 함께 제안해줘.”",
    hashtags: ["#UI프롬프트", "#Glassmorphism", "#Tailwind"],
    likes: 56,
    comments: 12,
    isBookmarked: true,
  },
  {
    id: 4,
    type: "prompt",
    model: "GPT",
    author: "frontend-owl",
    email: "owl@algo.dev",
    createdAt: "2025-11-06T18:44:00+09:00",
    title: "[Dev] Next.js 캐싱 전략 설명 프롬프트",
    content:
      "“CSR, SSR, SSG, ISR 차이를 시니어 프론트엔드 면접 수준으로 예시와 함께 설명해줘. 표와 코드 샘플도 포함해줘.”",
    hashtags: ["#Nextjs", "#면접준비", "#캐싱"],
    likes: 24,
    comments: 3,
    isBookmarked: false,
  },
  {
    id: 5,
    type: "free",
    author: "moonlight",
    email: "moon@algo.community",
    createdAt: "2025-11-08T00:22:00+09:00",
    title: "오늘의 실패: 프롬프트를 너무 길게 써버렸다",
    content:
      "LLM이 중간에 요약해버려서 중요한 조건이 날아갔어요. 핵심 조건은 bullet로 먼저 정리하는 게 좋더라구요.",
    hashtags: ["#프롬프트팁", "#실패공유"],
    likes: 17,
    comments: 4,
    isBookmarked: false,
  },
  {
    id: 6,
    type: "free",
    author: "glassdev",
    email: "glass@algo.community",
    createdAt: "2025-11-07T14:10:00+09:00",
    title: "다들 Gemini랑 GPT 어떤 비율로 쓰세요?",
    content:
      "UI는 Gemini, 알고리즘 문제 해설은 GPT 위주로 쓰는 중인데, 여러분 워크플로우도 궁금합니다.",
    hashtags: ["#툴사용법", "#GPT", "#Gemini"],
    likes: 29,
    comments: 11,
    isBookmarked: true,
  },
  {
    id: 7,
    type: "weekly",
    model: "이미지",
    author: "ALGO Weekly Bot",
    email: "weekly@algo.news",
    createdAt: "2025-11-03T09:00:00+09:00",
    title: "W44: 프롬프트 실험 TOP 5 & AI 업데이트 요약",
    content:
      "이번 주 인기 프롬프트, Gemini/GPT 주요 업데이트, 그리고 커뮤니티에서 많이 저장된 인사이트를 모아봤어요.",
    image:
      "https://cdn.pixabay.com/photo/2024/09/28/20/09/city-9082149_640.jpg",
    hashtags: ["#Weekly", "#업데이트요약"],
    likes: 64,
    comments: 9,
    isBookmarked: true,
  },
  {
    id: 8,
    type: "weekly",
    model: "텍스트",
    author: "ALGO Weekly Bot",
    email: "weekly@algo.news",
    createdAt: "2025-10-27T09:00:00+09:00",
    title: "W43: 한국어 프롬프트 베스트 컬렉션",
    content:
      "실제 서비스 개발에 사용된 한국어 프롬프트 10개를 선별해 정리했습니다.",
    hashtags: ["#Weekly", "#한국어프롬프트"],
    likes: 51,
    comments: 6,
    isBookmarked: false,
  },
  {
    id: 10,
    type: "prompt",
    model: "GPT",
    author: "algo-admin",
    email: "admin@algo.dev",
    createdAt: "2025-11-08T11:00:00+09:00",
    title: "[CS] 정보처리기사 실기 대비 자동 문제 세트 생성",
    content:
      "“정보처리기사 실기 2025 기준으로, 관계형 DB/네트워크/보안/알고리즘 파트를 섞어 20문항 실전 모의고사를 만들어줘. 정답과 해설도 포함해.”",
    hashtags: ["#자격증", "#GPT프롬프트", "#문제생성"],
    likes: 48,
    comments: 10,
    isBookmarked: true,
  },
];

export default function ProfilePageClient() {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <div className="relative">
        <ProfileHeader onEditClick={() => setIsEditOpen(true)} />
        <ProfileActivityTabs posts={MOCKUP_POSTS} />
      </div>

      <ProfileEditModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
    </>
  );
}
