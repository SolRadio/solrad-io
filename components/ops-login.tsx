"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Shield, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface OpsLoginProps {
  onSuccess: () => void
  onCancel: () => void
}

export function OpsLogin({ onSuccess, onCancel }: OpsLoginProps) {
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleLogin = async () => {
    if (!password.trim()) {
      toast({
        title: "Error",
        description: "Please enter password",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/ops/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        toast({
          title: "Error",
          description: data.error || "Invalid password",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Logged in to OPS",
      })

      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6 space-y-6 w-full max-w-md border-primary/30 bg-card/95 backdrop-blur">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wide">OPS LOGIN</h2>
          <p className="text-sm text-muted-foreground">Admin access required</p>
        </div>
      </div>

      {/* Password Input */}
      <div className="space-y-2">
        <Label htmlFor="password" className="uppercase font-semibold text-sm">
          PASSWORD
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter OPS password..."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleLogin()
            }
          }}
          disabled={isLoading}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 uppercase font-bold bg-transparent"
        >
          CANCEL
        </Button>
        <Button onClick={handleLogin} disabled={isLoading || !password.trim()} className="flex-1 uppercase font-bold">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              LOGGING IN...
            </>
          ) : (
            "LOGIN"
          )}
        </Button>
      </div>
    </Card>
  )
}
