import Gemini from "./Gemini";
import Gpt from "./Gpt";

export default function Prompt({ data }: { data: Post[] }) {
  return (
    <>
      <Gpt />
      <Gemini />
    </>
  );
}
