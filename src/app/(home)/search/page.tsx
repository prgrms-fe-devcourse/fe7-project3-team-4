import SearchPostForm from "@/components/home/search/SearchPostForm";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    tag?: string;
  }>;
}) {
  const { q, tag } = await searchParams;
  const searchTerm = q?.toLowerCase() ?? "";
  const tagTerm = tag?.toLowerCase() ?? "";

  return (
    <>
      <section className="relative max-w-2xl mx-auto">
        <SearchPostForm searchTerm={searchTerm} tagTerm={tagTerm} />
      </section>
    </>
  );
}
