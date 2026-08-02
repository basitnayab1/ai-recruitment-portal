/**
 * Tool catalog exposed to the LLM planner.
 * The model chooses tools — users never see these names.
 */

import type { CopilotToolName } from "@/lib/ai/hr-tools";

export type AgentToolDefinition = {
  type: "function";
  function: {
    name: CopilotToolName;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      additionalProperties?: boolean;
    };
  };
};

const limitProp = {
  type: "number",
  description: "Max rows to return (1-20).",
};

const candidateQueryProp = {
  type: "string",
  description: "Candidate name or partial name filter.",
};

const jobQueryProp = {
  type: "string",
  description: "Job title / role keyword filter (e.g. Developer, Angular).",
};

/** OpenAI/Groq-compatible tool schemas for the HR agent. */
export const HR_AGENT_TOOL_DEFINITIONS: AgentToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "searchCandidates",
      description:
        "List or search candidates by name/skill. For hire/ranking questions prefer searchAIRanking + getHiringRecommendation instead of this alone.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Name search" },
          skill: { type: "string" },
          limit: limitProp,
          todayOnly: { type: "boolean" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "searchApplications",
      description:
        "Search job applications. Use for who applied, today's applications, status filters, volume by job.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string" },
          jobQuery: jobQueryProp,
          todayOnly: { type: "boolean" },
          thisWeekOnly: { type: "boolean" },
          limit: limitProp,
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "searchJobs",
      description:
        "Search job openings / vacancies / positions. For empty pipelines / jobs with no applicants, also call searchApplications.",
      parameters: {
        type: "object",
        properties: {
          query: jobQueryProp,
          status: { type: "string", description: "published | draft | closed" },
          limit: limitProp,
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "searchInterviews",
      description: "Search interviews (today, upcoming, scheduled, cancelled).",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string" },
          todayOnly: { type: "boolean" },
          upcomingOnly: { type: "boolean" },
          limit: limitProp,
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "searchResumeAnalysis",
      description:
        "Fetch AI resume analysis: scores, strengths, weaknesses, missing skills, recommendations.",
      parameters: {
        type: "object",
        properties: {
          candidateQuery: candidateQueryProp,
          jobQuery: jobQueryProp,
          skill: { type: "string" },
          topN: limitProp,
          focus: {
            type: "string",
            description: "all | strengths | weaknesses | missingSkills | recommendation",
          },
          orderBy: { type: "string", description: "score | date" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "searchAIRanking",
      description:
        "Fetch AI candidate rankings / leaderboard / best or worst AI scores. Required for who-to-hire and top-candidate questions.",
      parameters: {
        type: "object",
        properties: {
          candidateQuery: candidateQueryProp,
          jobQuery: jobQueryProp,
          topN: limitProp,
          orderBy: { type: "string", description: "score | rank" },
          ascending: { type: "boolean" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getCandidateProfile",
      description: "Get a specific candidate profile / biography / contact details.",
      parameters: {
        type: "object",
        properties: {
          query: candidateQueryProp,
          limit: limitProp,
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "matchJobCandidates",
      description: "Find best-matching candidates for a specific job title/role.",
      parameters: {
        type: "object",
        properties: {
          jobQuery: jobQueryProp,
          topN: limitProp,
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "compareCandidates",
      description: "Compare two or more candidates side by side.",
      parameters: {
        type: "object",
        properties: {
          names: { type: "array", items: { type: "string" } },
          topN: { type: "number" },
          jobQuery: jobQueryProp,
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getHiringRecommendation",
      description:
        "Produce a structured hire / hire-with-reservations / do-not-hire recommendation from live AI data.",
      parameters: {
        type: "object",
        properties: {
          candidateQuery: candidateQueryProp,
          jobQuery: jobQueryProp,
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyzeSkillGaps",
      description: "Analyze missing skills, who knows a skill, or skill gaps vs roles.",
      parameters: {
        type: "object",
        properties: {
          mode: { type: "string", description: "missing | knows | lacks | weak" },
          skill: { type: "string" },
          candidateQuery: candidateQueryProp,
          jobQuery: jobQueryProp,
          topN: limitProp,
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getInterviewPriority",
      description: "Who should be interviewed first / interview priority order.",
      parameters: {
        type: "object",
        properties: {
          jobQuery: jobQueryProp,
          topN: limitProp,
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getSalaryRecommendation",
      description: "Suggest salary bands for candidates based on live profile signals.",
      parameters: {
        type: "object",
        properties: {
          candidateQuery: candidateQueryProp,
          jobQuery: jobQueryProp,
          topN: limitProp,
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyzeHiringRisks",
      description: "Assess hiring risks for candidates (missing skills, experience, confidence).",
      parameters: {
        type: "object",
        properties: {
          candidateQuery: candidateQueryProp,
          jobQuery: jobQueryProp,
          topN: limitProp,
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "explainAIDecision",
      description: "Explain why a candidate is ranked / scored / recommended a certain way.",
      parameters: {
        type: "object",
        properties: {
          candidateQuery: candidateQueryProp,
          jobQuery: jobQueryProp,
          topN: limitProp,
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generateDecisionReport",
      description: "Generate a full hiring decision report for a candidate.",
      parameters: {
        type: "object",
        properties: {
          candidateQuery: candidateQueryProp,
          jobQuery: jobQueryProp,
          topN: limitProp,
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getHRAnalytics",
      description:
        "HR analytics: trends, application volumes, departments, open/closed jobs, average scores.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "getPredictions",
      description: "Predict hiring difficulty, time-to-fill, skill shortages, hiring probability.",
      parameters: {
        type: "object",
        properties: {
          jobQuery: jobQueryProp,
          topN: limitProp,
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getSmartAlerts",
      description:
        "Operational alerts: interviews today, waiting review, high scores unreviewed, jobs closing, missing AI scores.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "generateAgentEmail",
      description: "Draft HR emails (interview invite, offer, rejection, shortlist, follow-up).",
      parameters: {
        type: "object",
        properties: {
          emailType: { type: "string" },
          candidateQuery: candidateQueryProp,
          jobQuery: jobQueryProp,
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generateAgentReport",
      description: "Generate recruitment / hiring / interview / management reports.",
      parameters: {
        type: "object",
        properties: {
          reportType: { type: "string" },
          jobQuery: jobQueryProp,
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getDashboardStats",
      description: "High-level dashboard totals (candidates, jobs, applications, interviews).",
      parameters: { type: "object", properties: {} },
    },
  },
];

export const HR_AGENT_TOOL_NAMES = new Set(
  HR_AGENT_TOOL_DEFINITIONS.map((t) => t.function.name)
);

export function isKnownAgentTool(name: string): name is CopilotToolName {
  return HR_AGENT_TOOL_NAMES.has(name as CopilotToolName);
}
