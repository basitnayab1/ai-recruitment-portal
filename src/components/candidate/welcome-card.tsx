import { CHART_CARD } from "@/lib/ui/classes";

export function WelcomeCard({
  fullName,
  todayLabel,
}: {
  fullName: string;
  todayLabel: string;
}) {
  const firstName = fullName.split(" ")[0];

  return (
    <div className={`${CHART_CARD} sm:p-8`}>
      <p className="text-sm font-medium text-zinc-400">{todayLabel}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
        Welcome back, {firstName}
      </h1>
      <p className="mt-2 text-sm text-zinc-400">
        Manage your profile and job applications.
      </p>
    </div>
  );
}
