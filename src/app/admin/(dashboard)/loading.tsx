import { Loader2 } from 'lucide-react'

export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm font-medium">Loading...</p>
      </div>
    </div>
  )
}
