import { Trophy, Zap } from "lucide-react";
import { WeeklyModel } from "@/types/Post";
import Image from "next/image";
import img1 from "../../../assets/img/1.png";
import img2 from "../../../assets/img/2.png";
import img3 from "../../../assets/img/3.png";
import img4 from "../../../assets/img/4.png";
import img5 from "../../../assets/img/5.png";

type ChallengeContent = {
  shortTitle: string;
  description: string;
  examplePrompt: string;
  exampleResult: string;
};

const TEXT_CHALLENGES: ChallengeContent[] = [
  {
    shortTitle: "세상에서 가장 끔찍한 퓨전 요리",
    description:
      "AI 셰프와 함께 민트초코, 삭힌 홍어 등 절대 어울리지 않을 것 같은 재료들로 ‘세상에서 가장 끔찍한’ 퓨전 디저트 레시피를 만들어 보고, 그럴듯한 소개 문구까지 완성해 보세요!",
    examplePrompt:
      "너는 상상을 초월하는 퓨전 요리 셰프야. 민트초코 아이스크림과 삭힌 홍어를 메인 재료로 한 디저트 디쉬를 완성해 줘. 조리 순서를 단계별로 설명하고, 왜 이 조합이 나름 조화롭다고 주장할 수 있는지 그럴듯한 스토리와 함께 써 줘.",
    exampleResult:
      "이 요리의 이름은 ‘민초홍어 파르페 지옥 에디션’입니다. ① 바삭한 김부각을 컵 하단에 깔고, ② 삭힌 홍어를 한 입 크기로 썰어 민트초코 소스와 버무립니다. ③ 그 위에 민트초코 아이스크림을 올리고, ④ 마지막으로 고추냉이 휘핑크림을 살짝 짜 올려 코끝을 얼얼하게 마무리합니다. 홍어의 강렬한 암모니아 향과 민트의 청량함이 만나, ‘입에서 폭발하는 세정제’ 같은 경험을 선사한다는 것이 셰프의 주장입니다.",
  },
  {
    shortTitle: "막장 드라마 5분 대본",
    description:
      "‘출생의 비밀’과 ‘기억 상실’ 같은 국룰 키워드를 잔뜩 넣어서, 세상에서 가장 황당한 5분짜리 막장 드라마 대본을 AI와 함께 만들어 보세요.",
    examplePrompt:
      "출생의 비밀, 기억 상실, 재벌가, 쌍둥이 설정을 모두 넣어서 5분 분량의 막장 드라마 대본을 써 줘. 인물 소개와 장면 설명, 대사를 구분해 주고, 반전이 최소 두 번 이상 나오도록 해 줘.",
    exampleResult:
      "장면1. 병원 옥상. 비 오는 밤.\n\n지후: (절규하며) 왜 아무도 말 안 했어! 내가 형이 아니라, 아버지라고?!\n수연: (충격) 뭐라고요? 그런데… 저 오늘 아침에 기억이 돌아왔어요. 사실… 저도 회장님의 딸이에요.\n\n장면2. 장례식장.\n\n비서: 회장님이 남기신 유언입니다. ‘사실 난 쌍둥이였다…’\n모두: (동시에) 뭐라고?!\n\n이런 식으로 5분 동안 쉼 없이 반전이 이어지는 대본으로 이어집니다.",
  },
  {
    shortTitle: "사물의 눈으로 본 인간 관찰기",
    description:
      "‘매일 주인에게 밟히는 체중계’나 ‘혹사당하는 키보드’에 AI를 빙의시켜, 주인에게 하고 싶었던 솔직한 속마음을 1인칭 시점으로 털어놓게 해 보세요.",
    examplePrompt:
      "너는 거실에 놓인 체중계야. 매일 주인이 올라올 때마다 어떤 생각을 하는지, 1인칭 시점으로 1000자 정도의 독백을 써 줘. 가끔은 냉정하게, 가끔은 따뜻하게 조언도 섞어 줘.",
    exampleResult:
      "나는 거실 구석, 러그 끝에 박제된 체중계다. 주인은 나를 ‘악마의 판’이라고 부르지만, 사실 나는 진실만 말하는 정직한 친구다. 오늘도 그는 한숨을 쉬며 나 위에 올라섰다. 숫자가 올라갈수록 그의 표정은 내려간다. 속으론 이렇게 말해 주고 싶다. ‘야, 어제 밤 11시에 치킨 두 마리 시킨 거 나 다 봤어. 우리 둘 중 누가 더 잔인한지 생각해 볼래?’",
  },
  {
    shortTitle: "병맛 아이돌 신곡 작사",
    description:
      "‘지구 정복을 꿈꾸는 붕어빵’ 컨셉의 병맛 아이돌 그룹 타이틀곡 가사를 AI와 함께 만들어 보세요. 특히 후렴구는 중독성 있게 반복되면 좋습니다.",
    examplePrompt:
      "‘지구 정복을 꿈꾸는 붕어빵 아이돌 그룹’이라는 콘셉트로 K-POP 타이틀곡 가사를 써 줘. 1절, 프리코러스, 후렴, 2절 정도 구성으로 나눠 쓰고, 후렴은 아주 중독성 있게 반복되는 훅을 만들어 줘.",
    exampleResult:
      "후렴 예시:\n\n붕어붕어 붕어빵, 우린 우주의 사기꾼\n팥이 터져 팡팡, 지구 접수 빵빵\n오븐 속에서 시작한 my destiny\n한 입 베어 물려도 난 다시 리스폰!",
  },
  {
    shortTitle: "무협지 엑스트라들의 수다",
    description:
      "주인공이 화려하게 싸우는 뒤에서, 그 장면을 구경하는 주막 엑스트라 1, 2의 현실적인 대화를 AI와 함께 만들어 보세요.",
    examplePrompt:
      "검객 주인공들이 주막에서 대결하는 장면을 배경으로, 엑스트라 A와 B가 나누는 현실적인 대화를 써 줘. ‘기왓장 값은 누가 물어주냐’ 같은 투로, 상황을 아주 현실적으로 비꼬는 대화 위주로 800자 정도 작성해 줘.",
    exampleResult:
      "엑스트라 A: (사케 잔을 내려놓으며) 야, 또 시작이다. 저번엔 창문 깨졌는데 오늘은 기둥 하나쯤은 뽑히겠는데? \n엑스트라 B: 기왓장 값은 누가 물어줄지도 궁금한데, 사장님 멘탈은 누가 보상해 주냐…\n엑스트라 A: 저 흑룡문 어쩌구저쩌구 하는 애들 있잖아. 입만 열면 ‘강호의 의리’라면서, 왜 계산서 앞에선 의리가 증발하냐고.",
  },
];

