"use client";

import { useTransition } from "react";
import { ViewHistoryType } from "@/types/Post";
import HistoryPost from "@/components/home/history/HistoryPost";
import { deleteAllHistoryAction } from "@/utils/actions/History";

export default function HistoryClientView({
  views,
}: {
  views: ViewHistoryType[];
}) {
  const [isPending, startTransition] = useTransition();

  const handleDeleteAll = () => {
    const confirmed = window.confirm(
      `총 ${views.length}개의 조회 내역을 모두 삭제하시겠습니까?`
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteAllHistoryAction(); // 서버 액션 호출
      if (result?.error) {
        alert(result.error);
      }
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <h3 className="ml-2 text-xl font-semibold">게시글 조회 목록</h3>
        <button
          onClick={handleDeleteAll}
          disabled={isPending || views.length === 0}
          className="cursor-pointer leading-none border-b text-[#717182] disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
        >
          {isPending ? "삭제 중..." : "내역 삭제"}
        </button>
      </div>
      <div className="space-y-4 mt-7">
        {(views as ViewHistoryType[]).map((view) => (
          <HistoryPost key={view.id} data={view} />
        ))}
      </div>
    </div>
  );
}
