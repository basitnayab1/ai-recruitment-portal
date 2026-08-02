"use client";

import { useState } from "react";
import {
  INTERVIEW_DURATIONS,
  INTERVIEW_TIMEZONES,
  INTERVIEW_TYPE_LABELS,
  INTERVIEW_TYPES,
  formatInterviewDuration,
  type InterviewType,
} from "@/lib/hr/interviews";
import type { InterviewFormDefaults } from "@/lib/hr/interviews";

const fieldClassName =
  "h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-violet-400/60 focus:ring-violet-500/20 [color-scheme:dark]";

const textareaClassName =
  "w-full resize-none rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-violet-400/60 focus:ring-violet-500/20";

export function InterviewFields({
  interview,
  minInterviewDate,
}: {
  interview?: InterviewFormDefaults | null;
  minInterviewDate?: string;
}) {
  const [interviewType, setInterviewType] = useState<InterviewType>(
    interview?.interviewType ?? "online"
  );

  return (
    <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-medium text-zinc-200">
        Interview details (saved to the interview record and included in candidate emails)
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="interviewerName" className="text-xs font-medium text-zinc-400">
            Interviewer Name *
          </label>
          <input
            id="interviewerName"
            name="interviewerName"
            type="text"
            required
            defaultValue={interview?.interviewerName ?? ""}
            className={fieldClassName}
            placeholder="e.g. Jane Smith"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="interviewType" className="text-xs font-medium text-zinc-400">
            Interview Type *
          </label>
          <select
            id="interviewType"
            name="interviewType"
            required
            defaultValue={interview?.interviewType ?? "online"}
            onChange={(event) => setInterviewType(event.target.value as InterviewType)}
            className={fieldClassName}
          >
            {INTERVIEW_TYPES.map((type) => (
              <option key={type} value={type}>
                {INTERVIEW_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="durationMinutes" className="text-xs font-medium text-zinc-400">
            Duration *
          </label>
          <select
            id="durationMinutes"
            name="durationMinutes"
            required
            defaultValue={String(interview?.durationMinutes ?? 60)}
            className={fieldClassName}
          >
            {INTERVIEW_DURATIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {formatInterviewDuration(minutes)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="interviewDate" className="text-xs font-medium text-zinc-400">
            Interview Date *
          </label>
          <input
            id="interviewDate"
            name="interviewDate"
            type="date"
            required
            min={minInterviewDate}
            defaultValue={interview?.interviewDate ?? ""}
            className={fieldClassName}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="interviewTime" className="text-xs font-medium text-zinc-400">
            Interview Time *
          </label>
          <input
            id="interviewTime"
            name="interviewTime"
            type="time"
            required
            defaultValue={interview?.interviewTime ?? ""}
            className={fieldClassName}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="timezone" className="text-xs font-medium text-zinc-400">
            Time Zone *
          </label>
          <select
            id="timezone"
            name="timezone"
            required
            defaultValue={interview?.timezone ?? "UTC"}
            className={fieldClassName}
          >
            {INTERVIEW_TIMEZONES.map((timezone) => (
              <option key={timezone} value={timezone}>
                {timezone}
              </option>
            ))}
          </select>
        </div>

        {interviewType === "online" ? (
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="meetingLink" className="text-xs font-medium text-zinc-400">
              Meeting Link *
            </label>
            <input
              id="meetingLink"
              name="meetingLink"
              type="url"
              required
              defaultValue={interview?.meetingLink ?? ""}
              className={fieldClassName}
              placeholder="https://meet.example.com/room"
            />
          </div>
        ) : null}

        {interviewType === "on_site" ? (
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="officeLocation" className="text-xs font-medium text-zinc-400">
              Office Location *
            </label>
            <input
              id="officeLocation"
              name="officeLocation"
              type="text"
              required
              defaultValue={interview?.officeLocation ?? ""}
              className={fieldClassName}
              placeholder="Building, floor, room, or full address"
            />
          </div>
        ) : null}

        {interviewType === "phone" ? (
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="meetingLink" className="text-xs font-medium text-zinc-400">
              Optional Meeting Link
            </label>
            <input
              id="meetingLink"
              name="meetingLink"
              type="url"
              defaultValue={interview?.meetingLink ?? ""}
              className={fieldClassName}
              placeholder="Optional dial-in or video link"
            />
          </div>
        ) : null}

        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="notes" className="text-xs font-medium text-zinc-400">
            Internal Notes (HR only)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={interview?.notes ?? ""}
            className={textareaClassName}
            placeholder="Internal preparation notes — not visible to candidates"
          />
        </div>
      </div>
    </div>
  );
}
