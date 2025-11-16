import { ReactNode } from "react";

export default function Box({
  height,
  icon,
  title,
  children,
}: {
  height: string;
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <div
        className="w-full p-6 box-border bg-white/40 border border-white/20 rounded-xl shadow-xl dark:bg-white/20 dark:shadow-white/10"
        style={height ? { height } : undefined}
      >
        <div className="flex gap-2 mb-5">
          <div className="text-[#6758FF]">{icon}</div>
          <p>{title}</p>
        </div>
        {children}
      </div>
    </>
  );
}
