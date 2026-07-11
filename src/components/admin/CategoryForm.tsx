'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { categorySchema } from '@/lib/validations'
import { createCategory } from '@/actions/category.actions'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'

type CategoryFormInput = z.input<typeof categorySchema>
type CategoryFormData = z.output<typeof categorySchema>

export function CategoryForm() {
  const [globalError, setGlobalError] = useState<string | null>(null)
  
  const form = useForm<CategoryFormInput, unknown, CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      slug: '',
    }
  })

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = form

  async function onSubmit(data: CategoryFormData) {
    setGlobalError(null)
    
    const result = await createCategory(data)

    if (!result.success) {
      if (result.error) {
        setGlobalError(result.error)
      }
      return
    }

    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {globalError && (
        <div className="rounded-md bg-red-50 p-3 border border-red-200">
          <p className="text-sm font-medium text-red-800">{globalError}</p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-foreground">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          {...register('name')}
          aria-invalid={errors.name ? 'true' : 'false'}
          aria-describedby={errors.name ? 'name-error' : undefined}
          className={`mt-1 block w-full rounded-md py-2 px-3 shadow-sm sm:text-sm border outline-none transition-colors ${
            errors.name 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
              : 'border-border focus:border-primary focus:ring-primary'
          }`}
        />
        {errors.name && <p id="name-error" className="mt-1 text-xs text-red-600 font-medium">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-foreground">
          Slug <span className="text-muted-foreground font-normal">(Optional)</span>
        </label>
        <input
          type="text"
          id="slug"
          {...register('slug')}
          aria-invalid={errors.slug ? 'true' : 'false'}
          aria-describedby={errors.slug ? 'slug-error' : undefined}
          placeholder="e.g. gold-rings"
          className={`mt-1 block w-full rounded-md py-2 px-3 shadow-sm sm:text-sm border outline-none transition-colors ${
            errors.slug 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
              : 'border-border focus:border-primary focus:ring-primary'
          }`}
        />
        {errors.slug && <p id="slug-error" className="mt-1 text-xs text-red-600 font-medium">{errors.slug.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full inline-flex justify-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition-colors"
      >
        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Category'}
      </button>
    </form>
  )
}
