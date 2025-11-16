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
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900 flex justify-center">
          {title}
        </h2>
        <p className="mt-2 text-sm text-gray-600 flex justify-center">
          {description}
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3 py-2 text-sm rounded-lg bg-[#6758FF] text-white hover:bg-[#5746ff] cursor-pointer"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
