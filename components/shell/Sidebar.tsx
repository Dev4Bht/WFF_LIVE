"use client";

import { useEffect, useState } from "react";
import { Users, Radio, Link2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useSignalMapStore } from "@/lib/store/signal-map-store";
import { SIGNAL_TYPE_META } from "@/lib/types";

interface Member {
  id: string;
  name: string;
  role: string | null;
  isOnline: boolean;
}

interface DetailSignal {
  id: string;
  type: keyof typeof SIGNAL_TYPE_META;
  title: string;
  description: string;
  severity: number;
  status: string;
}

interface ChapterDetail {
  id: string;
  countryName: string;
  city: string | null;
  description: string | null;
  memberCount: number;
  color: string;
  members: Member[];
  signals: DetailSignal[];
  connectionsA: { toChapter: { countryName: string } }[];
  connectionsB: { fromChapter: { countryName: string } }[];
}

export function Sidebar() {
  const selectedChapterId = useSignalMapStore((s) => s.selectedChapterId);
  const selectChapter = useSignalMapStore((s) => s.selectChapter);
  const [detail, setDetail] = useState<ChapterDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedChapterId) return;
    let cancelled = false;
    // Kicking off a loading flag when a fetch starts is the effect's job
    // here; there's no external subscription to derive it from instead.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    fetch(`/api/chapters/${selectedChapterId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedChapterId]);

  // Derived during render rather than reset via effect: once a different
  // chapter is selected, the previous chapter's fetched detail is stale
  // until the new fetch above resolves.
  const currentDetail = detail?.id === selectedChapterId ? detail : null;

  const open = selectedChapterId !== null;
  const onlineCount = currentDetail?.members.filter((m) => m.isOnline).length ?? 0;
  const connectionCount =
    (currentDetail?.connectionsA.length ?? 0) + (currentDetail?.connectionsB.length ?? 0);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) selectChapter(null);
      }}
    >
      <SheetContent
        side="right"
        className="glass-panel w-full border-l border-white/10 sm:max-w-md"
      >
        <SheetHeader>
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full text-glow"
              style={{ backgroundColor: currentDetail?.color ?? "#38bdf8", color: currentDetail?.color }}
            />
            <SheetTitle className="text-lg">
              {currentDetail?.countryName ?? "Loading chapter..."}
            </SheetTitle>
          </div>
          <SheetDescription>
            {currentDetail?.city ?? ""}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4 pb-6">
          {isLoading && !currentDetail && (
            <p className="text-sm text-muted-foreground">Loading chapter signal...</p>
          )}

          {currentDetail && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">{currentDetail.description}</p>

              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span>{currentDetail.memberCount} members</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{onlineCount} online now</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5 text-sky-400" />
                  <span>{connectionCount} connections</span>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Active Signals
                </h3>
                <div className="space-y-2">
                  {currentDetail.signals.length === 0 && (
                    <p className="text-sm text-muted-foreground">No signals yet.</p>
                  )}
                  {currentDetail.signals.map((signal) => {
                    const meta = SIGNAL_TYPE_META[signal.type];
                    return (
                      <div
                        key={signal.id}
                        className="rounded-lg border border-white/10 bg-white/[0.02] p-3"
                        style={{ borderLeftColor: meta.color, borderLeftWidth: 3 }}
                      >
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className="border-white/15 text-[10px] uppercase"
                            style={{ color: meta.color }}
                          >
                            {meta.label}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {signal.status}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm font-medium">{signal.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {signal.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Chapter Members
                </h3>
                <div className="space-y-1.5">
                  {currentDetail.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            member.isOnline ? "bg-emerald-400" : "bg-muted-foreground/40"
                          }`}
                        />
                        {member.name}
                      </span>
                      <span className="text-xs text-muted-foreground">{member.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
