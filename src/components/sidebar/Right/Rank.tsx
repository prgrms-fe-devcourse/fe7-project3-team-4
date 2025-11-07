import { Trophy } from "lucide-react";
import Box from "./Box";

export default function Rank() {
  return (
    <>
      <Box height="auto" icon={<Trophy />} title="지난 주 챌린지 순위">
        <div>
          <div>1.</div>
          <div>
            <p>#교육</p>
            <p>12.5k 조회</p>
          </div>
        </div>
      </Box>
    </>
  );
}
