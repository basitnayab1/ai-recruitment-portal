"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  resetCandidatePassword,
  type ResetPasswordState,
} from "@/lib/candidate-auth/actions";
import {
  evaluatePasswordStrength,
  PASSWORD_REQUIREMENTS,
} from "@/lib/auth/password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ALERT_ERROR, BTN_PRIMARY, SURFACE_CARD } from "@/lib/ui/classes";

const initialState: ResetPasswordState = undefined;

function strengthBarClass(score: number): string {
  if (score <= 1) return "bg-red-500";
  if (score === 2) return "bg-orange-500";
  if (score === 3) return "bg-amber-400";
  if (score === 4) return "bg-lime-400";
  return "bg-emerald-400";
}

function strengthLabelClass(score: number): string {
  if (score <= 1) return "text-red-300";
  if (score === 2) return "text-orange-300";
  if (score === 3) return "text-amber-300";
  if (score === 4) return "text-lime-300";
  return "text-emerald-300";
}

function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  disabled,
  visible,
  onToggleVisible,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  visible: boolean;
  onToggleVisible: () => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="pr-11"
          required
        />
        <button
          type="button"
          onClick={onToggleVisible}
          disabled={disabled}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-zinc-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30 disabled:opacity-50"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export function ResetPasswordForm() {
  const formId = useId();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(resetCandidatePassword, initialState);
  const handledKeyRef = useRef<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = evaluatePasswordStrength(newPassword);
  const strengthPercent = Math.round((strength.score / strength.max) * 100);

  useEffect(() => {
    if (!state) return;
    const key = `${state.status}:${state.message}`;
    if (handledKeyRef.current === key) return;
    handledKeyRef.current = key;

    if (state.status === "success") {
      toast.success(state.message);
      router.replace("/candidate");
    }
  }, [state, router]);

  return (
    <form action={formAction} className={`space-y-5 p-8 ${SURFACE_CARD}`} noValidate>
      <PasswordField
        id={`${formId}-new`}
        name="newPassword"
        label="New Password"
        value={newPassword}
        onChange={setNewPassword}
        disabled={pending}
        visible={showNew}
        onToggleVisible={() => setShowNew((value) => !value)}
      />

      <div className="space-y-2 rounded-xl border border-white/10 bg-[#12121a] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-zinc-300">Password strength</p>
          <p className={`text-xs font-semibold ${strengthLabelClass(strength.score)}`}>
            {newPassword ? strength.label : "—"}
          </p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-300 ${strengthBarClass(strength.score)}`}
            style={{ width: newPassword ? `${Math.max(strengthPercent, 8)}%` : "0%" }}
          />
        </div>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {PASSWORD_REQUIREMENTS.map((requirement) => {
            const met = strength.met[requirement.id];
            return (
              <li
                key={requirement.id}
                className={`text-[11px] ${met ? "text-emerald-300" : "text-zinc-500"}`}
              >
                {met ? "✓" : "○"} {requirement.label}
              </li>
            );
          })}
        </ul>
      </div>

      <PasswordField
        id={`${formId}-confirm`}
        name="confirmPassword"
        label="Confirm New Password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        disabled={pending}
        visible={showConfirm}
        onToggleVisible={() => setShowConfirm((value) => !value)}
      />

      {confirmPassword && confirmPassword !== newPassword ? (
        <p role="alert" className="text-xs text-red-300">
          Passwords do not match.
        </p>
      ) : null}

      {state?.status === "error" ? (
        <p role="alert" className={ALERT_ERROR}>
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} aria-busy={pending} className={`${BTN_PRIMARY} w-full`}>
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Updating…
          </>
        ) : (
          "Set new password"
        )}
      </Button>
    </form>
  );
}
