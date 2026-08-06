"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useSignalMapStore } from "@/lib/store/signal-map-store";
import { SIGNAL_TYPE_META, type Signal, type SignalType } from "@/lib/types";

const SEVERITY_LABELS: Record<number, string> = {
  1: "1 — Informational",
  2: "2 — Notable",
  3: "3 — Concerning",
  4: "4 — Severe",
  5: "5 — Critical",
};

export function NewSignalDialog() {
  const chapters = useSignalMapStore((s) => s.chapters);
  const recordPing = useSignalMapStore((s) => s.recordPing);

  const [open, setOpen] = useState(false);
  const [chapterId, setChapterId] = useState("");
  const [type, setType] = useState<SignalType | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("2");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = chapterId && type && title.trim() && description.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId,
          type,
          title: title.trim(),
          description: description.trim(),
          severity: Number(severity),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to submit signal");
      }
      const signal: Signal = await res.json();
      recordPing(signal);

      setOpen(false);
      setChapterId("");
      setType("");
      setTitle("");
      setDescription("");
      setSeverity("2");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="glass-panel pointer-events-auto flex items-center gap-2 rounded-full px-4 py-3 text-xs font-medium text-foreground transition hover:text-primary">
            <Plus className="h-3.5 w-3.5" />
            New Signal
          </button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit a signal</DialogTitle>
          <DialogDescription>
            Share a real problem, solution, or update from a chapter. It goes
            live on the map immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Select value={chapterId} onValueChange={(v) => setChapterId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chapter" />
            </SelectTrigger>
            <SelectContent>
              {chapters.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.countryName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={type} onValueChange={(v) => setType((v ?? "") as SignalType)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Signal type" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SIGNAL_TYPE_META) as SignalType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {SIGNAL_TYPE_META[t].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
          />

          <Textarea
            placeholder="What's happening? Be specific."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={4}
          />

          <Select value={severity} onValueChange={(v) => setSeverity(v ?? "2")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {SEVERITY_LABELS[n]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <DialogFooter className="-mx-4 -mb-4 mt-4">
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit signal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
