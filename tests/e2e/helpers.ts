import { expect, type Page } from "@playwright/test";
import pg from "pg";

export const hasStack = Boolean(process.env.STACK_PG_PORT);
export const PASSWORD = "Test-password-123!";
export const USERS = {
  superadmin: "owner@test.local",
  admin: "admin@test.local",
  editor: "editor@test.local",
} as const;

export async function db() {
  const client = new pg.Client({ host: "127.0.0.1", port: Number(process.env.STACK_PG_PORT), user: "postgres", database: "postgres" });
  await client.connect();
  return client;
}

export async function login(page: Page, who: keyof typeof USERS) {
  await page.context().clearCookies();
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(USERS[who]);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

/** Wait until the contact form's anti-bot minimum fill time has passed. */
export const waitFillTime = (page: Page) => page.waitForTimeout(2700);
