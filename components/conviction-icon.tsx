"use client";

import * as React from "react";
import { getConviction } from "@/lib/conviction";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ShieldCheck, Activity, AlertTriangle, XCircle } from "lucide-react";

type Props = {
  score: number;
  riskLabel?: string;
  volume24h?: number;
  liquidity?: number;
  holderCount?: number;
};

function normalizeRisk(riskLabel?: string) {
  if (!riskLabel) return undefined;
  return riskLabel.replace(" RISK", "").trim();
}

export function ConvictionIcon({
  score,
  riskLabel,
  volume24h,
  liquidity,
  holderCount,
}: Props) {
  const riskLevel = normalizeRisk(riskLabel);

  const result = getConviction({
    score,
    riskLevel,
    volume24h,
    liquidity,
    holderCount,
  });

  const cfg = React.useMemo(() => {
    switch (result.level) {
      case "HIGH_CONVICTION":
        return { Icon: ShieldCheck, cls: "text-green-400" };
      case "MODERATE":
        return { Icon: Activity, cls: "text-yellow-400" };
      case "SPECULATIVE":
        return { Icon: AlertTriangle, cls: "text-orange-400" };
      default:
        return { Icon: XCircle, cls: "text-red-400" };
    }
  }, [result.level]);

  const { Icon, cls } = cfg;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex items-center justify-center ${cls} opacity-90 hover:opacity-100`}
          aria-label={result.label}
          title={result.label}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px]">
        <div className="text-xs font-medium">{result.label}</div>
        <div className="text-[11px] opacity-80 mt-0.5">{result.summary}</div>
        <div className="text-[10px] opacity-60 mt-1">Based on score + risk</div>
      </TooltipContent>
    </Tooltip>
  );
}
