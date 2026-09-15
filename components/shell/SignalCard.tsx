"use client";

import { motion } from "motion/react";
import { SIGNAL_TYPE_META, type Signal } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface SignalCardProps {
  signal: Signal;
  onClick?: () => void;
}

export function SignalCard({ signal, onClick }: SignalCardProps) {
  const meta = SIGNAL_TYPE_META[signal.type];
  const timeAgo = formatTimeAgo(signal.createdAt);

  return (
    <motion.button
      layout
      onClick={onClick}
      initial={{ opacity: 0, x: 24, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="glass-panel group w-full rounded-2xl p-3.5 text-left transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.075]"
      style={{ borderLeft: `3px solid ${meta.color}` }}
    >
      <div className="flex items-center justify-between gap-2">
        <Badge
          variant="outline"
          className="border-white/15 bg-white/[0.035] text-[10px] tracking-wide uppercase"
          style={{ color: meta.color }}
        >
          {meta.label}
        </Badge>
        <span className="text-[10px] text-muted-foreground transition group-hover:text-foreground/70">
          {timeAgo}
        </span>
      </div>
      <p className="mt-2.5 text-sm font-medium leading-5 text-foreground">{signal.title}</p>
      <p className="mt-1.5 line-clamp-2 text-xs leading-4 text-muted-foreground">
        {signal.description}
      </p>
      {signal.chapter && (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground/85">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: signal.chapter.color }}
          />
          <span>{signal.chapter.countryName}</span>
        </p>
      )}
    </motion.button>
  );
}

function formatTimeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
