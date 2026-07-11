'use client'

import { useState, useRef } from 'react'
import { UploadCloud, Loader2, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { addProductImage, removeProductImage, type ProductImage } from '@/actions/product.actions'

export function ImageUploadManager({ 
  productId, 
  existingImages = [],
  deferredMode = false,
  onFilesChange
}: { 
  productId?: string, 
  existingImages?: ProductImage[],
  deferredMode?: boolean,
  onFilesChange?: (files: File[]) => void
}) {
  const [images, setImages] = useState<ProductImage[]>(existingImages)
  const [previewFiles, setPreviewFiles] = useState<{file: File, url: string}[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadError(null)
    
    if (deferredMode) {
      const newPreviewFiles = Array.from(files).map(file => ({
        file,
        url: URL.createObjectURL(file)
      }))
      const updatedFiles = [...previewFiles, ...newPreviewFiles]
      setPreviewFiles(updatedFiles)
      onFilesChange?.(updatedFiles.map(pf => pf.file))
    } else {
      if (!productId) return
      setIsUploading(true)
      
      const newImages: ProductImage[] = []
      const errs: string[] = []

      for (const file of Array.from(files)) {
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

          const addRes = await addProductImage(productId, publicUrl, path)
          if (addRes.success && addRes.data) {
            newImages.push(addRes.data)
          } else {
            throw new Error(addRes.error || `Failed to save metadata for ${file.name}`)
          }
        } catch (e: unknown) {
          errs.push(e instanceof Error ? e.message : String(e))
        }
      }

      if (newImages.length > 0) {
        setImages(prev => [...prev, ...newImages])
      }
      
      if (errs.length > 0) {
        setUploadError(errs.join(', '))
      }
      
      setIsUploading(false)
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleDeleteImage(imageId: string) {
    if (!confirm('Are you sure you want to delete this image?')) return
    
    setDeletingImageId(imageId)
    const previousImages = [...images]
    setImages(images.filter(img => img.id !== imageId))
    
    const result = await removeProductImage(imageId)
    if (!result.success) {
      alert(result.error || 'Failed to delete image')
      setImages(previousImages)
    }
    setDeletingImageId(null)
  }

  function handleRemovePreview(index: number) {
    const newPreviews = [...previewFiles]
    URL.revokeObjectURL(newPreviews[index].url) // cleanup memory
    newPreviews.splice(index, 1)
    setPreviewFiles(newPreviews)
    onFilesChange?.(newPreviews.map(pf => pf.file))
  }

  return (
    <div className="mt-8 pt-8 border-t border-border">
      <h3 className="text-lg font-medium text-foreground mb-4">Product Images</h3>
      {uploadError && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200" role="alert">
          {uploadError}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 mb-6">
        {/* Existing Uploaded Images */}
        {images.map((img) => (
          <div key={img.id} className="relative aspect-square rounded-lg border border-border overflow-hidden group bg-secondary">
            <Image 
              src={img.image_url} 
              alt={img.alt_text || 'Product image'}
              fill
              sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, 50vw"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => handleDeleteImage(img.id)}
              disabled={deletingImageId === img.id}
              aria-label="Delete product image"
              className="absolute right-2 top-2 rounded-md bg-white/90 p-2 text-red-600 shadow-sm opacity-0 transition-opacity hover:text-red-800 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
            >
              {deletingImageId === img.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        ))}

        {/* Deferred Preview Images */}
        {previewFiles.map((preview, idx) => (
          <div key={preview.url} className="relative aspect-square rounded-lg border border-border overflow-hidden group bg-secondary">
            <Image 
              src={preview.url} 
              alt="Preview upload"
              fill
              sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, 50vw"
              className="object-cover opacity-80"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/10 transition-opacity">
              <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">Pending Save</span>
            </div>
            <button
              type="button"
              onClick={() => handleRemovePreview(idx)}
              aria-label="Remove preview image"
              className="absolute right-2 top-2 rounded-md bg-white/90 p-2 text-red-600 shadow-sm opacity-0 transition-opacity hover:text-red-800 group-hover:opacity-100 focus:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        
        {/* Upload Button */}
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload product images"
          className="relative aspect-square flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-secondary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          ) : (
            <>
              <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm font-medium text-muted-foreground">Upload</span>
            </>
          )}
        </button>
      </div>
      
      <input 
        type="file" 
        multiple 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileUpload}
      />
      <p className="text-xs text-muted-foreground">Upload high quality images (JPEG, PNG). First image is used as thumbnail.</p>
    </div>
  )
}
