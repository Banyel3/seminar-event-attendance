"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { addParticipantSchema, importRowSchema } from "@/lib/validations";
import {
  generateCheckinToken as createToken,
  generateEvalToken as createEvalToken,
} from "@/lib/checkin";
import {
  generateAuthUrl,
  exchangeCodeForTokens,
  createMeetEvent,
  updateMeetEvent,
  syncAllAttendeesToEvent,
  getMeetEventDetails,
  getMeetEventId,
  saveMeetEventId,
} from "@/lib/google-calendar";

// ─── Auth ───────────────────────────────────────────────────────────

const COOKIE_NAME = "admin_session";
const SESSION_TOKEN = "seminar-admin-authenticated"; // simple flag token for MVP

export async function adminLogin(password: string) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return { error: "Server configuration error: ADMIN_PASSWORD not set." };
  }

  if (password !== adminPassword) {
    return { error: "Invalid password." };
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, SESSION_TOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours
  });

  return { success: true };
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return { success: true };
}

// ─── Overview ───────────────────────────────────────────────────────

export async function getOverviewStats() {
  const [totalRegistered, qrGenerated, attended, evaluated] = await Promise.all(
    [
      prisma.participant.count(),
      prisma.participant.count({ where: { qrGeneratedAt: { not: null } } }),
      prisma.participant.count({ where: { attendedAt: { not: null } } }),
      prisma.participant.count({ where: { evaluated: true } }),
    ],
  );

  const attendanceRate =
    totalRegistered > 0
      ? parseFloat(((attended / totalRegistered) * 100).toFixed(1))
      : 0;

  return { totalRegistered, qrGenerated, attended, evaluated, attendanceRate };
}

export async function getRecentScans(limit: number = 5) {
  const scans = await prisma.participant.findMany({
    where: { attendedAt: { not: null } },
    orderBy: { attendedAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      section: true,
      attendedAt: true,
    },
  });

  return scans.map(
    (s: {
      id: string;
      name: string;
      email: string;
      section: string | null;
      attendedAt: Date | null;
    }) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      section: s.section,
      time: s.attendedAt!.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      status: "Present" as const,
    }),
  );
}

// ─── Participants CRUD ──────────────────────────────────────────────

export type ParticipantRow = {
  id: string;
  name: string;
  email: string;
  section: string | null;
  course: string | null;
  status: "Registered" | "QR Generated" | "Attended" | "Evaluated";
  timestamp?: string;
  registeredAt: string;
};

function deriveStatus(p: {
  evaluated: boolean;
  qrGeneratedAt: Date | null;
  attendedAt: Date | null;
}): "Registered" | "QR Generated" | "Attended" | "Evaluated" {
  if (p.evaluated) return "Evaluated";
  if (p.attendedAt) return "Attended";
  if (p.qrGeneratedAt) return "QR Generated";
  return "Registered";
}

export async function getParticipants(
  search?: string,
  filter?: string,
): Promise<ParticipantRow[]> {
  const where: Record<string, unknown> = {};

  if (search && search.trim()) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (filter === "QR Generated") {
    where.qrGeneratedAt = { not: null };
    where.attendedAt = null;
  } else if (filter === "Attended") {
    where.attendedAt = { not: null };
    where.evaluated = false;
  } else if (filter === "Evaluated") {
    where.evaluated = true;
  } else if (filter === "Registered") {
    where.qrGeneratedAt = null;
    where.attendedAt = null;
  }

  const participants = await prisma.participant.findMany({
    where,
    orderBy: { registeredAt: "desc" },
    take: 100,
  });

  return participants.map(
    (p: {
      id: string;
      name: string;
      email: string;
      section: string | null;
      course: string | null;
      evaluated: boolean;
      qrGeneratedAt: Date | null;
      attendedAt: Date | null;
      registeredAt: Date;
    }) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      section: p.section,
      course: p.course,
      status: deriveStatus(p),
      timestamp: p.attendedAt
        ? p.attendedAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })
        : undefined,
      registeredAt: p.registeredAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    }),
  );
}

export async function addParticipant(data: {
  name: string;
  email: string;
  section: string;
  course: string;
}) {
  const parsed = addParticipantSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  try {
    const participant = await prisma.participant.create({
      data: parsed.data,
    });
    return { success: true, participant };
  } catch (err: any) {
    if (err.code === "P2002") {
      return { error: "A participant with this email already exists." };
    }
    console.error("addParticipant error:", err);
    return { error: "Failed to add participant." };
  }
}

