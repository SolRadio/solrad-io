"use client"

const AD_STYLE = {
  border: 0,
  padding: 0,
  width: "100%",
  maxWidth: "100%",
  height: "180px",
  overflow: "hidden" as const,
  display: "block",
  margin: 0,
}

function AdCard({ id, title }: { id: string; title: string }) {
  return (
    <div className="w-full rounded-lg border bg-card/95 p-2 box-border border-[rgba(3,31,36,1)]">
      <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/50 mb-1">SPONSORED</div>
      <div className="w-full rounded overflow-hidden">
        <iframe
          data-aa={id}
          src={`https://acceptable.a-ads.com/${id}/?size=Adaptive`}
          width="200"
          height="180"
          style={AD_STYLE}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={title}
        />
      </div>
    </div>
  )
}

/** Single ad card exported for external composition */
export { AdCard }

export function AAdsRightRail() {
  return (
    <aside className="w-full">
      <div className="flex flex-col gap-3">
        <AdCard id="2425083" title="Advertisement 1" />
      </div>
    </aside>
  );
}
