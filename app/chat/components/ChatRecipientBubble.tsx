import { Badge } from '@/components/ui/badge'
import { formatTime } from '@/lib/timestamp'

interface ChatRecipientBubbleProps {
  text: string
  senderName: string
  timestamp: Date
  isSystemAdmin: boolean
  isCreator: boolean
}

export function ChatRecipientBubble({
  text,
  senderName,
  timestamp,
  isSystemAdmin,
  isCreator,
}: ChatRecipientBubbleProps) {
  const getRoleTag = () => {
    if (isSystemAdmin && isCreator) {
      return <Badge className="ml-2 text-xs">Admin + Seller</Badge>
    }
    if (isSystemAdmin) {
      return <Badge className="ml-2 text-xs" variant="destructive">System Admin</Badge>
    }
    if (isCreator) {
      return <Badge className="ml-2 text-xs" variant="secondary">Seller</Badge>
    }
    return <Badge className="ml-2 text-xs" variant="outline">Buyer</Badge>
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-xs lg:max-w-md xl:max-w-lg">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-muted-foreground">{senderName}</span>
          {getRoleTag()}
        </div>
        <div className="bg-muted text-foreground rounded-2xl rounded-tl-none px-4 py-2">
          <p className="break-words">{text}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {formatTime(timestamp)}
        </p>
      </div>
    </div>
  )
}
