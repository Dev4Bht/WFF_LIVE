"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_METRIC_LABEL_LENGTH,
  MAX_METRIC_VALUE_LENGTH,
  MAX_METRICS,
  MAX_TITLE_LENGTH,
} from "@/lib/story-content";
import type { Chapter, Spotlight, StoryMetric } from "@/lib/types";

const TOKEN_STORAGE_KEY = "wff-admin-token";

type Draft = {
  ambassadorName: string;
  ambassadorRole: string;
  problemTitle: string;
  problemDescription: string;
  solutionTitle: string;
  solutionDescription: string;
  metrics: StoryMetric[];
};

function toDraft(spotlight: Spotlight | undefined): Draft {
  const metrics = [...(spotlight?.metrics ?? [])];
  while (metrics.length < MAX_METRICS) metrics.push({ value: "", label: "" });

  return {
    ambassadorName: spotlight?.ambassador?.name ?? "",
    ambassadorRole: spotlight?.ambassador?.role ?? "",
    problemTitle: spotlight?.problem?.title ?? "",
    problemDescription: spotlight?.problem?.description ?? "",
    solutionTitle: spotlight?.solution?.title ?? "",
    solutionDescription: spotlight?.solution?.description ?? "",
    metrics: metrics.slice(0, MAX_METRICS),
  };
}

