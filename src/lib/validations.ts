import { z } from "zod";

export const attendFormSchema = z.object({
    name: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name is too long"),
    email: z
        .string()
        .email("Please enter a valid email address")
        .transform((v) => v.toLowerCase().trim()),
    section: z
        .string()
        .min(1, "Section is required")
        .max(20, "Section is too long"),
    course: z
        .string()
        .min(1, "Course is required")
        .max(20, "Course is too long"),
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
    section: z.string().default("BSCS 3A"),
    course: z.string().default("BSCS"),
});

export const loginSchema = z.object({
    password: z.string().min(1, "Password is required"),
});
