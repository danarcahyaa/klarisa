function Bone({ className }: { className: string }) {
  return <span className={`block rounded bg-slate-200 ${className}`} />;
}

export function DraftEditorSkeleton() {
  return (
    <div role="status" aria-label="Memuat editor draft" className="min-h-[calc(100svh-57px)] bg-[#f7f8fb] px-4 pt-6 motion-safe:animate-pulse sm:px-7">
      <div className="mx-auto w-full max-w-[1080px] overflow-hidden bg-white xl:rounded-lg xl:border xl:border-slate-200">
        <header className="flex min-h-[68px] items-center gap-3 border-b border-slate-200 px-4 py-3 sm:px-7">
          <div className="grid flex-1 gap-2"><Bone className="h-3 w-56 max-w-full"/><Bone className="h-2 w-32"/></div>
          <Bone className="hidden h-9 w-24 sm:block"/><Bone className="h-9 w-10 sm:w-28"/>
        </header>
        <div className="grid min-h-[calc(100svh-125px)] xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="min-w-0 border-b border-slate-200 xl:border-r xl:border-b-0">
            <div className="flex h-16 items-center gap-4 border-b border-slate-200 px-5 sm:px-7"><Bone className="size-5"/><Bone className="h-8 w-24"/><Bone className="size-5"/><Bone className="size-5"/></div>
            <div className="mx-auto max-w-[900px] px-5 py-10 sm:px-10"><Bone className="h-3 w-24"/><Bone className="mt-7 h-9 w-4/5"/>{["w-full", "w-11/12", "w-4/5", "w-full", "w-3/4"].map((width, index) => <Bone key={index} className={`mt-7 h-3 ${width}`}/>)}</div>
          </section>
          <aside className="p-5 sm:p-7"><Bone className="h-3 w-28"/><Bone className="mt-6 h-4 w-4/5"/><Bone className="mt-4 h-3 w-full"/><Bone className="mt-8 h-28 w-full"/><Bone className="mt-5 h-28 w-full"/></aside>
        </div>
      </div>
    </div>
  );
}