export default function StoryAdminPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [spotlights, setSpotlights] = useState<Record<string, Spotlight>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(toDraft(undefined));
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [chaptersRes, spotlightsRes] = await Promise.all([
        fetch("/api/chapters"),
        fetch("/api/spotlights"),
      ]);
      const chapterList: Chapter[] = await chaptersRes.json();
      const spotlightList: Spotlight[] = await spotlightsRes.json();

      if (cancelled) return;
      setChapters(chapterList);
      setSpotlights(Object.fromEntries(spotlightList.map((s) => [s.chapterId, s])));
      // Read after the awaits so it never runs during SSR, where there is no
      // localStorage.
      setToken(window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? "");
      setIsLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Seeding the form happens here rather than in an effect keyed on
  // selectedId, so a save that refreshes `spotlights` can't clobber whatever
  // the user has since typed.
  function selectChapter(chapterId: string) {
    setSelectedId(chapterId);
    setDraft(toDraft(spotlights[chapterId]));
    setError(null);
    setSavedAt(null);
  }

  const selectedChapter = useMemo(
    () => chapters.find((c) => c.id === selectedId) ?? null,
    [chapters, selectedId]
  );

  const filledCount = useMemo(
    () => chapters.filter((c) => spotlights[c.id]?.problem).length,
    [chapters, spotlights]
  );

  function updateMetric(index: number, patch: Partial<StoryMetric>) {
    setDraft((d) => ({
      ...d,
      metrics: d.metrics.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    }));
  }

  const canSave =
    Boolean(selectedId) &&
    draft.ambassadorName.trim() &&
    draft.problemTitle.trim() &&
    draft.problemDescription.trim() &&
    draft.solutionTitle.trim() &&
    draft.solutionDescription.trim();

  async function handleSave() {
    if (!selectedId || !canSave || isSaving) return;

    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/spotlights/${selectedId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "x-admin-token": token } : {}),
        },
        body: JSON.stringify({
          ambassadorName: draft.ambassadorName,
          ambassadorRole: draft.ambassadorRole,
          problem: {
            title: draft.problemTitle,
            description: draft.problemDescription,
          },
          solution: {
            title: draft.solutionTitle,
            description: draft.solutionDescription,
          },
          // Blank rows are placeholders for unused metric slots, not data.
          metrics: draft.metrics.filter((m) => m.value.trim() && m.label.trim()),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Save failed (${res.status})`);
      }

      const saved: Spotlight = await res.json();
      setSpotlights((prev) => ({ ...prev, [selectedId]: saved }));
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    // The root layout sets `overflow-hidden` on <body> for the globe, so this
    // page owns its own scroll container or the form gets clipped.
    <main className="h-dvh w-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">Chapter stories</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edits publish straight to the live globe — no redeploy. {filledCount} of{" "}
          {chapters.length} chapters have a story.
        </p>

        <div className="mt-4 max-w-sm">
          <label className="text-xs font-medium text-muted-foreground">
            Admin token
          </label>
          <Input
            type="password"
            value={token}
            placeholder="Required only when ADMIN_TOKEN is set"
            onChange={(e) => {
              setToken(e.target.value);
              window.localStorage.setItem(TOKEN_STORAGE_KEY, e.target.value);
            }}
            className="mt-1"
          />
        </div>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading chapters…</p>
      ) : (
        <div className="grid gap-8 md:grid-cols-[220px_1fr]">
          <nav className="flex max-h-[70vh] flex-col gap-1 overflow-y-auto pr-1">
            {chapters.map((chapter) => {
              const hasStory = Boolean(spotlights[chapter.id]?.problem);
              const isActive = chapter.id === selectedId;
              return (
                <button
                  key={chapter.id}
                  onClick={() => selectChapter(chapter.id)}
                  className={`flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                    isActive
                      ? "bg-primary/15 text-foreground"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: chapter.color }}
                    />
                    {chapter.countryName}
                  </span>
                  {hasStory && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                </button>
              );
            })}
          </nav>

          {!selectedChapter ? (
            <p className="text-sm text-muted-foreground">
              Select a chapter to edit its story.
            </p>
          ) : (
            <section className="space-y-6">
              <h2 className="text-lg font-medium">{selectedChapter.countryName}</h2>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Ambassador name">
                  <Input
                    value={draft.ambassadorName}
                    maxLength={80}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, ambassadorName: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Ambassador role">
                  <Input
                    value={draft.ambassadorRole}
                    maxLength={80}
                    placeholder="Youth Ambassador"
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, ambassadorRole: e.target.value }))
                    }
                  />
                </Field>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold tracking-wide text-rose-400 uppercase">
                  Challenge
                </p>
                <div className="space-y-2">
                  <Input
                    value={draft.problemTitle}
                    maxLength={MAX_TITLE_LENGTH}
                    placeholder="Title"
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, problemTitle: e.target.value }))
                    }
                  />
                  <Textarea
                    value={draft.problemDescription}
                    maxLength={MAX_DESCRIPTION_LENGTH}
                    rows={4}
                    placeholder="What is going wrong, and why?"
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, problemDescription: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold tracking-wide text-emerald-400 uppercase">
                  Initiative
                </p>
                <div className="space-y-2">
                  <Input
                    value={draft.solutionTitle}
                    maxLength={MAX_TITLE_LENGTH}
                    placeholder="Title"
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, solutionTitle: e.target.value }))
                    }
                  />
                  <Textarea
                    value={draft.solutionDescription}
                    maxLength={MAX_DESCRIPTION_LENGTH}
                    rows={4}
                    placeholder="What are chapters doing about it?"
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        solutionDescription: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold tracking-wide uppercase">
                  Impact metrics
                </p>
                <p className="mb-2 text-xs text-muted-foreground">
                  Up to {MAX_METRICS} headline figures. Leave a row blank to skip
                  it. Use real, sourced numbers — these read as fact on the globe.
                </p>
                <div className="space-y-2">
                  {draft.metrics.map((metric, i) => (
                    <div key={i} className="grid grid-cols-[110px_1fr] gap-2">
                      <Input
                        value={metric.value}
                        maxLength={MAX_METRIC_VALUE_LENGTH}
                        placeholder="33%"
                        onChange={(e) => updateMetric(i, { value: e.target.value })}
                      />
                      <Input
                        value={metric.label}
                        maxLength={MAX_METRIC_LABEL_LENGTH}
                        placeholder="of food wasted"
                        onChange={(e) => updateMetric(i, { label: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex items-center gap-3">
                <Button onClick={handleSave} disabled={!canSave || isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isSaving ? "Saving…" : "Save story"}
                </Button>
                {savedAt && !isSaving && (
                  <span className="text-sm text-emerald-400">Saved</span>
                )}
              </div>
            </section>
          )}
        </div>
      )}
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
