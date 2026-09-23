import { cn } from "@/lib/utils";

function Bone({ className }: { className: string }) {
  return <span className={cn("block rounded bg-slate-200", className)} />;
}

export function DashboardSkeleton({ variant = "dashboard" }: { variant?: "dashboard" | "list" | "document" }) {
  if (variant === "document") {
    return (
      <div role="status" aria-label="Memuat ruang kerja kontrak" className="motion-safe:animate-pulse bg-white">
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <Bone className="size-4" />
          <div className="grid flex-1 gap-2">
            <Bone className="h-3 w-60 max-w-full" />
            <Bone className="h-2 w-36" />
          </div>
        </div>
        <div className="grid min-h-[620px] lg:grid-cols-[minmax(0,1.55fr)_390px] xl:grid-cols-[minmax(0,1.55fr)_390px_240px]">
          <div className="border-r border-slate-200 p-8 sm:p-12">
            <Bone className="h-2 w-24" />
            <Bone className="mt-7 h-7 w-4/5" />
            <Bone className="mt-3 h-7 w-3/5" />
            {["w-full", "w-11/12", "w-4/5", "w-full", "w-3/4"].map((width, index) => (
              <Bone key={index} className={`mt-7 h-3 ${width}`} />
            ))}
          </div>
          <div className="border-r border-slate-200 p-6">
            <Bone className="h-2 w-32" />
            <Bone className="mt-6 h-6 w-4/5" />
            <Bone className="mt-4 h-3 w-full" />
            {[0, 1, 2].map((item) => (
              <div key={item} className="mt-6 border border-slate-200 p-5">
                <Bone className="h-3 w-2/3" />
                <Bone className="mt-4 h-2 w-full" />
                <Bone className="mt-2 h-2 w-4/5" />
              </div>
            ))}
          </div>
          <div className="p-5 lg:col-span-2 xl:col-span-1">
            <Bone className="h-2 w-28" />
            <Bone className="mt-6 h-3 w-full" />
            <Bone className="mt-3 h-3 w-2/3" />
            <Bone className="mt-7 h-36 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div role="status" aria-label="Memuat daftar kontrak" className="mx-auto max-w-[1080px] px-4 py-8 motion-safe:animate-pulse sm:px-7 lg:py-12">
        <Bone className="h-2 w-28" />
        <Bone className="mt-6 h-12 w-3/4" />
        <Bone className="mt-5 h-3 w-1/2" />
        <Bone className="mt-9 h-12 w-full" />
        <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="grid grid-cols-[40px_1fr] gap-4 border-b border-slate-200 p-5 last:border-0">
              <Bone className="size-10" />
              <div>
                <Bone className="h-3 w-2/5" />
                <Bone className="mt-3 h-2 w-3/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /** Default: dashboard/ringkasan skeleton — 2 action widgets matching new layout */
  return (
    <div
      role="status"
      aria-label="Memuat ringkasan workspace"
      className="mx-auto max-w-[1190px] px-4 py-10 motion-safe:animate-pulse sm:px-7 lg:py-16"
    >
      {/* Header */}
      <Bone className="h-2 w-28" />
      <Bone className="mt-6 h-14 w-3/5" />
      <Bone className="mt-4 h-3 w-2/5" />

      {/* 2 Action Widgets Skeleton */}
      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
        {[0, 1].map((item) => (
          <div
            key={item}
            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-7 sm:p-8"
          >
            <div>
              <div className="flex items-center justify-between">
                <Bone className="size-12 rounded-lg" />
                <Bone className="h-6 w-20 rounded-full" />
              </div>
              <Bone className="mt-6 h-2 w-24" />
              <Bone className="mt-3 h-8 w-2/3" />
              <Bone className="mt-3 h-3 w-full" />
              <Bone className="mt-2 h-3 w-4/5" />

              <div className="mt-6 space-y-3 border-t border-slate-100 pt-6">
                <Bone className="h-3 w-3/4" />
                <Bone className="h-3 w-4/5" />
                <Bone className="h-3 w-2/3" />
              </div>
            </div>
            <Bone className="mt-8 h-11 w-full rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
