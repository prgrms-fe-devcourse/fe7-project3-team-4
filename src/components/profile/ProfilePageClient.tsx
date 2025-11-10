"use client";

import { useState } from "react";
import { ProfileActivityTabs } from "@/components/profile/ProfileActivityTabs";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileEditModal } from "@/components/profile/ProfileEditModal";
import { ImgEditModal } from "./ImgEditModal";

const MOCKUP_POSTS: Post[] = [
  // [수정] 'news' 타입 Mock 데이터는 제거해도 됩니다 (ID: 1, 2, 9).
  // 여기서는 편의상 그대로 두되, 'all' 탭에서만 사용합니다.

  {
    id: "1",
    comment_count: 5,
    content:
      "const [state, setState] = useState(initialState);\n// React에서 상태를 관리하는 가장 기본적인 방법입니다.\n// ... (더 많은 예시 코드)",
    created_at: "2025-11-01T10:00:00Z",
    updated_at: "2025-11-01T12:30:00Z",
    like_count: 15,
    post_type: "prompt",
    title: "React state 관리 마스터 프롬프트",
    user_id: "user_abc_123",
    view_count: 102,
    email: "react_master@example.com",
    image:
      "https://cdn.pixabay.com/photo/2025/11/05/20/57/monastery-9939590_1280.jpg",
    hashtags: ["React", "JavaScript", "Frontend", "StateManagement"],
    isBookmarked: true,
    model: "GPT",
  },
  {
    id: "2",
    comment_count: 2,
    content:
      "Next.js 14 버전에서 ISR을 설정하는 방법입니다. revalidate 옵션을 사용하세요...",
    created_at: "2025-11-02T14:20:00Z",
    like_count: 8,
    post_type: "free",
    title: "Next.js ISR 질문 있습니다.",
    user_id: "user_def_456",
    view_count: 55,
    email: "next_fan@example.com",
    hashtags: ["NextJS", "ISR", "WebDev"],
    isBookmarked: false,
    model: "Gemini",
  },
  {
    id: "3",
    comment_count: 10,
    content:
      "가장 효율적인 피보나치 수열 알고리즘을 작성하는 챌린지입니다. 재귀, DP, 반복문 등 다양한 방법을 시도해보세요.",
    created_at: "2025-11-03T09:00:00Z",
    like_count: 25,
    post_type: "weekly",
    title: "챌린지: 피보나치 수열 최적화",
    user_id: "user_ghi_789",
    view_count: 230,
    email: "algo_king@example.com",
    image:
      "https://cdn.pixabay.com/photo/2025/11/05/20/57/monastery-9939590_1280.jpg",
    hashtags: ["Algorithm", "Challenge", "DP", "Optimization"],
    isBookmarked: true,
  },
  {
    id: "4",
    comment_count: 0,
    content:
      "Gemini API를 사용하여 실시간 번역 기능을 구현하는 프롬프트를 공유합니다. 'Translate this text to [Language]: [Text]'...",
    created_at: "2025-11-04T11:00:00Z",
    like_count: 12,
    post_type: "prompt",
    title: "Gemini 실시간 번역 프롬프트",
    user_id: "user_jkl_101",
    view_count: 80,
    email: "gemini_dev@example.com",
    hashtags: ["Gemini", "AI", "Translation", "API"],
    isBookmarked: false,
    model: "Gemini",
  },
  {
    id: "5",
    comment_count: 3,
    content:
      "Supabase RLS 설정하다가 막혔는데, authenticated 유저에게만 'select' 권한을 주려면 어떻게 해야 하나요?",
    created_at: "2025-11-05T16:45:00Z",
    like_count: 4,
    post_type: "free",
    title: "Supabase RLS 관련 질문",
    user_id: "user_mno_202",
    view_count: 60,
    email: "supabase_newbie@example.com",
    hashtags: ["Supabase", "Database", "RLS", "Auth"],
    isBookmarked: false,
  },
  {
    id: "6",
    comment_count: 7,
    content:
      "'당신은 10년차 시니어 개발자입니다. 주니어 개발자의 코드 리뷰를 도와주세요.' 이 프롬프트 하나면 코드 퀄리티가 달라집니다.",
    created_at: "2025-11-06T08:30:00Z",
    like_count: 30,
    post_type: "prompt",
    title: "코드 리뷰 효율 올려주는 GPT 페르소나",
    user_id: "user_pqr_303",
    view_count: 175,
    email: "senior_dev@example.com",
    image:
      "https://cdn.pixabay.com/photo/2024/09/28/20/09/city-9082149_640.jpg",
    hashtags: ["GPT", "CodeReview", "Persona", "Productivity"],
    isBookmarked: true,
    model: "GPT",
  },
  {
    id: "7",
    comment_count: 1,
    content:
      "Tailwind CSS로 다크 모드 구현하는 가장 쉬운 방법은 무엇일까요? `dark:` 클래스를 사용하는 것 외에 팁이 있나요?",
    created_at: "2025-11-07T13:10:00Z",
    updated_at: "2025-11-07T13:15:00Z",
    like_count: 6,
    post_type: "free",
    title: "Tailwind 다크 모드 질문",
    user_id: "user_stu_404",
    view_count: 45,
    email: "css_lover@example.com",
    hashtags: ["TailwindCSS", "CSS", "DarkMode"],
    isBookmarked: false,
  },
  {
    id: "8",
    comment_count: 15,
    content:
      "주어진 이미지 URL을 분석하여 이미지의 주요 색상 팔레트를 JSON 형태로 반환하는 AI 프롬프트를 작성해보세요.",
    created_at: "2025-11-08T10:00:00Z",
    like_count: 22,
    post_type: "weekly",
    title: "챌린지: 이미지 색상 추출 프롬프트",
    user_id: "user_vwx_505",
    view_count: 190,
    email: "design_ai@example.com",
    hashtags: ["AI", "ImageProcessing", "JSON", "Challenge", "Gemini"],
    isBookmarked: true,
    model: "Gemini",
  },
];

export default function ProfilePageClient() {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditImgOpen, setIsEditImgOpen] = useState(false);

  return (
    <>
      <div className="relative">
        <ProfileHeader
          onAvatarClick={() => setIsEditImgOpen(true)}
          onEditClick={() => setIsEditProfileOpen(true)}
        />
        <ProfileActivityTabs posts={MOCKUP_POSTS} />
      </div>

      <ProfileEditModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />

      <ImgEditModal
        isOpen={isEditImgOpen}
        onClose={() => setIsEditImgOpen(false)}
      />
    </>
  );
}
