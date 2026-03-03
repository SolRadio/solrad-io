export default function ProSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-4">
      <h1 className="font-mono text-3xl font-bold uppercase tracking-tight">
        WELCOME TO PRO
      </h1>
      <p className="text-sm text-muted-foreground mt-3 max-w-sm">
        Your SOLRAD Pro subscription is active. Full access to Score Lab, signal history, and all Pro features.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <a
          href="/score-lab"
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-bold font-mono hover:bg-primary/90 transition-colors"
        >
          {"OPEN SCORE LAB \u2192"}
        </a>
        <a
          href="/"
          className="bg-card border border-border text-foreground px-6 py-2.5 rounded-lg text-sm font-mono hover:border-primary/50 transition-colors"
        >
          GO TO DASHBOARD
        </a>
      </div>
      <p className="text-[10px] text-muted-foreground font-mono mt-8">
        Manage your subscription from account settings.
      </p>
    </div>
  )
}
