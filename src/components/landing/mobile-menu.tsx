"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import type { LandingAuthState } from "@/lib/public/landing-auth";
import { logout as candidateLogout } from "@/lib/candidate-auth/actions";
import { logout as hrLogout } from "@/lib/auth/actions";
import { RB_BTN_PRIMARY } from "@/lib/ui/premium";

type NavLink = { href: string; label: string };

const linkClass =
  "rounded-xl px-3 py-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white";

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
        className="rounded-xl p-2.5 text-zinc-200 transition-colors hover:bg-white/10"
      >
        {open ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="absolute inset-x-0 top-16 overflow-hidden border-b border-white/10 bg-[#0a0a10]/95 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
          >
            <nav className="flex flex-col gap-1 px-4 py-4" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={linkClass}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-4">
                {auth.kind === "candidate" ? (
                  <>
                    <Link href="/candidate" onClick={() => setOpen(false)} className={linkClass}>
                      Dashboard
                    </Link>
                    <Link
                      href="/candidate/profile"
                      onClick={() => setOpen(false)}
                      className={linkClass}
                    >
                      Profile
                    </Link>
                    <form action={candidateLogout}>
                      <button type="submit" className={`w-full text-left ${linkClass}`}>
                        Log out
                      </button>
                    </form>
                  </>
                ) : auth.kind === "hr" ? (
                  <>
                    <Link
                      href="/hr"
                      onClick={() => setOpen(false)}
                      className={`${RB_BTN_PRIMARY} justify-center`}
                    >
                      HR Dashboard
                    </Link>
                    <form action={hrLogout}>
                      <button type="submit" className={`w-full text-left ${linkClass}`}>
                        Log out
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/hr/login" onClick={() => setOpen(false)} className={linkClass}>
                      HR Login
                    </Link>
                    <Link
                      href="/candidate/login"
                      onClick={() => setOpen(false)}
                      className={linkClass}
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/candidate/signup"
                      onClick={() => setOpen(false)}
                      className={`${RB_BTN_PRIMARY} justify-center`}
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
