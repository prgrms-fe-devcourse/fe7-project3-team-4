// src/app/(home)/views/page.tsx
import HistoryPostForm from "@/components/home/history/HistoryPostForm";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

function HistoryLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-white/30 rounded-xl shadow-lg h-48 animate-pulse" />
      <div className="bg-white/30 rounded-xl shadow-lg h-48 animate-pulse" />
      <div className="bg-white/30 rounded-xl shadow-lg h-48 animate-pulse" />
    </div>
  );
}

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!user || error) {
    redirect("/auth/login?from=history");
  }

  return (
    <>
      <section className="relative max-w-2xl mx-auto px-6">
        <div className="mt-6 space-y-6">
          <Suspense fallback={<HistoryLoadingSkeleton />}>
            <HistoryPostForm userId={user.id} />
          </Suspense>
        </div>
      </section>
    </>
  );
}

// import HistoryPostForm from "@/components/home/history/HistoryPostForm";
// import { Suspense } from "react";

// export const dynamic = "force-dynamic";

// function HistoryLoadingSkeleton() {
//   return (
//     <div className="space-y-4">
//       <div className="bg-white/30 rounded-xl shadow-lg h-48 animate-pulse" />
//       <div className="bg-white/30 rounded-xl shadow-lg h-48 animate-pulse" />
//       <div className="bg-white/30 rounded-xl shadow-lg h-48 animate-pulse" />
//     </div>
//   );
// }

// export default function Page() {
//   return (
//     <>
//       <section className="relative max-w-2xl mx-auto px-6">
//         <div className="mt-6 space-y-6">
//           <Suspense fallback={<HistoryLoadingSkeleton />}>
//             <HistoryPostForm />
//           </Suspense>
//         </div>
//       </section>
//     </>
//   );
// }
