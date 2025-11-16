export default function ContentBox({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="bg-white/40 border border-white/20 rounded-xl shadow-xl hover:-translate-y-1 hover:shadow-2xl overflow-hidden dark:bg-white/20 dark:shadow-white/10">
        {children}
      </div>
    </>
  );
}
