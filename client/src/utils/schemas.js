import { z } from 'zod'

// ── Auth ──────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const signupSchema = z
  .object({
    partner1Name: z.string().min(1, 'Partner 1 name is required'),
    partner2Name: z.string().min(1, 'Partner 2 name is required'),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    weddingDate: z.string().optional(),
    rsvpDeadline: z.string().optional(),
    venue: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .refine(
    (d) => {
      if (d.rsvpDeadline && d.weddingDate) {
        return new Date(d.rsvpDeadline) <= new Date(d.weddingDate)
      }
      return true
    },
    { message: 'RSVP deadline must be on or before the wedding date', path: ['rsvpDeadline'] }
  )

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match",
    path: ['confirm'],
  })

// ── Invitations ───────────────────────────────────────────────────────────────
export const invitationSchema = z.object({
  guestName: z.string().min(1, 'Guest name is required'),
  greeting: z.string().min(1, 'Greeting is required'),
  customMessage: z.string().min(1, 'A personal message is required'),
  allowedGuests: z.coerce.number().min(1).max(10),
  category: z.string().min(1, 'Category is required'),
})

// ── Settings ──────────────────────────────────────────────────────────────────
export const settingsSchema = z
  .object({
    partner1Name: z.string().min(1, 'Partner 1 name is required'),
    partner2Name: z.string().min(1, 'Partner 2 name is required'),
    weddingDate: z.string().optional(),
    rsvpDeadline: z.string().optional(),
    venue: z.string().optional(),
  })
  .refine(
    (d) => {
      if (d.rsvpDeadline && d.weddingDate) {
        return new Date(d.rsvpDeadline) <= new Date(d.weddingDate)
      }
      return true
    },
    { message: 'RSVP deadline must be on or before the wedding date', path: ['rsvpDeadline'] }
  )

// ── RSVP (guest-facing) ───────────────────────────────────────────────────────
export const rsvpSchema = z.object({
  guestName: z.string().min(1, 'Name is required'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  attending: z.enum(['Yes', 'No']),
  numberOfGuests: z.coerce.number().min(1),
  mealPreference: z.string().optional(),
  message: z.string().optional(),
})
