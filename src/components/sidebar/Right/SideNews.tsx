import { Newspaper } from "lucide-react";
import Box from "./Box";
import { ReactNode } from "react"; // [추가]

export default function News({ children }: { children: ReactNode }) { // [수정]
  return (
    <>
      <Box height="238px" icon={<Newspaper />} title="최신 뉴스 - GPT & Gemini">
        {children} {/* [수정] */}
      </Box>
    </>
  );
}