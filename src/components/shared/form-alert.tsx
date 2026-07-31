import { ALERT_ERROR, ALERT_SUCCESS, ALERT_WARNING } from "@/lib/ui/classes";

type FormAlertVariant = "success" | "error" | "warning";

const VARIANT_CLASS: Record<FormAlertVariant, string> = {
  success: ALERT_SUCCESS,
  error: ALERT_ERROR,
  warning: ALERT_WARNING,
};

export function FormAlert({
  variant,
  children,
  role = variant === "error" ? "alert" : "status",
}: {
  variant: FormAlertVariant;
  children: React.ReactNode;
  role?: "alert" | "status";
}) {
  return (
    <p role={role} className={VARIANT_CLASS[variant]}>
      {children}
    </p>
  );
}
