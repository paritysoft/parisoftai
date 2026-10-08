import { z } from "zod";

/** Shared between the contact form (client) and the /api/contact route (server). */
export const leadSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(120, "Name is too long."),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("Please enter a valid email address.")),
  companyName: z.string().trim().max(160, "Company name is too long.").optional().default(""),
  serviceRequired: z.string().trim().min(1, "Please choose a service.").max(120),
  estimatedBudget: z.string().trim().max(80).optional().default(""),
  preferredTimeline: z.string().trim().max(80).optional().default(""),
  projectDescription: z
    .string()
    .trim()
    .min(20, "Please add a little more detail (at least 20 characters).")
    .max(5000, "Please keep the description under 5,000 characters."),
  consent: z.literal(true, { error: "Please confirm you agree to us storing your inquiry." }),
});

/** Anti-spam metadata sent alongside the form fields. */
export const submissionMetaSchema = z.object({
  submissionId: z.uuid(),
  /** Honeypot — must be empty. */
  website: z.string().max(0).optional().default(""),
  /** Milliseconds the form was open before submitting. */
  elapsedMs: z.number().int().nonnegative(),
});

export const contactRequestSchema = leadSchema.and(submissionMetaSchema);

export type LeadInput = z.input<typeof leadSchema>;
export type LeadData = z.output<typeof leadSchema>;
export type ContactRequest = z.output<typeof contactRequestSchema>;
