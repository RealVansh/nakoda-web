'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteProduct } from '@/actions/product.actions'

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      setIsDeleting(true)
      const result = await deleteProduct(id)
      if (result && !result.success) {
        alert(`Failed to delete product: ${result.error}`)
      }
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
      title="Delete Product"
    >
      <Trash2 className="h-5 w-5" />
      <span className="sr-only">Delete</span>
    </button>
  )
}
