import Link from "next/link";
import {
  Bell,
  History,
  LogIn,
  LogOut,
  MessageCircle,
  Moon,
  Search,
  Sun,
  TextAlignJustify,
  User,
  X,
} from "lucide-react";
import MenuBtn from "./MenuBtn";
import Svg from "@/assets/svg/Svg";
import { Dispatch, SetStateAction } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";

type MobileHeaderProps = {
  isLogin: boolean;
  clickMenu: boolean;
  setClickMenu: Dispatch<SetStateAction<boolean>>;
  unreadCount: number;
  unreadMessageCount: number;
  onToggleMenu: () => void;
  onLogout: () => void;
};

export function MobileHeader({
  isLogin,
  clickMenu,
  setClickMenu,
  unreadCount,
  unreadMessageCount,
  onToggleMenu,
  onLogout,
}: MobileHeaderProps) {
  const { isDark, toggleTheme } = useTheme();
  const closeMenu = () => setClickMenu(false);
  return (
    <header className="lg:hidden z-99 fixed min-w-full bg-white dark:bg-white/20">
      <div className="relative w-full">
        <div className="p-4 flex justify-between border-b border-[#EAEAEC] dark:border-[#EAEAEC]/20">
          <div>
            <Link href={"/"} onClick={closeMenu}>
              {/* 로고 */}
              <div className="w-9 h-9 bg-gray-500"></div>
            </Link>
          </div>
          <div className="flex gap-2">
            <MenuBtn
              icon={<Bell />}
              title="알림"
              url="notify"
              size="md"
              onClick={closeMenu}
              notificationCount={unreadCount}
            />
            <button className="cursor-pointer" onClick={onToggleMenu}>
              {clickMenu ? <X /> : <TextAlignJustify />}
            </button>
          </div>
        </div>
        {clickMenu ? (
          <nav className="absolute top-[68px] w-full ">
            <ul className="text-sm rounded-b-2xl bg-white shadow-xl pb-0.5 dark:bg-[#2c2c2c]">
              <div className="p-1 space-y-1.5">
                <div className="cursor-pointer rounded-lg hover:bg-[#ececec] active:bg-[#ececec] dark:hover:bg-[#575757] dark:active:bg-[#575757]">
                  <MenuBtn
                    icon={<Search size={20} />}
                    title="검색"
                    url="search"
                    size="md"
                    onClick={closeMenu}
                  />
                </div>
                <div className="cursor-pointer rounded-lg hover:bg-[#ececec] active:bg-[#ececec] dark:hover:bg-[#575757] dark:active:bg-[#575757]">
                  <MenuBtn
                    icon={<MessageCircle size={20} />}
                    title="채팅"
                    url="message"
                    size="md"
                    onClick={closeMenu}
                    notificationCount={unreadMessageCount}
                  />
                </div>
              </div>

              <div className="p-1 space-y-1.5 border-y border-[#EAEAEC]">
                <div className="cursor-pointer rounded-lg hover:bg-[#ececec] active:bg-[#ececec] dark:hover:bg-[#575757] dark:active:bg-[#575757]">
                  <MenuBtn
                    icon={<User size={20} />}
                    title="프로필"
                    url="profile"
                    size="md"
                    onClick={closeMenu}
                  />
                </div>
                <div className="cursor-pointer rounded-lg hover:bg-[#ececec] active:bg-[#ececec] dark:hover:bg-[#575757] dark:active:bg-[#575757]">
                  <MenuBtn
                    icon={<History size={20} />}
                    title="조회 내역"
                    url="views"
                    size="md"
                    onClick={closeMenu}
                  />
                </div>
              </div>

              <div className="p-1 space-y-1.5">
                <div className="cursor-pointer rounded-lg hover:bg-[#ececec] active:bg-[#ececec] dark:hover:bg-[#575757] dark:active:bg-[#575757]">
                  <MenuBtn
                    icon={<Svg icon="write" display="md" />}
                    title="새 게시글 작성"
                    url="write"
                    size="md"
                    onClick={closeMenu}
                  />
                </div>
                <div className="cursor-pointer rounded-lg hover:bg-[#ececec] active:bg-[#ececec] dark:hover:bg-[#575757] dark:active:bg-[#575757]">
                  <MenuBtn
                    icon={<Svg icon="GPT" display="md" />}
                    title="GPT 사이트로 이동"
                    url="https://chatgpt.com/"
                    size="md"
                    onClick={closeMenu}
                  />
                </div>
                <div className="cursor-pointer rounded-lg hover:bg-[#ececec] active:bg-[#ececec] dark:hover:bg-[#575757] dark:active:bg-[#575757]">
                  <MenuBtn
                    icon={<Svg icon="Gemini" display="md" />}
                    title="Gemini 사이트로 이동"
                    url="https://gemini.google.com/"
                    size="md"
                    onClick={closeMenu}
                  />
                </div>
              </div>
              <div className="p-1 space-y-1.5 border-t border-[#EAEAEC]">
                <li className="rounded-lg flex flex-row items-center hover:bg-[#ececec] active:bg-[#ececec] dark:hover:bg-[#575757] dark:active:bg-[#575757]">
                  {!isLogin ? (
                    <Link
                      href={"auth/login"}
                      className="flex items-center flex-1 gap-2.5 py-2 px-2.5"
                    >
                      <LogIn size={20} />
                      <span>로그인</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={onLogout}
                      className="cursor-pointer flex items-center flex-1 gap-2.5 py-2 px-2.5"
                    >
                      <LogOut size={20} />
                      <span>로그아웃</span>
                    </button>
                  )}
                </li>
                <li className="cursor-pointer rounded-lg hover:bg-[#ececec] active:bg-[#ececec] dark:hover:bg-[#575757] dark:active:bg-[#575757]">
                  {/* TODO: 여기 다크모드 토글 아이콘/텍스트로 바꾸기 */}
                  <button
                    onClick={toggleTheme}
                    className="py-2 px-2.5 flex flex-row items-center gap-2.5"
                  >
                    {!isDark ? (
                      <>
                        <Sun display="Mobile" size={20} />
                        <span>라이트모드</span>
                      </>
                    ) : (
                      <>
                        <Moon display="Mobile" size={20} />
                        <span>다크모드</span>
                      </>
                    )}
                  </button>
                </li>
              </div>
            </ul>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
