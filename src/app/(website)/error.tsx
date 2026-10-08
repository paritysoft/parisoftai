"use client";

import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function WebsiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-site flex min-h-[60vh] flex-col items-center justify-center pt-24 text-center">
      <h1 className="text-3xl font-bold text-fg">This page couldn&apos;t load</h1>
      <p className="mt-3 max-w-md text-fg-3">A temporary problem stopped this page from loading. Try again, or go back to the homepage.</p>
      <div className="mt-8 flex gap-3">
        <button type="button" onClick={reset} className={buttonClasses("primary", "md")}>
          Try again
        </button>
        <Link href="/" className={buttonClasses("secondary", "md")}>
          Homepage
        </Link>
      </div>
    </div>
  );
}
