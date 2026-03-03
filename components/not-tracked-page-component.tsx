import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, ArrowLeft, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function NotTrackedPageComponent({ address }: { address: string }) {
  // Ensure we never display "undefined" or placeholder text
  const isInvalid = !address || address === "undefined" || address === "invalid-address"
  
  const displayAddress = isInvalid ? null : address
  const displayMessage = isInvalid
    ? "The token address could not be determined from the URL."
    : "This token isn't indexed in SOLRAD yet. We actively monitor top-trending tokens and add new ones daily."
    
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-lg w-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
          <Activity className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-3">
          {isInvalid ? "Invalid Token Address" : "Token Not Tracked Yet"}
        </h1>
        <p className="text-muted-foreground mb-4">
          {displayMessage}
        </p>
        {displayAddress && (
          <code className="text-xs bg-muted px-3 py-2 rounded font-mono block mb-6 break-all">
            {displayAddress}
          </code>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Link href="https://x.com/solrad_io" target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Request on Twitter
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
