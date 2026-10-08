export function PreviewBanner() {
  return (
    <div className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-xl border border-amber-400/40 bg-ink-900/95 px-4 py-2.5 text-sm text-amber-100 shadow-2xl backdrop-blur">
        <span className="size-2 rounded-full bg-amber-400" aria-hidden="true" />
        Preview mode — you are seeing unpublished drafts.
        {/* Route handler link, not a page navigation */}
        <a href="/api/preview/disable" className="font-medium text-white underline underline-offset-4">
          Exit preview
        </a>
      </div>
    </div>
  );
}
