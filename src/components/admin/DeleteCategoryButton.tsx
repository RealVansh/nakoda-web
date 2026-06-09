'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteCategory } from '@/actions/category.actions'

export function DeleteCategoryButton({ id, name }: { id: string; name: string }) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (confirm(`Are you sure you want to delete "${name}"? This might break products linked to this category.`)) {
      setIsDeleting(true)
      const result = await deleteCategory(id)
      if (result && !result.success) {
        alert(`Failed to delete category: ${result.error}`)
      }
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
      title="Delete Category"
    >
      <Trash2 className="h-5 w-5" />
      <span className="sr-only">Delete</span>
    </button>
  )
}
