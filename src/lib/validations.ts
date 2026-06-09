import { z } from 'zod'

const slugSchema = (maxLength: number) =>
  z.string()
    .min(2)
    .max(maxLength)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens only')
    .optional()
    .or(z.literal(''))
    .transform((val) => (val === '' ? undefined : val))

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const categorySchema = z.object({
  name: z.string().min(2, 'Name is required').max(50),
  slug: slugSchema(50), // Can be auto-generated
})

export const collectionSchema = z.object({
  name: z.string().min(2, 'Name is required').max(50),
  slug: slugSchema(50),
  description: z.string().max(1000).optional(),
})

// Predefined option constants for admin forms
export const METAL_TYPES = ['Gold', 'Silver', 'Diamond', 'Platinum', 'Rose Gold', 'White Gold'] as const
export const OCCASION_OPTIONS = ['Wedding', 'Daily Wear', 'Festive', 'Gifting', 'Office Wear', 'Party', 'Temple', 'Engagement'] as const
export const BADGE_OPTIONS = ['New Arrival', 'Bestseller', 'Bridal', 'Limited Edition', 'Trending', 'Exclusive'] as const
export const PURITY_OPTIONS = ['14K', '18K', '22K', '24K', '925 Silver', '950 Platinum'] as const

export const productSchema = z.object({
  name: z.string().min(2, 'Name is required').max(200),
  slug: slugSchema(200),
  description: z.string().max(5000).optional(),
  featured: z.boolean().default(false),
  in_stock: z.boolean().default(true),
  is_active: z.boolean().default(true),
  category_id: z.string().uuid('Invalid category').optional().nullable(),
  collection_id: z.string().uuid('Invalid collection').optional().nullable(),
  weight_grams: z.number().min(0).optional().nullable(),
  purity: z.string().optional().nullable(),
  // New fields
  metal_type: z.string().optional().nullable(),
  occasion: z.array(z.string()).default([]),
  badges: z.array(z.string()).default([]),
  seo_title: z.string().max(200).optional().nullable(),
  seo_description: z.string().max(500).optional().nullable(),
})

export const inquirySchema = z.object({
  customer_name: z.string().min(2, 'Name is required').max(100),
  phone_number: z.string()
    .min(7, 'Valid phone number is required')
    .max(20)
    .regex(/^[+()\\-\\s0-9]+$/, 'Valid phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000),
  product_id: z.string().uuid().optional().nullable(),
})

// Reusable action result type
export type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
  errors?: Record<string, string[]>
}
