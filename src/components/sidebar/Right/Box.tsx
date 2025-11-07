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
        className={`w-100% h-[${height}] p-6 box-border bg-white/40 border border-white/20 rounded-xl shadow-[0px_10px_25px_rgba(0,0,0,0.1),0px_4px_10px_rgba(0,0,0,0.1)] overflow-hidden backdrop-blur-xl`}
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
