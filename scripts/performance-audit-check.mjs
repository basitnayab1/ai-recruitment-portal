/**
 * Static performance regression checks.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

assert(
  read("src/lib/candidate/profile-data.ts").includes("cache("),
  "profile details must use React cache()"
);
assert(
  read("src/lib/candidate/dashboard-data.ts").includes(".limit(MAX_RECENT_APPLICATIONS)"),
  "candidate dashboard must limit recent applications"
);
assert(
  read("src/lib/hr/jobs-data.ts").includes('.in("job_id", pageJobIds)'),
  "HR jobs page must scope application counts to page job ids"
);
assert(
  read("src/lib/hr/analytics/stats.ts").includes('{ count: "exact", head: true }'),
  "analytics must use head counts"
);
assert(
  read("src/lib/public/landing-data.ts").includes("unstable_cache"),
  "landing stats must use unstable_cache"
);
assert(
  read("src/app/hr/(protected)/layout.tsx").includes("HRCopilotLazy"),
  "HR layout must lazy-load copilot"
);
assert(
  read("src/components/hr/copilot/hr-copilot-widget.tsx").includes(
    "copilot-suggested-prompts"
  ),
  "copilot widget must import client-safe prompts"
);
assert(
  read("src/lib/public/jobs-data.ts").includes("PUBLIC_JOBS_PAGE_SIZE"),
  "public jobs must paginate"
);
assert(
  existsSync(join(root, "supabase/migrations/030_perf_hot_path_indexes.sql")),
  "missing 030 indexes migration"
);
assert(
  read("next.config.ts").includes("optimizePackageImports"),
  "next.config must optimize package imports"
);

if (failures.length) {
  console.error("PERFORMANCE AUDIT CHECK FAILED:");
  for (const f of failures) console.error(" -", f);
  process.exit(1);
}

console.log("PERFORMANCE AUDIT CHECK PASSED");
