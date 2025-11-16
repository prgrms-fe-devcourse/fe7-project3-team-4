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
        className="w-full p-6 box-border bg-white/40 border border-white/20 rounded-xl  dark:bg-white/20 shadow-[0_10px_25px_rgba(255,255,255,0.1),0_4px_10px_rgba(255,255,255,0.1)] dark:shadow-white/20"
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
