"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Pencil, X } from "lucide-react";
import { MASTER_SKILL_NAMES, searchMasterSkills } from "@/lib/shared/master-skills";

type SkillsInputProps = {
  id: string;
  name: string;
  label: string;
  hint?: string;
  values: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  suggestions?: readonly string[];
};

/**
 * Searchable chip/tag skills input with master-library autocomplete,
 * keyboard navigation, custom skills (Enter), remove, and inline edit.
 */
export function SkillsInput({
  id,
  name,
  label,
  hint,
  values,
  onChange,
  disabled,
  error,
  required,
  suggestions,
}: SkillsInputProps) {
  const listboxId = useId();
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [editingSkill, setEditingSkill] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const libraryMatches = useMemo(() => {
    const selected = new Set(values.map((v) => v.toLowerCase()));
    if (suggestions && suggestions.length > 0) {
      const q = draft.trim().toLowerCase();
      return (q ? suggestions.filter((s) => s.toLowerCase().includes(q)) : suggestions.slice(0, 12))
        .filter((skill) => !selected.has(skill.toLowerCase()))
        .slice(0, 12)
        .map((skill) => ({ name: skill, category: "Suggested" as const }));
    }
    return searchMasterSkills(draft, 12).filter(
      (skill) => !selected.has(skill.name.toLowerCase())
    );
  }, [draft, suggestions, values]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function addSkill(raw: string) {
    const skill = raw.trim().replace(/^•\s*/, "");
    if (!skill) return;
    if (values.some((v) => v.toLowerCase() === skill.toLowerCase())) {
      setDraft("");
      setOpen(false);
      return;
    }
    onChange([...values, skill]);
    setDraft("");
    setActiveIndex(0);
    setOpen(false);
    inputRef.current?.focus();
  }

  function removeSkill(skill: string) {
    onChange(values.filter((v) => v !== skill));
  }

  function commitEdit() {
    if (!editingSkill) return;
    const next = editDraft.trim();
    if (!next) {
      setEditingSkill(null);
      return;
    }
    const duplicate = values.some(
      (v) => v !== editingSkill && v.toLowerCase() === next.toLowerCase()
    );
    if (duplicate) {
      setEditingSkill(null);
      return;
    }
    onChange(values.map((v) => (v === editingSkill ? next : v)));
    setEditingSkill(null);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) =>
        libraryMatches.length === 0 ? 0 : Math.min(index + 1, libraryMatches.length - 1)
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      if (open && libraryMatches[activeIndex]) {
        addSkill(libraryMatches[activeIndex]!.name);
        return;
      }
      addSkill(draft);
      return;
    }
    if (event.key === "Backspace" && !draft && values.length > 0) {
      removeSkill(values[values.length - 1]!);
    }
  }

  return (
    <div className="space-y-2" ref={rootRef}>
      <label htmlFor={id} className="block text-sm font-medium text-zinc-200">
        {label}
        {required ? <span className="text-red-500"> *</span> : (
          <span className="font-normal text-zinc-400"> (optional)</span>
        )}
      </label>
      {hint ? <p className="text-xs text-zinc-400">{hint}</p> : null}

      <div
        className={`relative min-h-11 rounded-lg border bg-white/[0.04] px-2 py-2 ${
          error
            ? "border-red-400/50"
            : "border-white/10"
        }`}
      >
        <div className="flex flex-wrap gap-2">
          {values.map((skill) =>
            editingSkill === skill ? (
              <span
                key={skill}
                className="inline-flex items-center gap-1 rounded-full border border-violet-400/30 bg-violet-500/15 px-2 py-1"
              >
                <input
                  value={editDraft}
                  disabled={disabled}
                  autoFocus
                  onChange={(event) => setEditDraft(event.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      commitEdit();
                    }
                    if (event.key === "Escape") {
                      setEditingSkill(null);
                    }
                  }}
                  className="w-28 border-0 bg-transparent px-1 text-xs font-medium text-violet-200 outline-none"
                  aria-label={`Edit skill ${skill}`}
                />
              </span>
            ) : (
              <span
                key={skill}
                className="inline-flex items-center gap-1 rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-200"
              >
                {skill}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setEditingSkill(skill);
                    setEditDraft(skill);
                  }}
                  className="rounded-full p-0.5 hover:bg-violet-500/20"
                  aria-label={`Edit ${skill}`}
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeSkill(skill)}
                  className="rounded-full p-0.5 hover:bg-violet-500/20"
                  aria-label={`Remove ${skill}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )
          )}
          <input
            ref={inputRef}
            id={id}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            value={draft}
            disabled={disabled}
            placeholder={
              values.length ? "Search or type another skill…" : "Search skills or press Enter to add"
            }
            onChange={(event) => {
              setDraft(event.target.value);
              setOpen(true);
              setActiveIndex(0);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            className="min-w-[12rem] flex-1 border-0 bg-transparent px-1 py-1 text-sm text-white outline-none placeholder:text-zinc-500"
            autoComplete="off"
          />
        </div>

        {open && libraryMatches.length > 0 ? (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-20 max-h-56 overflow-y-auto rounded-lg border border-white/10 bg-[#0a0a12]/95 py-1 shadow-lg backdrop-blur-2xl"
          >
            {libraryMatches.map((skill, index) => (
              <li key={`${skill.category}-${skill.name}`} role="option" aria-selected={index === activeIndex}>
                <button
                  type="button"
                  disabled={disabled}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                    index === activeIndex
                      ? "bg-violet-500/15 text-violet-200"
                      : "text-zinc-200 hover:bg-white/[0.06]"
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => addSkill(skill.name)}
                >
                  <span className="font-medium">{skill.name}</span>
                  <span className="text-[10px] uppercase tracking-wide text-zinc-400">
                    {skill.category}
                  </span>
                </button>
              </li>
            ))}
            {draft.trim() &&
            !libraryMatches.some((s) => s.name.toLowerCase() === draft.trim().toLowerCase()) &&
            !values.some((v) => v.toLowerCase() === draft.trim().toLowerCase()) ? (
              <li className="border-t border-white/10">
                <button
                  type="button"
                  disabled={disabled}
                  className="flex w-full px-3 py-2 text-left text-sm text-zinc-200 hover:bg-white/[0.06]"
                  onClick={() => addSkill(draft)}
                >
                  Add custom skill “{draft.trim()}”
                </button>
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>

      {/* Always sync latest chips into FormData for the parent <form>. */}
      <input type="hidden" name={name} value={values.join("|||")} readOnly />

      <p className="text-[11px] text-zinc-400">
        {MASTER_SKILL_NAMES.length}+ skills in library · ↑/↓ to navigate · Enter to add · click pencil to
        edit
      </p>

      {error ? (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
