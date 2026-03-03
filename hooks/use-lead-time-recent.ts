"use client";

import { useEffect, useMemo, useState } from "react";

type ProofSummary = {
  mint: string;
  leadBlocks?: number;
  leadSeconds?: number;
  confidence?: "LOW" | "MEDIUM" | "HIGH";
  proofCreatedAt?: number;
};

export function useLeadTimeRecentMap(enabled: boolean = true) {
  const [items, setItems] = useState<ProofSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/lead-time/recent", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch lead-time recent");
        const data = await res.json();

        // Support multiple response shapes safely:
        const list: ProofSummary[] =
          data?.proofs ??
          data?.items ??
          data?.recent ??
          [];

        if (alive) {
          setItems(Array.isArray(list) ? list : []);
          setError(null);
        }
      } catch (e: any) {
        if (alive) setError(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [enabled]);

  const map = useMemo(() => {
    const m = new Map<string, ProofSummary>();
    for (const p of items) {
      if (p?.mint) m.set(p.mint, p);
    }
    return m;
  }, [items]);

  return { map, loading, error, items };
}
