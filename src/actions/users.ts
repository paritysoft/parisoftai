"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ActionError, withPermission, type ActionResult } from "@/lib/auth/actions";
import { audit } from "@/lib/audit";
import { isServiceRoleConfigured } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/service";
import { absoluteUrl } from "@/lib/site";
import { STAFF_ROLES } from "@/types/content";

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email.")),
  fullName: z.string().trim().max(120).default(""),
  role: z.enum(STAFF_ROLES),
});

/**
 * Invites a new admin user. There is no public sign-up: accounts exist only through invites
 * (or the bootstrap script). Requires the secret key server-side, after the super-admin check.
 */
export async function inviteUserAction(input: unknown): Promise<ActionResult> {
  return withPermission("users.manage", async (ctx) => {
    const parsed = inviteSchema.safeParse(input);
    if (!parsed.success) throw new ActionError(parsed.error.issues[0]?.message ?? "Invalid input.");
    if (!isServiceRoleConfigured()) throw new ActionError("Inviting users requires SUPABASE_SECRET_KEY on the server.");
    const admin = createServiceClient();
    const { email, fullName, role } = parsed.data;
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo: absoluteUrl("/auth/confirm?next=/admin/account/password"),
    });
    if (error || !data.user) throw new ActionError(error?.message.includes("already") ? "A user with this email already exists." : "Could not send the invitation.");
    // The profile row is created by a database trigger; assign the role explicitly.
    const { error: roleError } = await admin.from("profiles").update({ role, full_name: fullName || null }).eq("id", data.user.id);
    if (roleError) throw new ActionError("Invitation sent, but the role could not be assigned. Set it from the users list.");
    await audit(ctx, "user.invite", "user", data.user.id, `Invited user as ${role}`);
    revalidatePath("/admin/users");
    return { ok: true, message: `Invitation sent to ${email}.` };
  });
}

export async function setUserRoleAction(userId: string, role: string): Promise<ActionResult> {
  return withPermission("users.manage", async (ctx) => {
    if (!z.uuid().safeParse(userId).success || !(STAFF_ROLES as readonly string[]).includes(role)) throw new ActionError("Invalid input.");
    // set_staff_role re-checks super-admin rights and prevents removing the last super admin.
    const { error } = await ctx.supabase.rpc("set_staff_role", { target: userId, new_role: role });
    if (error) throw new ActionError(error.message.includes("super admin") ? error.message : "Could not change the role.");
    await audit(ctx, "user.role_change", "user", userId, `Role changed to ${role}`);
    revalidatePath("/admin/users");
    return { ok: true, message: "Role updated." };
  });
}

export async function setUserActiveAction(userId: string, active: boolean): Promise<ActionResult> {
  return withPermission("users.manage", async (ctx) => {
    if (!z.uuid().safeParse(userId).success) throw new ActionError("Invalid user.");
    const { error } = await ctx.supabase.rpc("set_staff_active", { target: userId, active: Boolean(active) });
    if (error) throw new ActionError(/super admin|own account/.test(error.message) ? error.message : "Could not change account status.");
    await audit(ctx, active ? "user.activate" : "user.deactivate", "user", userId, active ? "Reactivated user" : "Deactivated user");
    revalidatePath("/admin/users");
    return { ok: true, message: active ? "User reactivated." : "User deactivated. They can no longer access the admin." };
  });
}
