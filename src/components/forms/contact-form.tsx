"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { track } from "@vercel/analytics";
import { AlertCircle, CheckCircle2, Loader2, Mail, Send } from "lucide-react";
import { leadSchema, type LeadData, type LeadInput } from "@/lib/validation/lead";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ContactFormProps {
  services: string[];
  budgetOptions: string[];
  timelineOptions: string[];
  consentText: string;
  /**
   * "server": POST to /api/contact (database or Resend email delivery configured).
   * "email": no delivery service configured — open the visitor's email app with the
   * inquiry pre-filled and addressed to `contactEmail`. Never claims the inquiry was sent.
   */
  delivery?: "server" | "email";
  contactEmail?: string;
}

export function buildMailto(to: string, d: { fullName: string; email: string; companyName?: string; serviceRequired: string; estimatedBudget?: string; preferredTimeline?: string; projectDescription: string }): string {
  const lines = [
    `Name: ${d.fullName}`,
    `Email: ${d.email}`,
    d.companyName ? `Company: ${d.companyName}` : "",
    `Service: ${d.serviceRequired}`,
    d.estimatedBudget ? `Budget: ${d.estimatedBudget}` : "",
    d.preferredTimeline ? `Timeline: ${d.preferredTimeline}` : "",
    "",
    "Project description:",
    d.projectDescription,
  ].filter((l, i) => l !== "" || i === 6);
  const subject = `Project inquiry: ${d.serviceRequired} — ${d.fullName}`.replace(/[\r\n]+/g, " ").slice(0, 150);
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n").slice(0, 1800))}`;
}

type Status = { kind: "idle" } | { kind: "success"; message: string } | { kind: "error"; message: string } | { kind: "mailto"; href: string };

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : "");

