type ConfirmModalProps = {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  open: boolean;
};

export default function ConfirmModal({
  title,
  description,
  onConfirm,
  onCancel,
  open,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xs rounded-2xl bg-white/80 p-6 shadow-xl backdrop-blur-xs dark:bg-white/20 dark:backdrop-blur-sm">
        <h2 className="text-2xl font-semibold flex justify-center">{title}</h2>
        <p className="mt-4 text-lg flex justify-center dark:text-[#A6A6DB]">
          {description}
        </p>

        <div className="mt-8 flex justify-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 text-sm bg-white/40 rounded-lg border border-white/60 hover:bg-gray-50 cursor-pointer hover:text-[#0A0A0A]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3 py-2 text-sm rounded-lg border border-[#6758FF] bg-[#6758FF] text-white hover:bg-[#5746ff] cursor-pointer"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
