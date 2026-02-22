"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { attendFormSchema } from "@/lib/validations";

export async function generateTicket(formData: FormData) {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    section: formData.get("section") as string,
    course: formData.get("course") as string,
  };

  // 1. Zod validate
  const parsed = attendFormSchema.safeParse(raw);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((e) => e.message).join(", ");
    return { error: messages };
  }

  const { name, email, section, course } = parsed.data;

  try {
    // 2. Find participant by email (case-insensitive via transform)
    const participant = await prisma.participant.findUnique({
      where: { email },
    });

    // 3. Not found
    if (!participant) {
      return {
        error:
          "Email not found in registration list. Please complete the Google Form first.",
      };
    }

    // 4. Already attended
    if (participant.attendedAt) {
      const date = participant.attendedAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
      return {
        error: `Attendance already recorded on ${date}.`,
      };
    }

    // 5. Already has QR → return existing token (view-only)
    if (participant.qrGeneratedAt && participant.qrToken) {
      return {
        success: true,
        isExisting: true,
        data: {
          name: participant.name,
          email: participant.email,
          section: participant.section,
          course: participant.course,
          token: `wmsu-bscs-seminar:${participant.id}:${participant.qrToken}`,
        },
      };
    }

    // 6. First time → generate token and save
    const qrToken = crypto.randomUUID().slice(0, 12);

    const updated = await prisma.participant.update({
      where: { id: participant.id },
      data: {
        name, // Update name in case they corrected it
        section,
        course,
        qrGeneratedAt: new Date(),
        qrToken,
      },
    });

    return {
      success: true,
      isExisting: false,
      data: {
        name: updated.name,
        email: updated.email,
        section: updated.section,
        course: updated.course,
        token: `wmsu-bscs-seminar:${updated.id}:${qrToken}`,
      },
    };
  } catch (err) {
    console.error("generateTicket error:", err);
    return { error: "An unexpected error occurred. Please try again." };
  }
}
