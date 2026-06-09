import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

export async function uploadProductImage(file: File): Promise<{ url: string; path: string } | null> {
  const supabase = await createClient()
  
  const fileExt = file.name.split('.').pop()?.toLowerCase()
  if (!fileExt) {
    return null
  }

  const fileName = `${uuidv4()}.${fileExt}`
  const filePath = `products/${fileName}`

  const { error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Error uploading image:', error)
    return null
  }

  const { data: publicUrlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath)

  return {
    url: publicUrlData.publicUrl,
    path: filePath
  }
}

export async function deleteProductImage(path: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { error } = await supabase.storage
    .from('product-images')
    .remove([path])

  if (error) {
    console.error('Error deleting image:', error)
    return false
  }

  return true
}
