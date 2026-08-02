import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  emptyResumeAnalysis,
  InterviewGeneratorError,
  normalizeInterviewQuestions,
  type InterviewQuestions,
  type ResumeAnalysis,
} from "@/lib/ai/types";

const LOG = "[hr/interview-questions-data]";

function throwSaveError(operation: "insert" | "update", message: string): never {
  console.error(`${LOG} ${operation} failed:`, message);

  if (/Could not find the table|schema cache/i.test(message) || /ai_interview_questions/i.test(message)) {
    throw new InterviewGeneratorError(
      "Database table ai_interview_questions is missing. " +
        "Open the Supabase SQL Editor and run supabase/migrations/024_ai_interview_questions.sql, then try again."
    );
  }

  throw new InterviewGeneratorError(`Failed to ${operation} interview questions: ${message}`);
}

export type StoredInterviewQuestions = {
  id: string;
  candidateId: string;
  applicationId: string;
  questions: InterviewQuestions;
  createdAt: string;
  updatedAt: string;
};

type AiInterviewQuestionsRow = {
  id: string;
  candidate_id: string;
  application_id: string;
  questions_json: unknown;
  created_at: string;
  updated_at: string;
};

function mapRow(row: AiInterviewQuestionsRow, resumeAnalysis: ResumeAnalysis): StoredInterviewQuestions {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    applicationId: row.application_id,
    questions: normalizeInterviewQuestions(row.questions_json, resumeAnalysis),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Loads cached interview questions for an application.
 * Returns null when no cache entry exists.
 */
export async function getCachedInterviewQuestions(
  applicationId: string,
  resumeAnalysis: ResumeAnalysis
): Promise<StoredInterviewQuestions | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_interview_questions")
    .select("*")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (error) {
    console.error(`${LOG} Cache lookup failed:`, error.message);
    if (/Could not find the table|schema cache/i.test(error.message)) {
      throw new InterviewGeneratorError(
        "Database table ai_interview_questions is missing. " +
          "Open the Supabase SQL Editor and run supabase/migrations/024_ai_interview_questions.sql, then try again."
      );
    }
    return null;
  }

  if (!data) {
    return null;
  }

  return mapRow(data as AiInterviewQuestionsRow, resumeAnalysis);
}

/**
 * Loads cached interview questions without requiring resume analysis for normalization.
 * Used on page load when analysis may not be available yet.
 */
export async function getInterviewQuestionsByApplicationId(
  applicationId: string
): Promise<Omit<StoredInterviewQuestions, "questions"> & { questions: InterviewQuestions | null } | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_interview_questions")
    .select("*")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as AiInterviewQuestionsRow;
  const questionsRaw = row.questions_json;
  const fallbackAnalysis = emptyResumeAnalysis();

  return {
    id: row.id,
    candidateId: row.candidate_id,
    applicationId: row.application_id,
    questions: questionsRaw ? normalizeInterviewQuestions(questionsRaw, fallbackAnalysis) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type SaveInterviewQuestionsInput = {
  candidateId: string;
  applicationId: string;
  questions: InterviewQuestions;
};

/**
 * Inserts or updates cached interview questions for an application.
 */
export async function saveInterviewQuestions(
  input: SaveInterviewQuestionsInput
): Promise<StoredInterviewQuestions> {
  console.log(`${LOG} save:start`, {
    candidateId: input.candidateId,
    applicationId: input.applicationId,
  });

  const supabase = await createClient();

  const payload = {
    candidate_id: input.candidateId,
    application_id: input.applicationId,
    questions_json: input.questions,
    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: existingError } = await supabase
    .from("ai_interview_questions")
    .select("id")
    .eq("application_id", input.applicationId)
    .maybeSingle();

  if (existingError) {
    throwSaveError("insert", existingError.message);
  }

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from("ai_interview_questions")
      .update(payload)
      .eq("application_id", input.applicationId)
      .select("*")
      .single();

    if (updateError || !updated) {
      throwSaveError("update", updateError?.message ?? "Failed to update interview questions.");
    }

    console.log(`${LOG} save:updated`, { id: (updated as AiInterviewQuestionsRow).id });
    return mapRow(updated as AiInterviewQuestionsRow, emptyResumeAnalysis());
  }

  const { data: inserted, error: insertError } = await supabase
    .from("ai_interview_questions")
    .insert(payload)
    .select("*")
    .single();

  if (insertError || !inserted) {
    // Exact failing line previously masked as a generic UI error:
    // throw new Error(insertError?.message) → handleError swallowed it.
    throwSaveError("insert", insertError?.message ?? "Failed to save interview questions.");
  }

  console.log(`${LOG} save:inserted`, { id: (inserted as AiInterviewQuestionsRow).id });
  return mapRow(inserted as AiInterviewQuestionsRow, emptyResumeAnalysis());
}
