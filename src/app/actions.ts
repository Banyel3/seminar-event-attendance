"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { attendFormSchema } from "@/lib/validations";

// ─── Registration (Sign Up page) ────────────────────────────────────
export async function registerParticipant(formData: FormData) {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    section: formData.get("section") as string,
    course: formData.get("course") as string,
  };

  const parsed = attendFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const { name, email, section, course } = parsed.data;

  try {
    // Check if this email is already in the system
    const existing = await prisma.participant.findUnique({ where: { email } });

    if (existing) {
      // All four fields match → return existing QR ticket (re-submission)
      const nameMatch = existing.name.trim().toLowerCase() === name.trim().toLowerCase();
      const sectionMatch = existing.section.trim().toLowerCase() === section.trim().toLowerCase();
      const courseMatch = existing.course.trim().toLowerCase() === course.trim().toLowerCase();

      if (nameMatch && sectionMatch && courseMatch) {
        // Ensure QR token exists (should always be true, but guard anyway)
        const qrToken = existing.qrToken ?? crypto.randomUUID().slice(0, 12);
        if (!existing.qrToken) {
          await prisma.participant.update({
            where: { email },
            data: { qrToken, qrGeneratedAt: new Date() },
          });
        }
        return {
          success: true,
          retrieved: true, // flag so UI can show "Welcome back" variant
          data: {
            name: existing.name,
            email: existing.email,
            section: existing.section,
            course: existing.course,
            token: `wmsu-bscs-seminar:${existing.id}:${qrToken}`,
          },
        };
      }

      // Email matches but other fields differ → reject
      return {
        error:
          "This email is already registered with different details. Go to Time In to retrieve your QR ticket.",
        alreadyRegistered: true,
      };
    }

    // New participant — create record and generate QR token
    const qrToken = crypto.randomUUID().slice(0, 12);
    const participant = await prisma.participant.create({
      data: {
        name,
        email,
        section,
        course,
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
        error:
          "Email not found. Please register first on the Sign Up page.",
        notRegistered: true,
      };
    }

    if (!participant.qrToken) {
      return { error: "No QR ticket found for this email. Please contact the organizer." };
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
