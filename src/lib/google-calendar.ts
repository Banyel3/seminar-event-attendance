/**
 * Google Calendar API helpers — server-only.
 * Handles OAuth2 setup, event creation (with Meet link), and attendee management.
 */

import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];
const CONFIG_KEY = "google_meet_event_id";

// ─── OAuth2 Client ──────────────────────────────────────────────────

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

/** Returns the Google OAuth consent URL. Admin visits this once to authorize. */
export function generateAuthUrl(): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent", // Forces refresh_token to always be returned
  });
}

/** Exchanges an auth code (from OAuth callback) for access + refresh tokens. */
export async function exchangeCodeForTokens(
  code: string,
): Promise<{ refreshToken: string | null; accessToken: string | null }> {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  return {
    refreshToken: tokens.refresh_token ?? null,
    accessToken: tokens.access_token ?? null,
  };
}

/** Returns an authenticated OAuth2 client using the stored refresh token. */
function getAuthenticatedClient() {
  const client = getOAuth2Client();
  if (!process.env.GOOGLE_REFRESH_TOKEN) {
    throw new Error("GOOGLE_REFRESH_TOKEN is not set in environment variables.");
  }
  client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return client;
}

// ─── Event Management ───────────────────────────────────────────────

/**
 * Creates a Google Calendar event with a Meet link.
 * Returns the event ID, Meet link, and calendar HTML link.
 */
export async function createMeetEvent(
  title: string,
  description: string,
  startDateTime: string, // ISO 8601, e.g. "2026-03-20T09:00:00+08:00"
  endDateTime: string,
  timeZone: string = "Asia/Manila",
): Promise<{ eventId: string; meetLink: string | null; htmlLink: string | null }> {
  const auth = getAuthenticatedClient();
  const calendar = google.calendar({ version: "v3", auth });

  const { data: event } = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    sendUpdates: "none",
    requestBody: {
      summary: title,
      description,
      start: { dateTime: startDateTime, timeZone },
      end: { dateTime: endDateTime, timeZone },
      conferenceData: {
        createRequest: {
          requestId: `seminar-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    },
  });

  const meetLink =
    event.conferenceData?.entryPoints?.find(
      (e) => e.entryPointType === "video",
    )?.uri ?? null;

  return {
    eventId: event.id!,
    meetLink,
    htmlLink: event.htmlLink ?? null,
  };
}

/**
 * Adds a single attendee to an existing calendar event.
 * Idempotent — does nothing if the email is already in the attendee list.
 * Uses sendUpdates: "all" so Google sends them an invite email.
 */
export async function addAttendeeToEvent(
  eventId: string,
  email: string,
  name: string,
): Promise<{ success?: boolean; alreadyAdded?: boolean; error?: string }> {
  try {
    const auth = getAuthenticatedClient();
    const calendar = google.calendar({ version: "v3", auth });

    const { data: event } = await calendar.events.get({
      calendarId: "primary",
      eventId,
    });

    const attendees = event.attendees ?? [];
    const normalizedEmail = email.toLowerCase();

    // Idempotency — skip if already in the list
    if (attendees.some((a) => (a.email ?? "").toLowerCase() === normalizedEmail)) {
      return { alreadyAdded: true };
    }

    attendees.push({ email, displayName: name });

    await calendar.events.patch({
      calendarId: "primary",
      eventId,
      sendUpdates: "all",
      requestBody: { attendees },
    });

    return { success: true };
  } catch (err) {
    console.error("addAttendeeToEvent error:", err);
    return { error: String(err) };
  }
}

/**
 * Bulk-syncs a list of participants as attendees in one PATCH call.
 * Only adds participants not already in the attendee list.
 * Uses sendUpdates: "all" so newly added guests receive invite emails.
 */
export async function syncAllAttendeesToEvent(
  eventId: string,
  participants: { email: string; name: string }[],
): Promise<{ added: number; skipped: number }> {
  const auth = getAuthenticatedClient();
  const calendar = google.calendar({ version: "v3", auth });

  const { data: event } = await calendar.events.get({
    calendarId: "primary",
    eventId,
  });

  const currentAttendees = event.attendees ?? [];
  const existingEmails = new Set(
    currentAttendees.map((a) => (a.email ?? "").toLowerCase()),
  );

  const newAttendees = participants
    .filter((p) => !existingEmails.has(p.email.toLowerCase()))
    .map((p) => ({ email: p.email, displayName: p.name }));

  if (newAttendees.length === 0) {
    return { added: 0, skipped: participants.length };
  }

  await calendar.events.patch({
    calendarId: "primary",
    eventId,
    sendUpdates: "all",
    requestBody: { attendees: [...currentAttendees, ...newAttendees] },
  });

  return { added: newAttendees.length, skipped: participants.length - newAttendees.length };
}

/**
 * Fetches current event details including the Meet link and attendee count.
 */
export async function getMeetEventDetails(eventId: string) {
  const auth = getAuthenticatedClient();
  const calendar = google.calendar({ version: "v3", auth });

  const { data: event } = await calendar.events.get({
    calendarId: "primary",
    eventId,
  });

  const meetLink =
    event.conferenceData?.entryPoints?.find(
      (e) => e.entryPointType === "video",
    )?.uri ?? null;

  return {
    title: event.summary ?? "",
    description: event.description ?? "",
    start: event.start?.dateTime ?? event.start?.date ?? "",
    end: event.end?.dateTime ?? event.end?.date ?? "",
    meetLink,
    htmlLink: event.htmlLink ?? null,
    attendeeCount: (event.attendees ?? []).length,
  };
}

// ─── Config DB Helpers ──────────────────────────────────────────────

/** Retrieves the stored Google Meet event ID from the Config table. */
export async function getMeetEventId(): Promise<string | null> {
  try {
    const config = await prisma.config.findUnique({
      where: { key: CONFIG_KEY },
    });
    return config?.value ?? null;
  } catch {
    return null;
  }
}

/** Persists the Google Meet event ID to the Config table. */
export async function saveMeetEventId(eventId: string): Promise<void> {
  await prisma.config.upsert({
    where: { key: CONFIG_KEY },
    update: { value: eventId },
    create: { key: CONFIG_KEY, value: eventId },
  });
}
