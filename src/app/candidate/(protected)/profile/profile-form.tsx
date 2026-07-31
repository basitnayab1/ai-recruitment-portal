"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { FloatingInput } from "@/components/candidate/ui/floating-input";
import { updateCandidateProfile, type UpdateProfileState } from "@/lib/candidate/profile-actions";
import { ALERT_ERROR, BTN_PRIMARY, FIELD_INPUT } from "@/lib/ui/classes";

const initialState: UpdateProfileState = undefined;

export function ProfileForm({
  fullName,
  email,
  phone,
}: {
  fullName: string;
  email: string;
  phone: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateCandidateProfile, initialState);

  useEffect(() => {
    if (state?.status === "success") {
      toast.success(state.message);
    } else if (state?.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FloatingInput
        id="fullName"
        label="Full Name"
        defaultValue={fullName}
        required
        disabled={pending}
      />

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
          Email
        </label>
        <input
          id="email"
          type="email"
          defaultValue={email}
          disabled
          className={`${FIELD_INPUT} opacity-70`}
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Your email address cannot be changed.</p>
      </div>

      <FloatingInput
        id="phone"
        label="Phone"
        type="tel"
        defaultValue={phone ?? ""}
        disabled={pending}
      />

      {state?.status === "error" ? (
        <p role="alert" className={ALERT_ERROR}>
          {state.message}
        </p>
      ) : null}

      <motion.button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        whileHover={{ scale: pending ? 1 : 1.02 }}
        whileTap={{ scale: pending ? 1 : 0.98 }}
        className={BTN_PRIMARY}
      >
        {pending ? "Saving…" : "Save Profile"}
      </motion.button>
    </form>
  );
}
