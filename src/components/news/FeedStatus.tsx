"use client";

type FeedStatusProps = {
  isLoading: boolean;
  listLength: number;
  message?: string;
};

export default function FeedStatus({
  isLoading,
  listLength,
  message,
}: FeedStatusProps) {
  if (message) {
    const isError = message.startsWith("❌");
    return (
      <p
        className={`my-4 text-center ${
          isError ? "text-red-600" : "text-green-700"
        }`}
        role="status"
        aria-live="polite"
      >
        {message}
      </p>
    );
  }

  if (!isLoading && listLength === 0 && !message) {
    return (
      <p className="text-gray-500 text-center py-20 dark:text-[#A6A6DB]">
        아직 저장된 뉴스가 없습니다.
      </p>
    );
  }

  return null;
}
