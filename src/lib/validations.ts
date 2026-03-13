import { z } from "zod";

export const attendFormSchema = z
  .object({
    isGuest: z.coerce.boolean().default(false),
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name is too long"),
    email: z
      .string()
      .email("Please enter a valid email address")
      .transform((v) => v.toLowerCase().trim()),
    section: z.string().max(20, "Section is too long").optional(),
    course: z.string().max(100, "Course is too long").optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.isGuest) {
      if (!data.section || data.section.trim().length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Section is required",
          path: ["section"],
        });
      }
      if (!data.course || data.course.trim().length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Course is required",
          path: ["course"],
        });
      }
    }
  });

export type AttendFormData = z.infer<typeof attendFormSchema>;

export const addParticipantSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .transform((v) => v.toLowerCase().trim()),
  section: z.string().min(1, "Section is required"),
  course: z.string().min(1, "Course is required"),
});

export const importRowSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  section: z.string().default(""),
  course: z.string().default(""),
});

export const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});
