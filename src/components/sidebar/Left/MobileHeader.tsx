import Link from "next/link";
import {
  History,
  LogIn,
  LogOut,
  MessageCircle,
  Search,
  TextAlignJustify,
  User,
} from "lucide-react";
import Write from "@/assets/svg/Write";
import GPT from "@/assets/svg/GPT";
import Gemini from "@/assets/svg/Gemini";
import MenuBtn from "./MenuBtn";

type MobileHeaderProps = {
  isLogin: boolean;
  clickMenu: boolean;
  onToggleMenu: () => void;
  onLogout: () => void;
};

export function MobileHeader({
  isLogin,
  clickMenu,
  onToggleMenu,
  onLogout,
}: MobileHeaderProps) {
  return (
    <header className="lg:hidden z-99 fixed min-w-full bg-white">
      <div className="relative w-full">
        <div className="p-4 flex justify-between border-b border-[#EAEAEC]">
          <div>
            <Link href={"/"}>
              <div className="w-9 h-9 bg-gray-500">{/* <Logo /> */}</div>
            </Link>
          </div>
          <button onClick={onToggleMenu}>
            <TextAlignJustify />
          </button>
        </div>
        {clickMenu ? (
          <nav className="absolute top-[68px] w-full ">
            <ul className="text-sm m-1 p-1 rounded-2xl bg-white shadow-xl">
              <div className="py-0.5">
                <MenuBtn
                  icon={<Search size={20} />}
                  title="검색"
                  url="search"
                  size="sm"
                  onClick={() => setClickMenu(false)} // 메뉴 닫기
                />
                <MenuBtn
                  icon={<MessageCircle size={20} />}
                  title="채팅"
                  url="message"
                  size="sm"
                  onClick={() => setClickMenu(false)}
                />
              </div>

              <div className="py-0.5 border-y border-[#EAEAEC]">
                <MenuBtn
                  icon={<User size={20} />}
                  title="프로필"
                  url="profile"
                  size="sm"
                  onClick={onToggleMenu}
                />
                <MenuBtn
                  icon={<History size={20} />}
                  title="조회 내역"
                  url="views"
                  size="sm"
                  onClick={onToggleMenu}
                />
              </div>

              <div className="py-0.5">
                <MenuBtn
                  icon={<Write display="Mobile" />}
                  title="새 게시글 작성"
                  url="write"
                  size="sm"
                  onClick={onToggleMenu}
                />
                <MenuBtn
                  icon={<GPT display="Mobile" />}
                  title="GPT 사이트로 이동"
                  url="https://chatgpt.com/"
                  size="sm"
                  onClick={onToggleMenu}
                />
                <MenuBtn
                  icon={<Gemini display="Mobile" />}
                  title="Gemini 사이트로 이동"
                  url="https://gemini.google.com/"
                  size="sm"
                  onClick={onToggleMenu}
                />
              </div>
              <div className="py-0.5 border-y border-[#EAEAEC]">
                <li className="rounded-lg py-2 px-2.5 flex flex-row items-center active:bg-[#ececec]">
                  {!isLogin ? (
                    <Link
                      href={"auth/login"}
                      className="flex items-center flex-1 gap-2.5"
                    >
                      <LogIn size={20} />
                      <span>로그인</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={onLogout}
                      className="cursor-pointer flex items-center flex-1 gap-2.5"
                    >
                      <LogOut size={20} />
                      <span>로그아웃</span>
                    </button>
                  )}
                </li>
                <li className="rounded-lg py-2 px-2.5 flex flex-row gap-2.5 items-center active:bg-[#ececec]">
                  {/* TODO: 여기 다크모드 토글 아이콘/텍스트로 바꾸기 */}
                  <Gemini display="Mobile" />
                  <span>다크모드</span>
                </li>
              </div>
            </ul>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
