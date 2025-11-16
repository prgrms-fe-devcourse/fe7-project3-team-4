"use client";

export type ToastVariant = "default" | "success" | "error" | "warning";

export type ToastProps = {
  open: boolean;
  title?: string;
  message: string;
  variant?: ToastVariant;
  onClose?: () => void;
};

export default function Toast({
  open,
  title,
  message,
  variant = "default",
  onClose,
}: ToastProps) {
  console.log("Toast render:", { open, title, message });

  if (!open) return null;

  // variant에 따라 왼쪽 포인트 색만 바꾸기 (밝은 톤)
  const accentClass =
    variant === "success"
      ? "bg-emerald-400"
      : variant === "error"
      ? "bg-rose-400"
      : variant === "warning"
      ? "bg-amber-400"
      : "bg-sky-400";

  return (
    // 화면 중앙 상단에 위치
    <div className="fixed inset-x-0 top-6 z-[9999] flex justify-center pointer-events-none">
      {/* 한 번에 하나만 쓰지만, 나중에 여러 개 쌓아올려도 대응 가능 */}
      <div
        className={`
          relative flex items-center gap-3
          max-w-sm w-[320px]
          px-4 py-3
          rounded-xl
          border border-white/60
          bg-white/90 text-slate-900
          shadow-[0_14px_35px_rgba(15,23,42,0.38)]
          backdrop-blur-md
          pointer-events-auto
          animate-[toast-slide-down-up_2.6s_ease-in-out]
        `}
      >
        {/* 왼쪽 포인트 바 */}
        <div className={`w-1 self-stretch rounded-full ${accentClass}`} />

        {/* 텍스트 영역 */}
        <div className="flex-1">
          {title && (
            <div className="text-sm font-semibold leading-snug text-slate-900">
              {title}
            </div>
          )}
          <div className="mt-1 text-xs leading-relaxed text-slate-700">
            {message}
          </div>
        </div>

        {/* 닫기 버튼 (선택 사항) */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-2 text-[10px] text-slate-400 hover:text-slate-700 transition"
            aria-label="토스트 닫기"
          >
            ✕
          </button>
        )}

        {/* 살짝 시안계열 glow (밝은 버전) */}
        <div className="pointer-events-none absolute -inset-5 -z-10 rounded-2xl bg-[radial-gradient(circle,rgba(56,189,248,0.23),transparent_70%)] blur-xl" />
      </div>
    </div>
  );
}
