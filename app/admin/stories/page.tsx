"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  CircleDot,
  KeyRound,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";
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
      try {
        const [chaptersRes, spotlightsRes] = await Promise.all([
          fetch("/api/chapters"),
          fetch("/api/spotlights"),
        ]);

        if (!chaptersRes.ok || !spotlightsRes.ok) {
          throw new Error("Could not load chapter data. Check the database connection.");
        }

        const chapterList: Chapter[] = await chaptersRes.json();
        const spotlightList: Spotlight[] = await spotlightsRes.json();

        if (cancelled) return;
        setChapters(chapterList);
        setSpotlights(Object.fromEntries(spotlightList.map((s) => [s.chapterId, s])));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load chapter data.");
        }
      } finally {
        if (!cancelled) {
          // Read after the awaits so it never runs during SSR, where there is no
          // localStorage.
          setToken(window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? "");
          setIsLoading(false);
        }
      }
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
  const completionPercent = chapters.length
    ? Math.round((filledCount / chapters.length) * 100)
    : 0;

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
    <main className="relative h-dvh w-full overflow-x-hidden overflow-y-auto bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url(/data/world-silhouette.svg)] bg-center bg-cover opacity-[0.055] sepia-[0.7] hue-rotate-[60deg] saturate-150" />
        <div className="noise-overlay absolute inset-0 opacity-70" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <header className="glass-panel panel-highlight mb-5 min-w-0 max-w-[calc(100vw-2rem)] rounded-2xl px-5 py-5 sm:max-w-none sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-medium tracking-[0.18em] text-primary uppercase">
              <Sparkles className="h-3 w-3" />
              Live editor
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Chapter stories
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Edits publish straight to the live globe. {filledCount} of{" "}
              {chapters.length} chapters have a story.
            </p>
          </div>

          <div className="grid min-w-0 gap-3 sm:grid-cols-[180px_minmax(260px,360px)] lg:min-w-[560px]">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
                Coverage
              </p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-3xl font-semibold">{completionPercent}%</span>
                <span className="pb-1 text-xs text-muted-foreground">
                  complete
                </span>
              </div>
              <ProgressBar value={completionPercent} />
            </div>

            <div className="min-w-0">
              <label className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <KeyRound className="h-3.5 w-3.5 text-primary" />
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
                className="admin-field h-11"
              />
            </div>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="glass-panel max-w-[calc(100vw-2rem)] rounded-2xl px-5 py-12 text-center text-sm text-muted-foreground sm:max-w-none">
          <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin text-primary" />
          Loading chapters...
        </div>
      ) : error && chapters.length === 0 ? (
        <div className="glass-panel panel-highlight max-w-[calc(100vw-2rem)] rounded-2xl px-5 py-12 text-center sm:max-w-none">
          <AlertCircle className="mx-auto mb-3 h-6 w-6 text-amber-300" />
          <h2 className="text-lg font-semibold">Chapter data unavailable</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {error}
          </p>
        </div>
      ) : (
        <div className="grid max-w-[calc(100vw-2rem)] gap-5 sm:max-w-none lg:grid-cols-[300px_1fr]">
          <nav className="glass-panel panel-highlight max-h-[calc(100dvh-190px)] overflow-y-auto rounded-2xl p-2">
            {chapters.map((chapter) => {
              const hasStory = Boolean(spotlights[chapter.id]?.problem);
              const isActive = chapter.id === selectedId;
              return (
                <button
                  key={chapter.id}
                  onClick={() => selectChapter(chapter.id)}
                  className={`group flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition ${
                    isActive
                      ? "bg-primary/15 text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                      : "text-muted-foreground hover:bg-white/[0.055] hover:text-foreground"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_14px_currentColor]"
                      style={{ backgroundColor: chapter.color }}
                    />
                    <span className="truncate">{chapter.countryName}</span>
                  </span>
                  {hasStory ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  ) : (
                    <CircleDot className="h-3.5 w-3.5 shrink-0 text-muted-foreground/35 transition group-hover:text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </nav>

          {!selectedChapter ? (
            <section className="glass-panel panel-highlight flex min-h-[520px] items-center justify-center rounded-2xl p-8 text-center">
              <div>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-semibold">Select a chapter</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                  Choose a country from the left to edit the story that appears on
                  the live globe.
                </p>
              </div>
            </section>
          ) : (
            <section className="glass-panel panel-highlight rounded-2xl p-5 sm:p-6">
              <div className="mb-6 flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full shadow-[0_0_22px_currentColor]"
                    style={{
                      backgroundColor: selectedChapter.color,
                      color: selectedChapter.color,
                    }}
                  />
                  <div>
                    <h2 className="text-xl font-semibold">
                      {selectedChapter.countryName}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedChapter.city ?? "World Food Forum chapter"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {spotlights[selectedChapter.id]?.problem ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400" />
                      Story live
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-amber-300" />
                      Draft needed
                    </>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Ambassador name">
                  <Input
                    value={draft.ambassadorName}
                    maxLength={80}
                    className="admin-field h-10"
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
                    className="admin-field h-10"
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, ambassadorRole: e.target.value }))
                    }
                  />
                </Field>
              </div>

              <StorySection
                tone="rose"
                title="Challenge"
                description="Frame the problem with urgency and enough context for a global audience."
              >
                <div className="space-y-3">
                  <Input
                    value={draft.problemTitle}
                    maxLength={MAX_TITLE_LENGTH}
                    placeholder="Title"
                    className="admin-field h-10"
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, problemTitle: e.target.value }))
                    }
                  />
                  <Textarea
                    value={draft.problemDescription}
                    maxLength={MAX_DESCRIPTION_LENGTH}
                    rows={4}
                    placeholder="What is going wrong, and why?"
                    className="admin-field min-h-28"
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, problemDescription: e.target.value }))
                    }
                  />
                </div>
              </StorySection>

              <StorySection
                tone="emerald"
                title="Initiative"
                description="Describe what the chapter is doing and why it matters now."
              >
                <div className="space-y-3">
                  <Input
                    value={draft.solutionTitle}
                    maxLength={MAX_TITLE_LENGTH}
                    placeholder="Title"
                    className="admin-field h-10"
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, solutionTitle: e.target.value }))
                    }
                  />
                  <Textarea
                    value={draft.solutionDescription}
                    maxLength={MAX_DESCRIPTION_LENGTH}
                    rows={4}
                    placeholder="What are chapters doing about it?"
                    className="admin-field min-h-28"
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        solutionDescription: e.target.value,
                      }))
                    }
                  />
                </div>
              </StorySection>

              <StorySection
                tone="amber"
                title="Impact metrics"
                description={`Up to ${MAX_METRICS} headline figures. Leave a row blank to skip it.`}
              >
                <div className="space-y-2.5">
                  {draft.metrics.map((metric, i) => (
                    <div key={i} className="grid grid-cols-[110px_1fr] gap-2">
                      <Input
                        value={metric.value}
                        maxLength={MAX_METRIC_VALUE_LENGTH}
                        placeholder="33%"
                        className="admin-field h-10 text-center font-semibold"
                        onChange={(e) => updateMetric(i, { value: e.target.value })}
                      />
                      <Input
                        value={metric.label}
                        maxLength={MAX_METRIC_LABEL_LENGTH}
                        placeholder="of food wasted"
                        className="admin-field h-10"
                        onChange={(e) => updateMetric(i, { label: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </StorySection>

              {error && (
                <p className="mt-5 rounded-xl border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                <Button
                  onClick={handleSave}
                  disabled={!canSave || isSaving}
                  className="h-10 px-4"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isSaving ? "Saving…" : "Save story"}
                </Button>
                {savedAt && !isSaving && (
                  <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                    <Check className="h-4 w-4" />
                    Saved
                  </span>
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary to-amber-300 transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function StorySection({
  title,
  description,
  tone,
  children,
}: {
  title: string;
  description: string;
  tone: "rose" | "emerald" | "amber";
  children: ReactNode;
}) {
  const toneClass =
    tone === "rose"
      ? "text-rose-300 bg-rose-400/10 border-rose-300/15"
      : tone === "emerald"
        ? "text-emerald-300 bg-emerald-400/10 border-emerald-300/15"
        : "text-amber-300 bg-amber-400/10 border-amber-300/15";

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p
            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] uppercase ${toneClass}`}
          >
            {title}
          </p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}
