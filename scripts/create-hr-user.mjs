#!/usr/bin/env node
// ---------------------------------------------------------------------------
// create-hr-user.mjs
// ---------------------------------------------------------------------------
// Local/dev-only bootstrap tool for creating the FIRST (or additional) HR
// staff account. This is a standalone Node script — it is never imported by
// the Next.js app, never bundled into any route or Client Component, and is
// not reachable over HTTP. It is meant to be run by a developer directly
// from their terminal.
//
// Why this exists:
//   `profiles` has no client-facing INSERT policy (see
//   supabase/migrations/001_initial_schema.sql), so no anon/authenticated
//   request — including a signup form — can ever create or choose the role
//   of a profile row. Provisioning HR/admin staff therefore requires a
//   trusted, server-only path using the Supabase secret ("service role")
//   key, which is exactly what this script is.
//
// Security notes:
//   * SUPABASE_SECRET_KEY must NEVER be prefixed with NEXT_PUBLIC_, must
//     never be committed, and must never be imported by any file under
//     `src/`. It bypasses Row Level Security entirely — treat it like a
//     database superuser password.
//   * This script only ever INSERTs a new profile row; it never UPDATEs an
//     existing one. That means it can never be used to change an existing
//     user's role, so it never needs to (and does not) touch the
//     `prevent_role_self_escalation` trigger's code path.
//   * The role is a fixed CLI/env argument controlled only by whoever runs
//     this script on their own machine — it is never derived from anything
//     a browser client sends.
//
// Usage (see docs/create-hr-user.md for full setup steps):
//   npm run create-hr-user -- --email="hr@example.com" --password="Str0ngPass!" --name="Jane Doe" --role=admin
// ---------------------------------------------------------------------------

import { createClient } from "@supabase/supabase-js";

function parseArgs(argv) {
  const args = {};
  for (const arg of argv) {
    const match = /^--([^=]+)=(.*)$/.exec(arg);
    if (match) {
      args[match[1]] = match[2];
    }
  }
  return args;
}

function fail(message) {
  console.error(`\nError: ${message}\n`);
  process.exit(1);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl) {
    fail("NEXT_PUBLIC_SUPABASE_URL is not set. Run via: npm run create-hr-user -- ...");
  }
  if (!secretKey) {
    fail(
      "SUPABASE_SECRET_KEY is not set.\n" +
        "Add it to .env.local (server-only, never NEXT_PUBLIC_-prefixed).\n" +
        "See docs/create-hr-user.md for where to find it in the Supabase dashboard."
    );
  }

  const email = (args.email ?? process.env.HR_ADMIN_EMAIL ?? "").trim();
  const password = args.password ?? process.env.HR_ADMIN_PASSWORD ?? "";
  const fullName = (args.name ?? process.env.HR_ADMIN_NAME ?? "").trim();
  const role = (args.role ?? process.env.HR_ADMIN_ROLE ?? "admin").trim();

  if (!email || !password || !fullName) {
    fail(
      "Missing required arguments.\n\n" +
        "Usage:\n" +
        '  npm run create-hr-user -- --email="you@example.com" --password="StrongPassword123!" --name="Jane Doe" [--role=admin|hr]'
    );
  }

  if (role !== "admin" && role !== "hr") {
    fail('--role must be either "admin" or "hr".');
  }

  if (password.length < 8) {
    fail("Password must be at least 8 characters.");
  }

  const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailPattern.test(email)) {
    fail("Email address is not in a valid format.");
  }

  // Admin client: uses the secret key and therefore bypasses RLS. Only ever
  // used here, inside this standalone script — never in app code.
  const supabaseAdmin = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`Looking for an existing profile for ${email}...`);

  const { data: existingProfile, error: existingProfileError } =
    await supabaseAdmin
      .from("profiles")
      .select("id, role, is_active")
      .eq("email", email)
      .maybeSingle();

  if (existingProfileError) {
    fail(`Failed to check for an existing profile: ${existingProfileError.message}`);
  }

  if (existingProfile) {
    console.log(
      `\nA profile already exists for ${email} (role: ${existingProfile.role}, ` +
        `active: ${existingProfile.is_active}).\n` +
        "This script only creates new profiles and will not modify an existing one.\n" +
        "To change a role, sign in as an existing admin and use the (future) HR " +
        "management UI, or update it directly via the Supabase SQL editor."
    );
    return;
  }

  console.log("Looking for an existing Supabase Auth user with this email...");

  let userId;
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    fail(`Failed to look up existing auth users: ${listError.message}`);
  }

  const existingUser = listData.users.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase()
  );

  if (existingUser) {
    userId = existingUser.id;
    console.log(`Found existing auth user (id: ${userId}). Reusing it.`);
  } else {
    console.log("Creating a new Supabase Auth user...");
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError || !created?.user) {
      fail(`Failed to create auth user: ${createError?.message ?? "unknown error"}`);
    }

    userId = created.user.id;
    console.log(`Created auth user (id: ${userId}).`);
  }

  console.log(`Creating profile with role "${role}"...`);

  const { error: insertError } = await supabaseAdmin.from("profiles").insert({
    id: userId,
    email,
    full_name: fullName,
    role,
    is_active: true,
  });

  if (insertError) {
    fail(`Failed to create profile: ${insertError.message}`);
  }

  console.log("\nHR account is ready:");
  console.log(`  Email: ${email}`);
  console.log(`  Role:  ${role}`);
  console.log("\nYou can now sign in at /hr/login with this email and the password you provided.");
}

main().catch((error) => {
  console.error("\nUnexpected error:", error?.message ?? error);
  process.exit(1);
});
