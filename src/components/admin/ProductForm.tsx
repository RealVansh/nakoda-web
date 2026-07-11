'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productSchema, METAL_TYPES, OCCASION_OPTIONS, BADGE_OPTIONS, PURITY_OPTIONS } from '@/lib/validations'
import { createProduct, updateProduct, addProductImage, type ProductWithImages } from '@/actions/product.actions'
import { type Category } from '@/actions/category.actions'
import { type Collection } from '@/actions/collection.actions'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import { ImageUploadManager } from './ImageUploadManager'

type ProductFormInput = z.input<typeof productSchema>
type ProductFormData = z.output<typeof productSchema>

interface ProductFormProps {
  initialData?: ProductWithImages
  categories: Category[]
  collections: Collection[]
}

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-secondary/50 hover:bg-secondary text-sm font-semibold text-foreground transition-colors"
      >
        {title}
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {isOpen && <div className="p-4 space-y-5">{children}</div>}
    </div>
  )
}

function Field({ label, htmlFor, required, children, error }: {
  label: string; htmlFor: string; required?: boolean; children: React.ReactNode; error?: string
}) {
  return (
    <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground sm:pt-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="mt-1 sm:col-span-2 sm:mt-0">
        {children}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}

const inputClass = "block w-full max-w-lg rounded-md border-border py-2 px-3 shadow-sm focus:border-primary focus:ring-primary sm:max-w-xs sm:text-sm border outline-none bg-background"
const selectClass = "block w-full max-w-lg rounded-md border-border py-2 px-3 shadow-sm focus:border-primary focus:ring-primary sm:max-w-xs sm:text-sm border outline-none bg-background"
const textareaClass = "block w-full max-w-lg rounded-md border-border py-2 px-3 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border outline-none bg-background"

export function ProductForm({ initialData, categories, collections }: ProductFormProps) {
  const router = useRouter()
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
  
  const form = useForm<ProductFormInput, unknown, ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      description: initialData?.description || '',
      featured: initialData?.featured || false,
      in_stock: initialData?.in_stock ?? true,
      is_active: initialData?.is_active ?? true,
      category_id: initialData?.category_id || '',
      collection_id: initialData?.collection_id || '',
      weight_grams: initialData?.weight_grams || null,
      purity: initialData?.purity || '',
      metal_type: initialData?.metal_type || '',
      occasion: initialData?.occasion || [],
      badges: initialData?.badges 
        ? (initialData.new_arrival_until && new Date(initialData.new_arrival_until) < new Date())
          ? initialData.badges.filter((b: string) => b !== 'New Arrival')
          : initialData.badges
        : [],
      seo_title: initialData?.seo_title || '',
      seo_description: initialData?.seo_description || '',
    }
  })

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = form

  async function onSubmit(data: ProductFormData) {
    setGlobalError(null)
    
    const formattedData = {
      ...data,
      category_id: data.category_id || null,
      collection_id: data.collection_id || null,
      purity: data.purity || null,
      metal_type: data.metal_type || null,
      seo_title: data.seo_title || null,
      seo_description: data.seo_description || null,
    }

    let result
    if (initialData) {
      result = await updateProduct(initialData.id, formattedData)
    } else {
      result = await createProduct(formattedData)
      
      // If product creation succeeded and we have deferred files to upload
      if (result.success && result.data && selectedFiles.length > 0) {
        setIsUploadingFiles(true)
        const errs: string[] = []
        
        for (const file of selectedFiles) {
          try {
            const res = await fetch('/api/upload', {
              method: 'POST',
              body: JSON.stringify({ filename: file.name, contentType: file.type }),
              headers: { 'Content-Type': 'application/json' }
            })
            
            if (!res.ok) {
              const data = await res.json()
              throw new Error(data.error || 'Failed to get upload URL')
            }
            
            const { uploadUrl, publicUrl, path } = await res.json()

            const uploadRes = await fetch(uploadUrl, {
              method: 'PUT',
              body: file,
              headers: { 'Content-Type': file.type }
            })

            if (!uploadRes.ok) throw new Error(`Direct upload failed for ${file.name}`)

            const addRes = await addProductImage(result.data.id, publicUrl, path)
            if (!addRes.success) {
              throw new Error(addRes.error || `Failed to save metadata for ${file.name}`)
            }
          } catch (e: unknown) {
            errs.push(e instanceof Error ? e.message : String(e))
          }
        }
        
        setIsUploadingFiles(false)
        
        if (errs.length > 0) {
          setGlobalError(`Product created, but some image uploads failed: ${errs.join(', ')}`)
          return
        }
      }
    }

    if (!result.success) {
      if (result.error) {
        setGlobalError(result.error)
      }
      return
    }

    router.push('/admin/products')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      
      {globalError && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <h3 className="text-sm font-medium text-red-800">{globalError}</h3>
        </div>
      )}

      {/* ─── Section 1: Basic Info ─────────────────────────────────────── */}
      <Section title="Basic Info" defaultOpen={true}>
        <Field label="Product Name" htmlFor="name" required error={errors.name?.message}>
          <input type="text" id="name" {...register('name')} className={inputClass} />
        </Field>

        <Field label="Slug" htmlFor="slug" error={errors.slug?.message}>
          <input type="text" id="slug" {...register('slug')} placeholder="auto-generated-if-empty" className={inputClass} />
        </Field>

        <Field label="Description" htmlFor="description" error={errors.description?.message}>
          <textarea id="description" rows={4} {...register('description')} className={textareaClass} />
        </Field>

        <Field label="Category" htmlFor="category_id" error={errors.category_id?.message}>
          <select id="category_id" {...register('category_id')} className={selectClass}>
            <option value="">No Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Collection" htmlFor="collection_id" error={errors.collection_id?.message}>
          <select id="collection_id" {...register('collection_id')} className={selectClass}>
            <option value="">No Collection</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
      </Section>

      {/* ─── Section 2: Product Specs ──────────────────────────────────── */}
      <Section title="Product Specs" defaultOpen={!!initialData}>
        <Field label="Metal Type" htmlFor="metal_type" error={errors.metal_type?.message}>
          <select id="metal_type" {...register('metal_type')} className={selectClass}>
            <option value="">Select metal</option>
            {METAL_TYPES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </Field>

        <Field label="Purity" htmlFor="purity" error={errors.purity?.message}>
          <select id="purity" {...register('purity')} className={selectClass}>
            <option value="">No specific purity</option>
            {PURITY_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </Field>

        <Field label="Weight (grams)" htmlFor="weight_grams" error={errors.weight_grams?.message}>
          <input
            type="number"
            step="0.001"
            min="0"
            id="weight_grams"
            {...register('weight_grams', { setValueAs: v => v === '' ? null : parseFloat(v) })}
            placeholder="e.g. 12.500"
            className={inputClass}
          />
        </Field>
      </Section>

      {/* ─── Section 3: Tags & Discovery ───────────────────────────────── */}
      <Section title="Tags & Discovery" defaultOpen={false}>
        <Field label="Occasion" htmlFor="occasion">
          <Controller
            name="occasion"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2 max-w-lg">
                {OCCASION_OPTIONS.map((occ) => {
                  const isSelected = (field.value || []).includes(occ)
                  return (
                    <button
                      key={occ}
                      type="button"
                      onClick={() => {
                        const current = field.value || []
                        field.onChange(
                          isSelected ? current.filter(o => o !== occ) : [...current, occ]
                        )
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                        isSelected
                          ? 'bg-primary text-white border-primary'
                          : 'bg-background border-border text-foreground hover:border-primary'
                      }`}
                    >
                      {occ}
                    </button>
                  )
                })}
              </div>
            )}
          />
        </Field>

        <Field label="Badges" htmlFor="badges">
          <Controller
            name="badges"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2 max-w-lg">
                {BADGE_OPTIONS.map((badge) => {
                  const isSelected = (field.value || []).includes(badge)
                  return (
                    <button
                      key={badge}
                      type="button"
                      onClick={() => {
                        const current = field.value || []
                        field.onChange(
                          isSelected ? current.filter(b => b !== badge) : [...current, badge]
                        )
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                        isSelected
                          ? 'bg-primary text-white border-primary'
                          : 'bg-background border-border text-foreground hover:border-primary'
                      }`}
                    >
                      {badge}
                    </button>
                  )
                })}
              </div>
            )}
          />
        </Field>
      </Section>

      {/* ─── Section 4: Status & Settings ──────────────────────────────── */}
      <Section title="Status & Settings" defaultOpen={true}>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <div className="flex items-center">
            <input id="featured" type="checkbox" {...register('featured')} className="h-4 w-4 rounded border-border text-primary focus:ring-primary outline-none" />
            <label htmlFor="featured" className="ml-2 block text-sm text-foreground">Featured Product</label>
          </div>
          <div className="flex items-center">
            <input id="in_stock" type="checkbox" {...register('in_stock')} className="h-4 w-4 rounded border-border text-primary focus:ring-primary outline-none" />
            <label htmlFor="in_stock" className="ml-2 block text-sm text-foreground">In Stock</label>
          </div>
          <div className="flex items-center">
            <input id="is_active" type="checkbox" {...register('is_active')} className="h-4 w-4 rounded border-border text-primary focus:ring-primary outline-none" />
            <label htmlFor="is_active" className="ml-2 block text-sm text-foreground">Active (Public)</label>
          </div>
        </div>
      </Section>

      {/* ─── Section 5: SEO ────────────────────────────────────────────── */}
      <Section title="Advanced SEO (Optional)" defaultOpen={false}>
        <Field label="SEO Title" htmlFor="seo_title" error={errors.seo_title?.message}>
          <input type="text" id="seo_title" {...register('seo_title')} placeholder="Custom page title (overrides product name)" className={inputClass} />
        </Field>
        <Field label="SEO Description" htmlFor="seo_description" error={errors.seo_description?.message}>
          <textarea id="seo_description" rows={2} {...register('seo_description')} placeholder="Custom meta description" className={textareaClass} />
        </Field>
      </Section>

      {/* ─── Section 6: Images ─────────────────────────────────────────── */}
      <Section title="Product Images" defaultOpen={true}>
        {initialData ? (
          <ImageUploadManager 
            productId={initialData.id} 
            existingImages={initialData.product_images} 
          />
        ) : (
          <ImageUploadManager 
            deferredMode={true}
            onFilesChange={setSelectedFiles}
          />
        )}
      </Section>

      {/* ─── Submit ────────────────────────────────────────────────────── */}
      <div className="pt-5 border-t border-border">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.push('/admin/products')}
            className="rounded-md border border-border bg-background py-2 px-4 text-sm font-medium text-foreground shadow-sm hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isUploadingFiles}
            className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-primary py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {isSubmitting || isUploadingFiles ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                {isUploadingFiles ? 'Uploading Images...' : 'Saving...'}
              </>
            ) : (
              'Save Product'
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