export async function updateParticipant(
  id: string,
  data: { name?: string; email?: string; section?: string; course?: string },
) {
  try {
    const participant = await prisma.participant.update({
      where: { id },
      data,
    });
    return { success: true, participant };
  } catch (err: any) {
    if (err.code === "P2002") {
      return { error: "A participant with this email already exists." };
    }
    console.error("updateParticipant error:", err);
    return { error: "Failed to update participant." };
  }
}

export async function deleteParticipant(id: string) {
  try {
    await prisma.participant.delete({ where: { id } });
    return { success: true };
  } catch (err) {
    console.error("deleteParticipant error:", err);
    return { error: "Failed to delete participant." };
  }
}

// ─── Import CSV ─────────────────────────────────────────────────────

export async function importParticipants(
  records: { name: string; email: string; section: string; course: string }[],
) {
  // Validate each row
  const validRecords: {
    name: string;
    email: string;
    section: string;
    course: string;
  }[] = [];
  const invalidCount: number[] = [];

  records.forEach((row, index) => {
    const parsed = importRowSchema.safeParse({
      ...row,
      email: row.email?.toLowerCase().trim(),
    });
    if (parsed.success) {
      validRecords.push(parsed.data);
    } else {
      invalidCount.push(index + 1);
    }
  });

  if (validRecords.length === 0) {
    return {
      error: "No valid records found in the CSV.",
      inserted: 0,
      skipped: 0,
      invalid: records.length,
    };
  }

  try {
    const result = await prisma.participant.createMany({
      data: validRecords,
      skipDuplicates: true,
    });

    return {
      success: true,
      inserted: result.count,
      skipped: validRecords.length - result.count,
      invalid: invalidCount.length,
    };
  } catch (err) {
    console.error("importParticipants error:", err);
    return { error: "Failed to import participants." };
  }
}

// ─── QR Verification ───────────────────────────────────────────────

export async function verifyQrToken(token: string) {
  // Token format: wmsu-bscs-seminar:{participantId}:{qrToken}
  // Use indexOf instead of split so partial scans (missing segments) don't
  // produce empty strings that cause false format errors.
  let qrToken = token.trim();

  const PREFIX = "wmsu-bscs-seminar:";
  if (qrToken.startsWith(PREFIX)) {
    const afterPrefix = qrToken.slice(PREFIX.length);
    const secondColon = afterPrefix.indexOf(":");
    if (secondColon >= 0) {
      qrToken = afterPrefix.slice(secondColon + 1);
    } else {
      // Only the prefix + id, no qrToken segment — invalid
      return { error: "Invalid QR token format." };
    }
  }

  if (!qrToken) {
    return { error: "Invalid QR token format." };
  }

  const participant = await prisma.participant.findUnique({
    where: { qrToken },
  });

  if (!participant) {
    return { error: "Invalid QR token. Participant not found." };
  }

  return {
    success: true,
    participant: {
      id: participant.id,
      name: participant.name,
      email: participant.email,
      section: participant.section,
      course: participant.course,
      status: deriveStatus(participant),
      attendedAt: participant.attendedAt?.toISOString() || null,
    },
  };
}

export async function markAttendance(id: string) {
  try {
    const participant = await prisma.participant.findUnique({ where: { id } });

    if (!participant) {
      return { error: "Participant not found." };
    }

    if (participant.attendedAt) {
      return { error: "Already marked as present.", alreadyAttended: true };
    }

    await prisma.participant.update({
      where: { id },
      data: { attendedAt: new Date(), attendedBy: "admin" },
    });

    return { success: true, name: participant.name };
  } catch (err) {
    console.error("markAttendance error:", err);
    return { error: "Failed to mark attendance." };
  }
}

// ─── CSV Export ─────────────────────────────────────────────────────

export async function exportParticipantsCSV(
  filter?: "all" | "attended" | "not-attended",
) {
  const where: Record<string, unknown> = {};

  if (filter === "attended") {
    where.attendedAt = { not: null };
  } else if (filter === "not-attended") {
    where.qrGeneratedAt = { not: null };
    where.attendedAt = null;
  }

  const participants = await prisma.participant.findMany({
    where,
    orderBy: { name: "asc" },
  });

  const header = "Name,Email,Section,Course,Registered,QR Generated,Attended\n";
  const rows = participants
    .map(
      (p: {
        name: string;
        email: string;
        section: string | null;
        course: string | null;
        registeredAt: Date;
        qrGeneratedAt: Date | null;
        attendedAt: Date | null;
      }) =>
        `"${p.name}","${p.email}","${p.section}","${p.course}","${p.registeredAt.toISOString()}","${p.qrGeneratedAt?.toISOString() || ""}","${p.attendedAt?.toISOString() || ""}"`,
    )
    .join("\n");

  return header + rows;
}