export function ContactForm({ services, budgetOptions, timelineOptions, consentText, delivery = "server", contactEmail = "" }: ContactFormProps) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  // Idempotency key: reused if the same inquiry is retried, replaced after a successful send.
  const submissionId = useRef("");
  const openedAt = useRef(0);
  const honeypot = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const formId = useId();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadInput, unknown, LeadData>({
    resolver: zodResolver(leadSchema),
    defaultValues: { fullName: "", email: "", companyName: "", serviceRequired: "", estimatedBudget: "", preferredTimeline: "", projectDescription: "" },
    shouldFocusError: true,
  });

  useEffect(() => {
    openedAt.current = Date.now();
    // Pre-select a service when arriving from a service page (?service=...)
    const requested = new URLSearchParams(window.location.search).get("service");
    if (requested && services.includes(requested)) setValue("serviceRequired", requested);
  }, [services, setValue]);

  useEffect(() => {
    if (status.kind !== "idle") statusRef.current?.focus();
  }, [status]);

  const onSubmit = async (data: LeadData) => {
    setStatus({ kind: "idle" });
    if (delivery === "email" && contactEmail) {
      const href = buildMailto(contactEmail, {
        ...data,
        companyName: data.companyName ?? "",
        estimatedBudget: data.estimatedBudget ?? "",
        preferredTimeline: data.preferredTimeline ?? "",
      });
      track("inquiry_email_opened", { service: data.serviceRequired });
      window.location.href = href;
      setStatus({ kind: "mailto", href });
      return;
    }
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          submissionId: (submissionId.current ||= newId()),
          website: honeypot.current?.value ?? "",
          elapsedMs: Math.max(0, Date.now() - openedAt.current),
        }),
      });
      const body = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!res.ok || !body?.ok) {
        setStatus({ kind: "error", message: body?.message ?? "We couldn't send your inquiry. Please try again in a moment." });
        return;
      }
      track("inquiry_submitted", { service: data.serviceRequired });
      setStatus({ kind: "success", message: body.message ?? "Thanks — your inquiry has been received. We'll reply by email." });
      reset();
      submissionId.current = "";
      openedAt.current = Date.now();
    } catch {
      setStatus({ kind: "error", message: "Network error — your inquiry was not sent. Check your connection and try again." });
    }
  };

  if (status.kind === "mailto") {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="surface flex flex-col items-start gap-4 p-8 outline-none">
        <Mail className="size-8 text-indigo-300" aria-hidden="true" />
        <h2 className="text-2xl font-bold text-fg">Almost done — press Send in your email app</h2>
        <p className="text-fg-2">
          Your email app should have opened with your inquiry ready to send to <strong className="text-fg">{contactEmail}</strong>. Your message is only sent once you press
          Send there.
        </p>
        <p className="text-sm text-fg-3">
          Nothing opened? Email us directly at{" "}
          <a href={status.href} className="text-indigo-200 underline underline-offset-4 hover:text-white">
            {contactEmail}
          </a>
          .
        </p>
        <Button variant="secondary" onClick={() => setStatus({ kind: "idle" })}>
          Back to the form
        </Button>
      </div>
    );
  }

  if (status.kind === "success") {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="surface flex flex-col items-start gap-4 p-8 outline-none">
        <CheckCircle2 className="size-8 text-emerald-400" aria-hidden="true" />
        <h2 className="text-2xl font-bold text-fg">Inquiry received</h2>
        <p className="text-fg-2">{status.message}</p>
        <Button variant="secondary" onClick={() => setStatus({ kind: "idle" })}>
          Send another inquiry
        </Button>
      </div>
    );
  }

  const field = "mt-2 block w-full rounded-[var(--radius-control)] border bg-ink-900/80 px-4 text-[0.9375rem] text-fg placeholder:text-fg-3/70 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";
  const fieldBorder = (hasError: boolean) => (hasError ? "border-red-400/70" : "border-line hover:border-line-strong");
  const label = "text-sm font-medium text-fg";
  const errorText = (id: string, msg?: string) =>
    msg ? (
      <p id={id} className="mt-1.5 flex items-center gap-1.5 text-sm text-red-300">
        <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
        {msg}
      </p>
    ) : null;
  const ids = {
    fullName: `${formId}-name`,
    email: `${formId}-email`,
    company: `${formId}-company`,
    service: `${formId}-service`,
    budget: `${formId}-budget`,
    timeline: `${formId}-timeline`,
    description: `${formId}-description`,
    consent: `${formId}-consent`,
  };

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate className="surface space-y-6 p-6 sm:p-8" aria-describedby={`${formId}-required`}>
      <p id={`${formId}-required`} className="text-sm text-fg-3">
        Fields marked <span aria-hidden="true">*</span>
        <span className="sr-only">with an asterisk</span> are required.
      </p>

      {status.kind === "error" ? (
        <div ref={statusRef} tabIndex={-1} role="alert" className="flex gap-3 rounded-xl border border-red-400/40 bg-red-400/10 p-4 text-sm text-red-100 outline-none">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {status.message}
        </div>
      ) : null}

      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${formId}-website`}>Website</label>
        <input ref={honeypot} id={`${formId}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor={ids.fullName} className={label}>
            Full name <span aria-hidden="true">*</span>
          </label>
          <input id={ids.fullName} type="text" autoComplete="name" aria-required="true" aria-invalid={!!errors.fullName} aria-describedby={errors.fullName ? `${ids.fullName}-err` : undefined} className={cn(field, fieldBorder(!!errors.fullName), "h-12")} {...register("fullName")} />
          {errorText(`${ids.fullName}-err`, errors.fullName?.message)}
        </div>
        <div>
          <label htmlFor={ids.email} className={label}>
            Business email <span aria-hidden="true">*</span>
          </label>
          <input id={ids.email} type="email" autoComplete="email" inputMode="email" aria-required="true" aria-invalid={!!errors.email} aria-describedby={errors.email ? `${ids.email}-err` : undefined} className={cn(field, fieldBorder(!!errors.email), "h-12")} {...register("email")} />
          {errorText(`${ids.email}-err`, errors.email?.message)}
        </div>
        <div>
          <label htmlFor={ids.company} className={label}>
            Company name <span className="font-normal text-fg-3">(optional)</span>
          </label>
          <input id={ids.company} type="text" autoComplete="organization" className={cn(field, fieldBorder(!!errors.companyName), "h-12")} {...register("companyName")} />
          {errorText(`${ids.company}-err`, errors.companyName?.message)}
        </div>
        <div>
          <label htmlFor={ids.service} className={label}>
            Service required <span aria-hidden="true">*</span>
          </label>
          <select id={ids.service} aria-required="true" aria-invalid={!!errors.serviceRequired} aria-describedby={errors.serviceRequired ? `${ids.service}-err` : undefined} className={cn(field, fieldBorder(!!errors.serviceRequired), "h-12 appearance-none")} {...register("serviceRequired")}>
            <option value="">Select a service</option>
            {services.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {errorText(`${ids.service}-err`, errors.serviceRequired?.message)}
        </div>
        {budgetOptions.length > 0 && (
          <div>
            <label htmlFor={ids.budget} className={label}>
              Estimated budget <span className="font-normal text-fg-3">(optional)</span>
            </label>
            <select id={ids.budget} className={cn(field, fieldBorder(false), "h-12 appearance-none")} {...register("estimatedBudget")}>
              <option value="">Prefer not to say</option>
              {budgetOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        )}
        {timelineOptions.length > 0 && (
          <div>
            <label htmlFor={ids.timeline} className={label}>
              Preferred timeline <span className="font-normal text-fg-3">(optional)</span>
            </label>
            <select id={ids.timeline} className={cn(field, fieldBorder(false), "h-12 appearance-none")} {...register("preferredTimeline")}>
              <option value="">No preference</option>
              {timelineOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label htmlFor={ids.description} className={label}>
          Project description <span aria-hidden="true">*</span>
        </label>
        <textarea
          id={ids.description}
          rows={6}
          aria-required="true"
          aria-invalid={!!errors.projectDescription}
          aria-describedby={`${ids.description}-hint${errors.projectDescription ? ` ${ids.description}-err` : ""}`}
          className={cn(field, fieldBorder(!!errors.projectDescription), "resize-y py-3")}
          {...register("projectDescription")}
        />
        <p id={`${ids.description}-hint`} className="mt-1.5 text-sm text-fg-3">
          What are you building, for which platforms, and what&apos;s your timeline? Please don&apos;t include passwords or confidential data.
        </p>
        {errorText(`${ids.description}-err`, errors.projectDescription?.message)}
      </div>

      <div>
        <div className="flex items-start gap-3">
          <input
            id={ids.consent}
            type="checkbox"
            aria-required="true"
            aria-invalid={!!errors.consent}
            aria-describedby={errors.consent ? `${ids.consent}-err` : undefined}
            className="mt-1 size-5 shrink-0 rounded border-line bg-ink-900 accent-[var(--color-accent)]"
            {...register("consent")}
          />
          <label htmlFor={ids.consent} className="text-sm leading-relaxed text-fg-2">
            {consentText}{" "}
            <Link href="/privacy" className="text-indigo-200 underline underline-offset-4 hover:text-white">
              Read the Privacy Policy
            </Link>
            <span aria-hidden="true"> *</span>
          </label>
        </div>
        {errorText(`${ids.consent}-err`, errors.consent?.message)}
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto" aria-disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Sending…
          </>
        ) : (
          <>
            {delivery === "email" ? "Send inquiry by email" : "Send inquiry"} <Send className="size-4" aria-hidden="true" />
          </>
        )}
      </Button>
      {delivery === "email" && contactEmail ? (
        <p className="text-sm text-fg-3">
          This opens your email app with your message addressed to {contactEmail}. Prefer to write yourself?{" "}
          <a href={`mailto:${contactEmail}`} className="text-indigo-200 underline underline-offset-4 hover:text-white">
            Email us directly
          </a>
          .
        </p>
      ) : null}
    </form>
  );
}
