import ReactMarkdown from "react-markdown";
import { safeHref } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * Safe markdown renderer. Raw HTML in the source is NOT rendered (react-markdown
 * escapes it by default), and link/image URLs are restricted to http(s)/mailto/relative.
 */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("prose-site", className)}>
      <ReactMarkdown
        skipHtml
        urlTransform={(url) => safeHref(url) ?? ""}
        components={{
          a: ({ href, children: c }) => {
            const safe = safeHref(href);
            if (!safe) return <span>{c}</span>;
            const external = /^https?:/.test(safe);
            return (
              <a href={safe} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {c}
              </a>
            );
          },
          h1: ({ children: c }) => <h2>{c}</h2>,
          img: () => null,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
