"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { attendFormSchema } from "@/lib/validations";
import { validateCheckinToken, validateEvalToken } from "@/lib/checkin";

// ─── Registration (Sign Up page) ────────────────────────────────────
export async function registerParticipant(formData: FormData) {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    section: (formData.get("section") as string) || "",
    course: (formData.get("course") as string) || "",
    isGuest: formData.get("isGuest"), // "on" when checked, null when not
  };

  const parsed = attendFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { name, email, section, course, isGuest } = parsed.data;

  try {
    // Look up by the normalised (lowercase) email coming from the schema,
    // but also fall back to a case-insensitive search to handle any records
    // that were stored before the email-normalisation was added.
    let existing = await prisma.participant.findUnique({ where: { email } });

    // Fallback: case-insensitive search in case stored email differs in casing
    if (!existing) {
      existing = await prisma.participant.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
      });
    }

    if (existing) {
      const nameMatch =
        existing.name.trim().toLowerCase() === name.trim().toLowerCase();

      // Determine if this is a valid re-submission
      let isResubmit = false;
      if (isGuest && existing.isGuest) {
        // Both guest — only name needs to match
        isResubmit = nameMatch;
      } else if (!isGuest && !existing.isGuest) {
        // Both non-guest — name, section, and course must all match
        const sectionMatch =
          (existing.section ?? "").trim().toLowerCase() ===
          (section ?? "").trim().toLowerCase();
        const courseMatch =
          (existing.course ?? "").trim().toLowerCase() ===
          (course ?? "").trim().toLowerCase();
        isResubmit = nameMatch && sectionMatch && courseMatch;
      }
      // Mixed guest/non-guest → always reject (falls through to error below)

      if (isResubmit) {
        const qrToken = existing.qrToken ?? crypto.randomUUID().slice(0, 12);
        if (!existing.qrToken) {
          await prisma.participant.update({
            where: { id: existing.id },
            data: { qrToken, qrGeneratedAt: new Date() },
          });
        }
        return {
          success: true,
          retrieved: true,
          data: {
            name: existing.name,
            email: existing.email,
            section: existing.section,
            course: existing.course,
            token: `wmsu-bscs-seminar:${existing.id}:${qrToken}`,
          },
        };
      }

      // Email matches but details differ → reject with clear message
      return {
        error:
          "This email is already registered. Some of your details don't match the original registration — please check your name, section, and college, then try again.",
        alreadyRegistered: true,
      };
    }

    // New participant — create record and generate QR token
    const qrToken = crypto.randomUUID().slice(0, 12);
    const participant = await prisma.participant.create({
      data: {
        name,
        email,
        section: isGuest ? null : section || null,
        course: isGuest ? null : course || null,
        isGuest,
        qrGeneratedAt: new Date(),
        qrToken,
      },
    });

    return {
      success: true,
      retrieved: false,
      data: {
        name: participant.name,
        email: participant.email,
        section: participant.section,
        course: participant.course,
        token: `wmsu-bscs-seminar:${participant.id}:${qrToken}`,
      },
    };
  } catch (err: any) {
    if (err.code === "P2002") {
      return {
        error:
          "This email is already registered. Go to Time In to access your QR ticket.",
        alreadyRegistered: true,
      };
    }
    console.error("registerParticipant error:", err);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

// ─── Time In (Attend page — retrieve existing QR by email) ──────────
export async function getTicket(email: string) {
  const normalised = email.toLowerCase().trim();

  if (!normalised || !normalised.includes("@")) {
    return { error: "Please enter a valid email address." };
  }

  try {
    const participant = await prisma.participant.findUnique({
      where: { email: normalised },
    });

    if (!participant) {
      return {
        error: "Email not found. Please register first on the Sign Up page.",
        notRegistered: true,
      };
    }

    if (!participant.qrToken) {
      return {
        error:
          "No QR ticket found for this email. Please contact the organizer.",
      };
    }

    if (participant.attendedAt) {
      const date = participant.attendedAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
      return {
        error: `Your attendance was already marked on ${date}. See you at the seminar!`,
        alreadyAttended: true,
      };
    }

    return {
      success: true,
      data: {
        name: participant.name,
        email: participant.email,
        section: participant.section,
        course: participant.course,
        token: `wmsu-bscs-seminar:${participant.id}:${participant.qrToken}`,
      },
    };
  } catch (err) {
    console.error("getTicket error:", err);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

// ─── Keep old action for admin pre-import flow (backwards compat) ────
export async function generateTicket(formData: FormData) {
  return registerParticipant(formData);
}

// ─── Self Check-In (participant scans admin QR) ─────────────────────
export async function selfCheckIn(email: string, token: string) {
  const validation = validateCheckinToken(token);
  if (!validation.valid) return { error: validation.error };

  const normalised = email.toLowerCase().trim();
  if (!normalised.includes("@"))
    return { error: "Please enter a valid email address." };

  try {
    const participant = await prisma.participant.findFirst({
      where: { email: { equals: normalised, mode: "insensitive" } },
    });

    if (!participant)
      return {
        error: "Email not found. Please sign up first on the Sign Up page.",
        notRegistered: true,
      };

    if (participant.attendedAt) {
      const date = participant.attendedAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
      return {
        error: `You were already checked in on ${date}.`,
        alreadyAttended: true,
        name: participant.name,
      };
    }

    await prisma.participant.update({
      where: { id: participant.id },
      data: { attendedAt: new Date(), attendedBy: "self" },
    });

    return {
      success: true,
      data: {
        name: participant.name,
        email: participant.email,
        section: participant.section,
        course: participant.course,
      },
    };
  } catch (err) {
    console.error("selfCheckIn error:", err);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

// ─── Evaluation Marking (participant scans evaluation QR) ────────────
export async function selfEvaluate(email: string, token: string) {
  const validation = validateEvalToken(token);
  if (!validation.valid) return { error: validation.error };

  const normalised = email.toLowerCase().trim();
  if (!normalised.includes("@"))
    return { error: "Please enter a valid email address." };

  try {
    const participant = await prisma.participant.findFirst({
      where: { email: { equals: normalised, mode: "insensitive" } },
    });

    if (!participant) {
      return {
        error: "Email not found. Please sign up first on the Sign Up page.",
        notRegistered: true,
      };
    }

    if (!participant.attendedAt) {
      return {
        error:
          "You must be marked as present before submitting the evaluation.",
        notPresent: true,
      };
    }

    if (participant.evaluated) {
      return {
        error: "Your evaluation has already been recorded.",
        alreadyEvaluated: true,
      };
    }

    await prisma.participant.update({
      where: { id: participant.id },
      data: { evaluated: true },
    });

    return {
      success: true,
      data: {
        name: participant.name,
        email: participant.email,
        section: participant.section,
        course: participant.course,
      },
    };
  } catch (err) {
    console.error("selfEvaluate error:", err);
    return { error: "An unexpected error occurred. Please try again." };
  }
}
