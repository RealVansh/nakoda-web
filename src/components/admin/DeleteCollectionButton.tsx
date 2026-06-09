'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteCollection } from '@/actions/collection.actions'

export function DeleteCollectionButton({ id, name }: { id: string; name: string }) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (confirm(`Are you sure you want to delete the collection "${name}"? This will not delete the products inside it, but they will be removed from this collection.`)) {
      setIsDeleting(true)
      const result = await deleteCollection(id)
      if (result && !result.success) {
        alert(`Failed to delete collection: ${result.error}`)
      }
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
      title="Delete Collection"
    >
      <Trash2 className="h-5 w-5" />
      <span className="sr-only">Delete</span>
    </button>
  )
}
