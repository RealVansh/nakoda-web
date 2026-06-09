'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteInquiry } from '@/actions/inquiry.actions'

export function DeleteInquiryButton({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (confirm(`Are you sure you want to delete this inquiry?`)) {
      setIsDeleting(true)
      const result = await deleteInquiry(id)
      if (result && !result.success) {
        alert(`Failed to delete inquiry: ${result.error}`)
      }
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
      title="Delete Inquiry"
    >
      <Trash2 className="h-5 w-5" />
      <span className="sr-only">Delete</span>
    </button>
  )
}
