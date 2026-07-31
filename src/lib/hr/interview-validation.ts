import {
  INTERVIEW_DURATIONS,
  isInterviewTimezone,
  isInterviewType,
  type InterviewType,
} from "@/lib/hr/interviews";

export type ParsedInterviewForm = {
  interviewerName: string;
  interviewType: InterviewType;
  meetingLink: string | null;
  officeLocation: string | null;
  interviewDate: string;
  interviewTime: string;
  timezone: string;
  durationMinutes: number;
  notes: string | null;
};

export type InterviewValidationResult =
  | { ok: true; data: ParsedInterviewForm }
  | { ok: false; message: string };

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function parseInterviewDateTime(date: string, time: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(time);
  if (!match || !timeMatch) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);

  const parsed = new Date(year, month - 1, day, hours, minutes, 0, 0);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day ||
    parsed.getHours() !== hours ||
    parsed.getMinutes() !== minutes
  ) {
    return null;
  }

  return parsed;
}

export function isPastInterviewDateTime(date: string, time: string): boolean {
  const interviewAt = parseInterviewDateTime(date, time);
  if (!interviewAt) {
    return true;
  }

  return interviewAt.getTime() < Date.now();
}

export function parseInterviewFormData(formData: FormData): InterviewValidationResult {
  const interviewerName = String(formData.get("interviewerName") ?? "").trim();
  const interviewTypeRaw = String(formData.get("interviewType") ?? "").trim();
  const meetingLinkRaw = String(formData.get("meetingLink") ?? "").trim();
  const officeLocationRaw = String(formData.get("officeLocation") ?? "").trim();
  const interviewDate = String(formData.get("interviewDate") ?? "").trim();
  const interviewTime = String(formData.get("interviewTime") ?? "").trim();
  const timezoneRaw = String(formData.get("timezone") ?? "").trim();
  const durationRaw = String(formData.get("durationMinutes") ?? "").trim();
  const notesRaw = String(formData.get("notes") ?? "").trim();

  if (!interviewerName) {
    return { ok: false, message: "Interviewer name is required." };
  }
  if (!isInterviewType(interviewTypeRaw)) {
    return { ok: false, message: "Please choose a valid interview type." };
  }
  if (!interviewDate) {
    return { ok: false, message: "Interview date is required." };
  }
  if (!interviewTime) {
    return { ok: false, message: "Interview time is required." };
  }
  if (!timezoneRaw || !isInterviewTimezone(timezoneRaw)) {
    return { ok: false, message: "Please choose a valid time zone." };
  }

  const durationMinutes = Number(durationRaw);
  if (
    !Number.isInteger(durationMinutes) ||
    !(INTERVIEW_DURATIONS as readonly number[]).includes(durationMinutes)
  ) {
    return { ok: false, message: "Please choose a valid interview duration." };
  }

  if (isPastInterviewDateTime(interviewDate, interviewTime)) {
    return { ok: false, message: "Interview date and time must be in the future." };
  }

  let meetingLink: string | null = null;
  let officeLocation: string | null = null;

  if (interviewTypeRaw === "online") {
    if (!meetingLinkRaw) {
      return { ok: false, message: "Meeting link is required for online interviews." };
    }
    if (!isValidHttpUrl(meetingLinkRaw)) {
      return { ok: false, message: "Please enter a valid meeting link URL." };
    }
    meetingLink = meetingLinkRaw;
  }

  if (interviewTypeRaw === "on_site") {
    if (!officeLocationRaw) {
      return { ok: false, message: "Office location is required for on-site interviews." };
    }
    officeLocation = officeLocationRaw;
  }

  if (interviewTypeRaw === "phone") {
    if (meetingLinkRaw && !isValidHttpUrl(meetingLinkRaw)) {
      return { ok: false, message: "Please enter a valid URL if providing a meeting link." };
    }
    meetingLink = meetingLinkRaw || null;
  }

  return {
    ok: true,
    data: {
      interviewerName,
      interviewType: interviewTypeRaw,
      meetingLink,
      officeLocation,
      interviewDate,
      interviewTime,
      timezone: timezoneRaw,
      durationMinutes,
      notes: notesRaw || null,
    },
  };
}

export function hasInterviewScheduleChanged(
  existing: ParsedInterviewForm,
  next: ParsedInterviewForm
): boolean {
  return (
    existing.interviewDate !== next.interviewDate ||
    existing.interviewTime !== next.interviewTime ||
    existing.timezone !== next.timezone
  );
}