// ─── Participant list for manual fallback ────────────────────────────

// ─── Self Check-In QR ─────────────────────────────────────────────

export async function generateCheckinToken() {
  return { token: createToken() };
}

export async function generateEvalToken() {
  return { token: createEvalToken() };
}

// ─── Check-In Status ─────────────────────────────────────────────

const CHECKIN_ENDED_KEY = "event_checkin_ended";

export async function getCheckInStatus() {
  const config = await prisma.config.findUnique({
    where: { key: CHECKIN_ENDED_KEY },
  });
  return { ended: config?.value === "true" };
}

export async function setCheckInEnded(ended: boolean) {
  await prisma.config.upsert({
    where: { key: CHECKIN_ENDED_KEY },
    update: { value: ended ? "true" : "false" },
    create: { key: CHECKIN_ENDED_KEY, value: ended ? "true" : "false" },
  });
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────

export async function getRegisteredParticipants() {
  const participants = await prisma.participant.findMany({
    where: { qrToken: { not: null } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      section: true,
      course: true,
      attendedAt: true,
    },
  });
  return participants.map(
    (p: {
      id: string;
      name: string;
      email: string;
      section: string | null;
      course: string | null;
      attendedAt: Date | null;
    }) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      section: p.section,
      course: p.course,
      attended: !!p.attendedAt,
    }),
  );
}

// ─── Google Meet Integration ─────────────────────────────────────

/** Returns the Google OAuth consent URL for the admin to authorize. */
export async function generateGoogleAuthUrl() {
  return { url: generateAuthUrl() };
}

/** Exchanges an OAuth code for tokens. Returns the refresh token to copy to .env. */
export async function exchangeGoogleCode(code: string) {
  try {
    const result = await exchangeCodeForTokens(code);
    return { success: true, refreshToken: result.refreshToken };
  } catch (err) {
    console.error("exchangeGoogleCode error:", err);
    return { error: "Failed to exchange authorization code." };
  }
}

/** Creates a Google Calendar event with a Meet link and saves the event ID to the DB. */
export async function createGoogleMeetEvent(data: {
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  timeZone?: string;
}) {
  try {
    const { eventId, meetLink, htmlLink } = await createMeetEvent(
      data.title,
      data.description,
      data.startDateTime,
      data.endDateTime,
      data.timeZone ?? "Asia/Manila",
    );
    await saveMeetEventId(eventId);
    return { success: true, eventId, meetLink, htmlLink };
  } catch (err) {
    console.error("createGoogleMeetEvent error:", err);
    return { error: String(err) };
  }
}

/** Updates the title, description, and/or datetime of the existing Meet event. */
export async function updateGoogleMeetEvent(data: {
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  timeZone?: string;
}) {
  try {
    const eventId = await getMeetEventId();
    if (!eventId) return { error: "No Meet event has been created yet." };
    await updateMeetEvent(eventId, data);
    return { success: true };
  } catch (err) {
    console.error("updateGoogleMeetEvent error:", err);
    return { error: String(err) };
  }
}

/** Syncs all registered participants as attendees on the Meet event. */
export async function syncAllToMeet() {
  try {
    const eventId = await getMeetEventId();
    if (!eventId) return { error: "No Meet event has been created yet." };

    const allParticipants = await prisma.participant.findMany({
      select: { email: true, name: true },
      orderBy: { registeredAt: "asc" },
    });

    const result = await syncAllAttendeesToEvent(eventId, allParticipants);
    return { success: true, added: result.added, skipped: result.skipped };
  } catch (err) {
    console.error("syncAllToMeet error:", err);
    return { error: String(err) };
  }
}

/** Returns the current Meet event status, or null if no event has been created. */
export async function getMeetStatus() {
  try {
    const eventId = await getMeetEventId();
    if (!eventId)
      return {
        connected: !!process.env.GOOGLE_REFRESH_TOKEN?.trim(),
        event: null,
      };

    const details = await getMeetEventDetails(eventId);
    return {
      connected: true,
      event: { eventId, ...details },
    };
  } catch (err) {
    console.error("getMeetStatus error:", err);
    return {
      connected: !!process.env.GOOGLE_REFRESH_TOKEN?.trim(),
      event: null,
      error: String(err),
    };
  }
}
