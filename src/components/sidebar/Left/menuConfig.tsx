import {
  Award,
  Bell,
  History,
  House,
  MessageCircle,
  Search,
  User,
} from "lucide-react";
import Svg from "@/assets/svg/Svg";

export type MenuItem = {
  title: string;
  icon: React.ReactNode;
  url: string;
};

export const MENU_ITEMS: MenuItem[] = [
  { title: "홈", icon: <House />, url: "/" },
  { title: "검색", icon: <Search />, url: "search" },
  { title: "알림", icon: <Bell />, url: "notify" },
  { title: "채팅", icon: <MessageCircle />, url: "message" },
  { title: "프로필", icon: <User />, url: "profile" },
  { title: "조회 내역", icon: <History />, url: "views" },
  { title: "이펙트 상점", icon: <Award />, url: "shop" },
  {
    title: "게시글 작성",
    icon: <Svg icon="write" display="lg" />,
    url: "write",
  },
  {
    title: "GPT",
    icon: <Svg icon="GPT" display="lg" />,
    url: "https://chatgpt.com/",
  },
  {
    title: "Gemini",
    icon: <Svg icon="Gemini" display="lg" />,
    url: "https://gemini.google.com/",
  },
];
