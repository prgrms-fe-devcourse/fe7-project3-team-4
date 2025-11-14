import ContentBox from "@/components/ContentBox";
import { Heart, User, X } from "lucide-react";
export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <>
      <section className="relative max-w-2xl mx-auto">
        <div className="mt-6 space-y-6">
          <Suspense fallback={<HistoryLoadingSkeleton />}>
            <HistoryPostForm />
          </Suspense>
        </div>
      </section>
    </>
  );
}
