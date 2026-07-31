import { CHART_CARD } from "@/lib/ui/classes";

const longDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

export function WelcomeCard({ fullName }: { fullName: string }) {
  const firstName = fullName.split(" ")[0];

  return (
    <div className={`${CHART_CARD} sm:p-8`}>
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {longDateFormatter.format(new Date())}
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Welcome back, {firstName}
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Manage your profile and job applications.
      </p>
    </div>
  );
}
