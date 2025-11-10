// src/components/profile/EmptyActivity.tsx
export default function EmptyActivity({ message }: { message?: string }) {
  return (
    <>
      <p className="text-[#717182] text-center py-12 bg-white/40 border-white/20 rounded-xl shadow-xl">
        {message || "작성한 게시글이 없습니다"}
      </p>
    </>
  );
}