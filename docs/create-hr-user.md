# Creating the first HR account (local/dev)

There is intentionally **no public sign-up page** for the HR portal, and no
API endpoint that lets a browser client choose its own role. The `profiles`
table has no client-facing `INSERT` policy at all (see
`supabase/migrations/001_initial_schema.sql`), so HR/admin accounts can only
be provisioned by a trusted, server-side process.

`scripts/create-hr-user.mjs` is that process. It is a standalone Node script
you run from your own terminal — it is never imported by the Next.js app,
never bundled into any page or route, and is not reachable over HTTP.

## 1. Get your Supabase secret key

1. Open your project in the [Supabase dashboard](https://supabase.com/dashboard).
2. Go to **Project Settings → API Keys**.
3. Copy the **secret key** (starts with `sb_secret_...`). This is the
   privileged key that bypasses Row Level Security — treat it like a
   database superuser password.
   - Do **not** confuse it with the `publishable` key already in
     `.env.local` — that one is safe for the browser, this one is not.

## 2. Add it to `.env.local`

Add a new line to `.env.local` (already git-ignored):

```
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxxxxxxxxxxxxxxxxx
```

Notes:

- The variable name has **no** `NEXT_PUBLIC_` prefix. Next.js only inlines
  `NEXT_PUBLIC_*` variables into client bundles, so this stays server-only
  by construction.
- Never import this key, or any module that reads it, from code under
  `src/` that could run in a Client Component. It is only ever read by the
  standalone script below.
- Never commit it, print it, or paste it into logs/issues.

## 3. Run the script

```bash
npm run create-hr-user -- --email="hr@yourcompany.com" --password="ChooseA-Str0ngPassword!" --name="Jane Doe" --role=admin
```

Arguments:

| Flag         | Required | Default | Notes                                   |
| ------------ | -------- | ------- | ---------------------------------------- |
| `--email`    | yes      | —       | Must be a valid email address             |
| `--password` | yes      | —       | Minimum 8 characters                      |
| `--name`     | yes      | —       | Stored as `full_name` on the profile      |
| `--role`     | no       | `admin` | Must be `admin` or `hr`                   |

For the very first account, keep `--role=admin` — only admins can change
other profiles' roles later (enforced by the `prevent_role_self_escalation`
trigger), so the first user needs to be an admin to manage anyone else.

What the script does, in order:

1. Checks whether a `profiles` row already exists for that email. If so, it
   reports the existing role and **stops without changing anything** — it
   never updates an existing profile or role.
2. Looks for an existing Supabase Auth user with that email; reuses it if
   found, otherwise creates one via the Auth Admin API with the email
   already confirmed (no confirmation email, no public sign-up flow).
3. Inserts a new `profiles` row for that user with the role you specified.

This is safe to re-run — it will never overwrite an existing account.

## 4. Sign in

Go to `/hr/login` and sign in with the email/password you provided. You
should land on `/hr` as an authenticated HR/admin user.

## Notes on security

- This script requires the secret key, which only you (as the developer)
  have locally. It cannot be triggered from the browser, from a Server
  Action, or from any deployed route.
- It never weakens RLS or any trigger — it uses the secret key's existing
  ability to bypass RLS for this one legitimate bootstrap purpose, the same
  pattern the schema already reserves for trusted server-only writes (see
  the comments in `001_initial_schema.sql`).
- To create additional HR/admin accounts later, prefer building an
  in-app "invite" flow (as an admin, from `/hr`) rather than reusing this
  script in production. This script is a local/dev convenience tool.
