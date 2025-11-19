"use client";

import { useState, useTransition } from "react";
import { ViewHistoryType } from "@/types/Post";
import HistoryPost from "@/components/home/history/HistoryPost";
import { deleteAllHistoryAction } from "@/utils/actions/History";
import { useToast } from "@/components/common/toast/ToastContext";
import ConfirmModal from "@/components/common/ConfirmModal";

export default function HistoryClientView({
  views,
}: {
  views: ViewHistoryType[];
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteAll, setPendingDeleteAll] = useState(false);
  const { showToast } = useToast();

  const handleDeleteAll = () => {
    setPendingDeleteAll(true);
    setConfirmOpen(true);
  };

  const handleConfirmDeleteAll = () => {
    setConfirmOpen(false);
    startTransition(async () => {
      const result = await deleteAllHistoryAction();
      if (result?.error) {
        showToast({
          title: "조회 내역 삭제 실패",
          message: result.error,
          variant: "warning",
        });
      }
    });
  };

  const handleCancelDeleteAll = () => {
    setConfirmOpen(false);
    setPendingDeleteAll(false);
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
      <div className="space-y-6 mt-7">
        {(views as ViewHistoryType[]).map((view) => (
          <HistoryPost key={view.id} data={view} />
        ))}
      </div>
      {pendingDeleteAll && (
        <ConfirmModal
          title="삭제 확인"
          description={`총 ${views.length}개의 조회 내역을 모두 삭제하시겠습니까?`}
          onConfirm={handleConfirmDeleteAll}
          onCancel={handleCancelDeleteAll}
          open={confirmOpen}
        />
      )}
    </div>
  );
}
