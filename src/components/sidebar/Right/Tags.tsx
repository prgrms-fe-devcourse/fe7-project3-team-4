import { Sparkles } from "lucide-react";
import Box from "./Box";
import Tag from "./Tag";

const MOCKUP_DATA = [
  {
    index: 1,
    hashtag: "#교육",
    views: 2,
  },
  {
    index: 2,
    hashtag: "#글쓰기",
    views: 2,
  },
  {
    index: 3,
    hashtag: "#교육",
    views: 2,
  },
  {
    index: 4,
    hashtag: "#교육",
    views: 2,
  },
  {
    index: 5,
    hashtag: "#교육",
    views: 2,
  },
  {
    index: 6,
    hashtag: "#교육",
    views: 2,
  },
  {
    index: 7,
    hashtag: "#교육",
    views: 2,
  },
  {
    index: 8,
    hashtag: "#교육",
    views: 2,
  },
];

export default function Tags() {
  return (
    <>
      <Box height="372px" icon={<Sparkles />} title="인기 태그들">
        <div className="grid grid-cols-2 grid-rows-5 gap-1">
          {MOCKUP_DATA.map((data) => (
            <Tag
              key={data.index}
              index={data.index}
              hashtag={data.hashtag}
              views={data.views}
            />
          ))}
        </div>
      </Box>
    </>
  );
}
