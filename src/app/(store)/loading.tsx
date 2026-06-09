import { Loader2 } from 'lucide-react'

export default function StoreLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground tracking-widest uppercase text-sm">Loading Nakoda Jewellers...</p>
      </div>
    </div>
  )
}
