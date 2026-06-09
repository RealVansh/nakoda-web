'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { collectionSchema } from '@/lib/validations'
import { createCollection } from '@/actions/collection.actions'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'

type CollectionFormData = z.infer<typeof collectionSchema>

export function CollectionForm() {
  const [globalError, setGlobalError] = useState<string | null>(null)
  
  const form = useForm<CollectionFormData>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    }
  })

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = form

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function onSubmit(data: any) {
    setGlobalError(null)
    
    const result = await createCollection(data)

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
          className="mt-1 block w-full rounded-md border-border py-2 px-3 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border outline-none"
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-foreground">
          Slug <span className="text-muted-foreground font-normal">(Optional)</span>
        </label>
        <input
          type="text"
          id="slug"
          {...register('slug')}
          placeholder="e.g. bridal-collection"
          className="mt-1 block w-full rounded-md border-border py-2 px-3 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border outline-none"
        />
        {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-foreground">
          Description <span className="text-muted-foreground font-normal">(Optional)</span>
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={3}
          className="mt-1 block w-full rounded-md border-border py-2 px-3 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border outline-none"
        />
        {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full inline-flex justify-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition-colors"
      >
        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Collection'}
      </button>
    </form>
  )
}
