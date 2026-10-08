"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { cmsLoginAction } from "@/actions/cms";
import { Button } from "@/components/ui/button";

const input =
  "mt-1.5 block h-11 w-full rounded-[var(--radius-control)] border border-line bg-ink-900 px-3.5 text-sm text-fg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

export function CmsLoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(cmsLoginAction, null);
  return (
    <form action={action} className="space-y-4">
      {state?.error ? (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-100">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {state.error}
        </p>
      ) : null}
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label htmlFor="email" className="text-sm font-medium text-fg">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required defaultValue={state?.email ?? ""} key={state?.email ?? ""} className={input} />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium text-fg">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus={Boolean(state?.error)} className={input} />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null} Sign in
      </Button>
    </form>
  );
}
