import { Newspaper } from "lucide-react";
import Box from "./Box";

export default function News() {
  return (
    <>
      <Box height="238px" icon={<Newspaper />} title="최신 뉴스 - GPT & Gemini">
        <div></div>
      </Box>
    </>
  );
}
