export default function ContentBox({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="bg-white/40 border-white/20 rounded-xl shadow-xl hover:-translate-y-1 hover:shadow-2xl">
        {children}
      </div>
    </>
  );
}
