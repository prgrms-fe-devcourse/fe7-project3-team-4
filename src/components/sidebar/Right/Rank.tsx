import { Trophy } from "lucide-react";
import Box from "./Box";

const MOCKUP_DATA = [
  {
    rank: "1st",
    name: "닉네임1",
    email: "aaaa@naver.com",
  },
  {
    rank: "2nd",
    name: "닉네임2",
    email: "aaaa@naver.com",
  },
  {
    rank: "3rd",
    name: "닉네임3",
    email: "aaaa@naver.com",
  },
  {
    rank: "4th",
    name: "닉네임4",
    email: "aaaa@naver.com",
  },
];

export default function Rank() {
  return (
    <>
      <Box height="284px" icon={<Trophy />} title="지난 주 챌린지 순위">
        <div className="flex flex-col gap-4">
          {MOCKUP_DATA.map((data, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <div
                  style={
                    data.rank === "1st"
                      ? { color: "#EFAF00" }
                      : data.rank === "2nd"
                      ? { color: "#C0C0C0" }
                      : data.rank === "3rd"
                      ? { color: "#CD7F32" }
                      : data.rank === "4th"
                      ? { color: "#D1D5DB" }
                      : undefined
                  }
                >
                  {data.rank}.
                </div>
                <div className="w-9 h-9 bg-gray-300 rounded-full">
                  {/* 이미지 영역 */}
                </div>
                <div>
                  <p className="text-sm">{data.name}</p>
                  <p className="text-xs text-[#717182]">@{data.email}</p>
                </div>
              </div>
              <div>
                <button className="cursor-pointer text-sm px-4 py-1.5 text-white bg-[#6758FF] rounded-lg">
                  팔로우
                </button>
              </div>
            </div>
          ))}
        </div>
      </Box>
    </>
  );
}
