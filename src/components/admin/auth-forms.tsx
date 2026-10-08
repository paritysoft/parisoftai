"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { requestPasswordResetAction, signInAction, updatePasswordAction, type AuthFormState } from "@/actions/auth";
import { Button } from "@/components/ui/button";

const input =
  "mt-1.5 block h-11 w-full rounded-[var(--radius-control)] border border-line bg-ink-900 px-3.5 text-sm text-fg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

function Feedback({ state }: { state: AuthFormState }) {
  if (state?.error)
    return (
      <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-100">
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {state.error}
      </p>
    );
  if (state?.message)
    return (
      <p role="status" className="flex items-start gap-2 rounded-lg border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm text-emerald-100">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {state.message}
      </p>
    );
  return null;
}

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const [state, action, pending] = useActionState(signInAction, initialError ? { error: initialError } : undefined);
  return (
    <form action={action} className="space-y-4">
      <Feedback state={state} />
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label htmlFor="email" className="text-sm font-medium text-fg">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required className={input} />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-fg">Password</label>
          <Link href="/admin/forgot-password" className="text-xs text-indigo-200 hover:text-white">Forgot password?</Link>
        </div>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={input} />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null} Sign in
      </Button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <Feedback state={state} />
      <div>
        <label htmlFor="email" className="text-sm font-medium text-fg">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className={input} />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null} Send reset link
      </Button>
      <Link href="/admin/login" className="block text-center text-sm text-fg-3 hover:text-fg">Back to sign in</Link>
    </form>
  );
}

export function SetPasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <Feedback state={state} />
      <div>
        <label htmlFor="password" className="text-sm font-medium text-fg">New password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={12} required className={input} aria-describedby="pw-hint" />
        <p id="pw-hint" className="mt-1 text-xs text-fg-3">At least 12 characters.</p>
      </div>
      <div>
        <label htmlFor="confirm" className="text-sm font-medium text-fg">Confirm password</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" required className={input} />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null} Save password
      </Button>
    </form>
  );
}
