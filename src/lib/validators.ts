import { z } from "zod"

export const gemInterests = ["Sapphire", "Spinel", "Garnet", "Alexandrite", "Chrysoberyl", "Other or undecided"] as const
export const budgetRanges = ["Under LKR 100,000", "LKR 100,000–250,000", "LKR 250,000–500,000", "Over LKR 500,000", "Prefer to discuss"] as const

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(100),
  mobile: z.string().trim().regex(/^\+?[0-9 ()-]{7,24}$/, "Enter a mobile number with its country code.").refine((value) => value.replace(/\D/g, "").length >= 7, "Enter at least 7 digits."),
  email: z.email("Enter a valid email address."),
  gem: z.string().refine((value) => gemInterests.some((item) => item === value), "Select a gem of interest."),
  budget: z.string().refine((value) => budgetRanges.some((item) => item === value), "Select a budget range."),
  colour: z.string().trim().max(100, "Use 100 characters or fewer."),
  size: z.string().trim().max(100, "Use 100 characters or fewer."),
  notes: z.string().trim().max(2000, "Use 2,000 characters or fewer."),
})