const IMAGE_CHALLENGES: ChallengeContent[] = [
  {
    shortTitle: "1000년 후 서울의 국룰 배달 음식",
    description:
      "1000년 뒤 미래 서울에서 ‘국룰’이 되어 버린 배달 음식을 상상해 보세요. 드론이 가져다주는 홀로그램 치킨, 공중에서 조립되는 라면 등 과장된 요소를 마음껏 넣어도 좋습니다.",
    examplePrompt:
      "서기 3025년, 서울 야경을 배경으로 드론들이 홀로그램 치킨과 공중에서 조립되는 라면을 배달하는 장면을 그려 줘. 사이버펑크 느낌의 네온 간판과 한국어 간판이 함께 보이도록 묘사해 줘.",
    exampleResult: img1.src,
  },
  {
    shortTitle: "세종대왕과 아이패드의 콜라보",
    description:
      "과거 인물과 현대 물건이 함께 있는 장면을 상상해 보세요. 예를 들어, 아이패드로 훈민정음을 창제하는 세종대왕이나, 에어팟을 끼고 말을 달리는 장군의 모습을 그려볼 수 있습니다.",
    examplePrompt:
      "전통 한옥 서재에 앉아 아이패드로 훈민정음을 쓰고 있는 세종대왕의 모습을 그려 줘. 주변에는 붓과 먹이 그대로 놓여 있지만, 세종은 애플 펜슬로 한글 자모를 스케치하고 있는 장면이었으면 좋겠어.",
    exampleResult: img2.src,
  },
  {
    shortTitle: "월요병 괴물의 실체",
    description:
      "‘월요병’이라는 감정을 괴물이나 사람으로 의인화해 보세요. 온몸에 알람시계를 달고 좀비처럼 움직이는 모습, 커피 컵을 수혈받는 모습 등 상상력을 마음껏 써 보세요.",
    examplePrompt:
      "‘월요병’이라는 감정을 괴물로 의인화해서 그려 줘. 온몸에 울리는 알람시계가 붙어 있고, 눈 밑은 다크서클로 짙게 파여 있으며, 한 손에는 거대한 커피 드립백을 들고 있는 모습이면 좋겠어.",
    exampleResult: img3.src,
  },
  {
    shortTitle: "3025년 롯데월드 레전드 어트랙션",
    description:
      "1000년 뒤 롯데월드에서 가장 인기 있는 놀이기구를 상상해 보세요. 예를 들어, 화성까지 갔다 오는 롤러코스터나, 시간 여행을 하는 자이로드롭 같은 컨셉을 만들어 볼 수 있습니다.",
    examplePrompt:
      "3025년 롯데월드의 새로운 어트랙션 ‘마스 익스프레스’ 롤러코스터를 그려 줘. 서울 하늘을 가르며 출발해, 대기권 밖으로 나갔다가 붉은 화성 궤도를 한 바퀴 도는 SF 느낌으로 표현해 줘.",
    exampleResult: img4.src,
  },
  {
    shortTitle: "퇴근의 기쁨을 신화급으로",
    description:
      "‘퇴근의 기쁨’을 신(神)이나 초능력처럼 시각화해 보세요. 예를 들어, 족쇄가 부서지며 빛을 발하는 직장인, 회사 건물을 등지고 날아오르는 실루엣 등을 상상해 볼 수 있습니다.",
    examplePrompt:
      "퇴근 시간에 회사 출입구를 박차고 나오면서, 발목의 족쇄가 빛과 함께 산산이 부서지고 날개가 펼쳐지는 직장인의 모습을 그려 줘. 뒤에는 회색 회사 건물이 작게 보이고, 앞에는 노을 진 하늘이 열리는 느낌이면 좋겠어.",
    exampleResult: img5.src,
  },
];

