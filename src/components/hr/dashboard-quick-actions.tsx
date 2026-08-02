import Link from "next/link";
import { ArrowRight, FileText, Plus, Users } from "lucide-react";
import { SURFACE_CARD_INTERACTIVE } from "@/lib/ui/classes";

const actions = [
  {
    href: "/hr/jobs/new",
    label: "Create Job",
    description: "Post a new opening",
    icon: Plus,
    gradient: "from-violet-500 to-purple-600",
  },
  {
    href: "/hr/applications",
    label: "Applications",
    description: "Review the pipeline",
    icon: FileText,
    gradient: "from-blue-500 to-cyan-600",
  },
  {
    href: "/hr/candidates",
    label: "Candidates",
    description: "Browse profiles",
    icon: Users,
    gradient: "from-emerald-500 to-teal-600",
  },
] as const;

export function DashboardQuickActions() {
  return (
    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 lg:max-w-2xl">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className={`group flex items-center gap-3 px-4 py-3.5 ${SURFACE_CARD_INTERACTIVE}`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-md ${action.gradient}`}
          >
            <action.icon className="h-4.5 w-4.5 text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white">{action.label}</p>
            <p className="text-xs text-zinc-400">{action.description}</p>
          </div>
          <ArrowRight
            className="h-4 w-4 shrink-0 text-zinc-200 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-300"
            aria-hidden="true"
          />
        </Link>
      ))}
    </div>
  );
}
