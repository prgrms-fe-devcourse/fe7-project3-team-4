import {
  Bell,
  History,
  House,
  MessageCircle,
  Search,
  User,
} from "lucide-react";
import Gemini from "@/assets/svg/Gemini";
import GPT from "@/assets/svg/GPT";
import Write from "@/assets/svg/Write";

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
  { title: "게시글 작성", icon: <Write display="PC" />, url: "write" },
  {
    title: "GPT",
    icon: <GPT display="PC" />,
    url: "https://chatgpt.com/",
  },
  {
    title: "Gemini",
    icon: <Gemini display="PC" />,
    url: "https://gemini.google.com/",
  },
];
