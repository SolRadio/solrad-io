"use client"

import { useState } from "react"

export function ContactForm() {
  const [email, setEmail] = useState("")
  const [topic, setTopic] = useState("")
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, topic, message }),
      })

      if (!res.ok) throw new Error("Failed")
      setStatus("success")
      setEmail("")
      setTopic("")
      setMessage("")
    } catch {
      setStatus("error")
    }
  }

  if (status === "success") {
    return (
      <div className="bg-card border border-border rounded-none p-6 text-center">
        <p className="text-sm font-bold text-green-500 font-mono">
          Message sent!
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          We{"'"}ll get back to you within 24-48 hours.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-none p-6">
      <h2 className="text-sm font-bold uppercase tracking-wide text-center mb-4">
        Send a Message
      </h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:border-primary outline-none focus:ring-1 focus:ring-primary/20"
        />

        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:border-primary outline-none text-muted-foreground"
        >
          <option value="">Select topic...</option>
          <option value="bug">Bug Report</option>
          <option value="feature">Feature Request</option>
          <option value="data">Data Question</option>
          <option value="other">Other</option>
        </select>

        <textarea
          placeholder="Your message..."
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:border-primary outline-none focus:ring-1 focus:ring-primary/20 resize-none"
        />

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full bg-primary text-white py-2.5 rounded text-sm font-bold font-mono hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {status === "loading" ? "SENDING..." : "SEND MESSAGE"}
        </button>
      </form>

      {status === "error" && (
        <p className="text-xs text-destructive text-center mt-3 font-mono">
          Something went wrong. Please email support@solrad.io directly.
        </p>
      )}

      <p className="text-[10px] text-muted-foreground text-center mt-3">
        We cannot provide investment advice or token-specific recommendations.
      </p>
    </div>
  )
}
