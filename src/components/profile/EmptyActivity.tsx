export default function EmptyActivity({ message }: { message?: string }) {
  return (
    <>
      <p className="text-[#717182] text-center py-12 bg-white/40 border border-white/20 rounded-xl shadow-xl dark:bg-white/20 dark:shadow-white/10 dark:text-[#A6A6DB]">
        {message || "작성한 게시글이 없습니다"}
      </p>
    </>
  );
}
