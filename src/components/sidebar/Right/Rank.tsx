import { Trophy } from "lucide-react";
import Box from "./Box";
import { createClient } from "@/utils/supabase/server";
import Image from "next/image";

const getOrdinalSuffix = (n: number) => {
  if (n % 100 >= 11 && n % 100 <= 13) {
    return "th";
  }
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

export default async function Rank() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select(
      `
      id,
      user_id, 
      post_type,
      like_count,
      profile:user_id ( 
        display_name,
        email,
        avatar_url
      )
    `
    )
    .eq("post_type", "prompt")
    .order("like_count", { ascending: false }); // 좋아요 순 정렬

  if (error) console.error(error);

  if (!data || data.length === 0) {
    return (
      <Box height="284px" icon={<Trophy />} title="이번 주 챌린지 순위">
        <p className="text-center text-sm text-gray-500 py-8">
          아직 랭킹이 없습니다.
        </p>
      </Box>
    );
  }

  // user_id(문자열) 기준으로 중복 제거 (가장 like_count 높은 게시글만 남기기)
  const uniqueMap = new Map();
  for (const post of data) {
    // 맵에 user_id가 아직 없으면(해당 유저의 첫 번째=좋아요 가장 높은 게시물) 추가
    if (!uniqueMap.has(post.user_id)) {
      uniqueMap.set(post.user_id, post);
    }
  }
  const uniqueByUser = Array.from(uniqueMap.values());

  const topUsers = uniqueByUser.slice(0, 4);

  return (
    <Box height="284px" icon={<Trophy />} title="지난 주 챌린지 순위">
      <div className="flex flex-col gap-4">
        {topUsers.map((item, index) => {
          const rankNumber = index + 1;
          const rankSuffix = getOrdinalSuffix(rankNumber);
          const profile = item.profile;
          const displayName = profile?.display_name ?? "익명";
          const email = profile?.email ?? "이메일 없음";
          const avatar = profile?.avatar_url;

          const rankColor =
            rankNumber === 1
              ? "#EFAF00"
              : rankNumber === 2
              ? "#C0C0C0"
              : rankNumber === 3
              ? "#CD7F32"
              : "#D1D5DB";

          return (
            <div
              key={item.user_id}
              className="flex justify-between items-center"
            >
              <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-4">
                <div className="w-8" style={{ color: rankColor }}>
                  {rankNumber}
                  {rankSuffix}.
                </div>

                <div className="relative w-9 h-9 bg-gray-300 rounded-full overflow-hidden shrink-0">
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt={displayName}
                      fill={true}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="flex items-center justify-center h-full w-full text-gray-500 text-lg font-semibold">
                      {(displayName[0] || "?").toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-sm truncate">{displayName}</p>
                  <p className="text-[11px] text-[#717182] truncate">
                    @{email}
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                <button
                  className="cursor-pointer text-sm px-4 py-1.5 text-white bg-[#6758FF] rounded-lg"
                  // 팔로우 로직 연결
                >
                  팔로우
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Box>
  );
}
