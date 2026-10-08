import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="font-mono text-sm text-glow">404</p>
        <h1 className="mt-3 text-4xl font-extrabold text-fg">Page not found</h1>
        <p className="mt-4 text-fg-3">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className={buttonClasses("primary", "md")}>
            Go to homepage
          </Link>
          <Link href="/contact" className={buttonClasses("secondary", "md")}>
            Contact us
          </Link>
        </div>
      </div>
    </main>
  );
}