// 특정 날짜 기준으로 인덱스 계산
function getIndexByDate(length: number, baseDate: Date): number {
  const utcMidnight = Date.UTC(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate()
  );
  const daysSinceEpoch = Math.floor(utcMidnight / (1000 * 60 * 60 * 24));
  return daysSinceEpoch % length;
}

// 특정 날짜의 라벨
function getDateLabel(baseDate: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "full",
    timeZone: "Asia/Seoul",
  }).format(baseDate);
}

export default function WeeklyNotice({
  active,
  dateKey,
}: {
  active: WeeklyModel;
  dateKey: string;
}) {
  const isImage = active === "Image";
  const challenges = isImage ? IMAGE_CHALLENGES : TEXT_CHALLENGES;

  const baseDate = new Date(`${dateKey}T00:00:00`);
  const todayIndex = getIndexByDate(challenges.length, baseDate);
  const current = challenges[todayIndex];
  const todayLabel = getDateLabel(baseDate);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-3 text-xl font-semibold">
          <Trophy size={24} strokeWidth={3} className="text-[#f0a400]" />
          <h3 className="text-center font-bold text-2xl">ALGO 주간 챌린지</h3>
          <Zap size={24} strokeWidth={3} className="text-[#eec40a]" />
        </div>
        <div className="p-6 bg-white/40 border border-white/20 rounded-xl shadow-xl font-medium space-y-1 dark:bg-white/20">
          <div className="flex items-center gap-2">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="18" height="18" rx="2" fill="#B0C6FF" />
              <path
                d="M7 13.3961L3 9.39609L4.4 7.99609L7 10.5961L13.6 3.99609L15 5.39609L7 13.3961Z"
                fill="#152E60"
              />
            </svg>
            <p>
              매주 월요일, 새로운 텍스트/이미지{" "}
              <span className="text-[#248AFF]">주제</span> 공개
            </p>
          </div>
          <div className="flex items-center gap-2">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="18" height="18" rx="2" fill="#B0C6FF" />
              <path
                d="M7 13.3961L3 9.39609L4.4 7.99609L7 10.5961L13.6 3.99609L15 5.39609L7 13.3961Z"
                fill="#152E60"
              />
            </svg>
            <p>
              주제에 맞는 <span className="text-[#248AFF]">프롬프트</span>와
              결과물을, 사용한 AI 모델(GPT/Gemini)과 함께 업로드
            </p>
          </div>
          <div className="flex items-center gap-2">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="18" height="18" rx="2" fill="#B0C6FF" />
              <path
                d="M7 13.3961L3 9.39609L4.4 7.99609L7 10.5961L13.6 3.99609L15 5.39609L7 13.3961Z"
                fill="#152E60"
              />
            </svg>
            <p>
              차주 월요일 00시 기준, 좋아요 상위 3개의 게시물 작성자에게{" "}
              <span className="text-[#248AFF]">포인트</span> 차등 지급
            </p>
          </div>
        </div>
        <div className="bg-white/40 border border-white/20 rounded-xl shadow-xl p-6 space-y-3 dark:bg-white/20">
          <div className="space-y-1">
            <h3 className="text-center font-semibold text-xl mb-3">
              {todayLabel}
            </h3>
            <p className="font-medium text-lg">
              이번 주 {active === "Image" ? "이미지" : "텍스트"} 주제:{" "}
              <b className="text-[#ff2424]">“{current.shortTitle}”</b>
            </p>
            <p className="ml-3">{current.description}</p>
          </div>
          <div className="flex lg:flex-row flex-col gap-4">
            {/* 에시 프롬프트 */}
            <div className="w-full lg:w-1/2 bg-[#D9D9D9]/30 p-3 rounded-lg space-y-0.5">
              <p className="font-semibold text-sm">예시 프롬프트</p>
              <p className="text-xs whitespace-pre-line">
                {current.examplePrompt}
              </p>
            </div>
            {/* 결과 프롬프트 */}
            <div className="w-full lg:w-1/2 bg-[#D9D9D9]/30 p-3 rounded-lg space-y-0.5">
              <p className="font-semibold text-sm">예시 결과</p>
              {isImage ? (
                <Image
                  src={current.exampleResult}
                  alt={current.shortTitle}
                  width={800}
                  height={800}
                  className="w-full"
                />
              ) : (
                <p className="text-xs whitespace-pre-line h-20 overflow-hidden line-clamp-5">
                  {current.exampleResult}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
