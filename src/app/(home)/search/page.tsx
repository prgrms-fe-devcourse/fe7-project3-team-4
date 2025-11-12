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
      <SearchPostForm searchTerm={searchTerm} tagTerm={tagTerm} />
    </>
  );
}
