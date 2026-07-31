"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import type { LandingAuthState } from "@/lib/public/landing-auth";
import { logout as candidateLogout } from "@/lib/candidate-auth/actions";
import { logout as hrLogout } from "@/lib/auth/actions";

type NavLink = { href: string; label: string };

export function MobileMenu({
  navLinks,
  auth,
}: {
  navLinks: NavLink[];
  auth: LandingAuthState;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        className="rounded-lg p-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
      >
        {open ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="absolute inset-x-0 top-16 overflow-hidden border-b border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
          >
            <nav className="flex flex-col gap-1 px-4 py-4" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                {auth.kind === "candidate" ? (
                  <>
                    <Link
                      href="/candidate"
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/candidate/profile"
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    >
                      Profile
                    </Link>
                    <form action={candidateLogout}>
                      <button
                        type="submit"
                        className="w-full rounded-lg px-3 py-2.5 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                      >
                        Log out
                      </button>
                    </form>
                  </>
                ) : auth.kind === "hr" ? (
                  <>
                    <Link
                      href="/hr"
                      onClick={() => setOpen(false)}
                      className="rounded-full bg-zinc-900 px-3 py-2.5 text-center text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      HR Dashboard
                    </Link>
                    <form action={hrLogout}>
                      <button
                        type="submit"
                        className="w-full rounded-lg px-3 py-2.5 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                      >
                        Log out
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link
                      href="/hr/login"
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    >
                      HR Login
                    </Link>
                    <Link
                      href="/candidate/login"
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-2.5 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/candidate/signup"
                      onClick={() => setOpen(false)}
                      className="rounded-full bg-zinc-900 px-3 py-2.5 text-center text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
