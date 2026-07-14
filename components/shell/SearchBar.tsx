"use client";

import { useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useSignalMapStore } from "@/lib/store/signal-map-store";
import { SIGNAL_TYPE_META } from "@/lib/types";

export function SearchBar() {
  const searchOpen = useSignalMapStore((s) => s.searchOpen);
  const setSearchOpen = useSignalMapStore((s) => s.setSearchOpen);
  const chapters = useSignalMapStore((s) => s.chapters);
  const signals = useSignalMapStore((s) => s.signals);
  const selectChapter = useSignalMapStore((s) => s.selectChapter);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && !searchOpen) {
        const target = e.target as HTMLElement | null;
        if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [searchOpen, setSearchOpen]);

  return (
    <CommandDialog
      open={searchOpen}
      onOpenChange={setSearchOpen}
      title="Search Signal Map"
      description="Search chapters and signals"
    >
      <CommandInput placeholder="Search chapters, signals, food systems..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Chapters">
          {chapters.map((chapter) => (
            <CommandItem
              key={chapter.id}
              value={`${chapter.countryName} ${chapter.city ?? ""}`}
              onSelect={() => {
                selectChapter(chapter.id);
                setSearchOpen(false);
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: chapter.color }}
              />
              {chapter.countryName}
              <span className="ml-auto text-xs text-muted-foreground">
                {chapter.memberCount} members
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Recent Signals">
          {signals.slice(0, 20).map((signal) => (
            <CommandItem
              key={signal.id}
              value={`${signal.title} ${signal.description}`}
              onSelect={() => {
                selectChapter(signal.chapterId);
                setSearchOpen(false);
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: SIGNAL_TYPE_META[signal.type].color }}
              />
              {signal.title}
              <span className="ml-auto text-xs text-muted-foreground">
                {signal.chapter?.countryName}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
