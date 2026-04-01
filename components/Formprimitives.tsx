"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface SectionHeaderProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}

export function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: SectionHeaderProps) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-primary" aria-hidden />
        </div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      </div>
      <p className="text-sm text-slate-500 ml-10">{subtitle}</p>
    </div>
  );
}

// ─── CounterField ─────────────────────────────────────────────────────────────

interface CounterFieldProps {
  label: string;
  labelNp?: string;
  description?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  icon?: React.ElementType;
}

export function CounterField({
  label,
  labelNp,
  description,
  value,
  onChange,
  min = 0,
  max = 100,
  icon: Icon,
}: CounterFieldProps) {
  return (
    <div className="flex items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" aria-hidden />
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {label}
          </p>
          {labelNp && (
            <p className="text-xs text-slate-400 truncate">{labelNp}</p>
          )}
          {description && (
            <p className="text-xs text-slate-500 mt-0.5 leading-tight">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
        >
          <span className="text-lg font-light leading-none select-none">−</span>
        </button>
        <span className="w-10 text-center text-lg font-bold text-slate-900 tabular-nums select-none">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-green-50 hover:border-green-300 hover:text-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

// ─── TriToggle ────────────────────────────────────────────────────────────────

interface TriToggleProps {
  label: string;
  labelNp?: string;
  icon?: React.ElementType;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
}

const TRI_OPTIONS: {
  v: boolean | null;
  label: string;
  labelNp: string;
  activeClass: string;
}[] = [
  {
    v: true,
    label: "Yes",
    labelNp: "हो",
    activeClass: "bg-green-500 text-white border-green-500",
  },
  {
    v: false,
    label: "No",
    labelNp: "होइन",
    activeClass: "bg-red-500 text-white border-red-500",
  },
  {
    v: null,
    label: "N/A",
    labelNp: "थाहा",
    activeClass: "bg-slate-400 text-white border-slate-400",
  },
];

export function TriToggle({
  label,
  labelNp,
  icon: Icon,
  value,
  onChange,
}: TriToggleProps) {
  return (
    <div className="flex items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex items-center gap-2 min-w-0">
        {Icon && (
          <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" aria-hidden />
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          {labelNp && <p className="text-xs text-slate-400">{labelNp}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {TRI_OPTIONS.map((opt) => (
          <button
            key={String(opt.v)}
            type="button"
            onClick={() => onChange(opt.v)}
            className={cn(
              "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border",
              value === opt.v
                ? opt.activeClass
                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100",
            )}
          >
            <span className="hidden sm:inline">{opt.label}</span>
            <span className="sm:hidden">{opt.labelNp}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── NumericInputField ────────────────────────────────────────────────────────
// Fixes the NaN bug: value is stored as number | undefined, displayed as string.
// Empty input → undefined (triggers "required" Zod error with a clean message).
// Clearing works fully — no NaN, no stale first digit.

interface NumericInputFieldProps {
  label: string;
  labelNp?: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  prefix?: string;
  suffix?: string;
  min?: number;
  step?: number;
  value: number | undefined | null;
  onChange: (v: number | undefined | null) => void;
  /** Pass null to disable null (i.e. treat empty as undefined). Default: undefined */
  emptyValue?: undefined | null;
  icon?: React.ElementType;
  className?: string;
}

export function NumericInputField({
  label,
  labelNp,
  placeholder,
  description,
  required,
  prefix,
  suffix,
  min,
  step,
  value,
  onChange,
  emptyValue = undefined,
  icon: Icon,
  className,
}: NumericInputFieldProps) {
  const displayValue =
    value === undefined || value === null || value === 0 ? "" : String(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "" || raw === null) {
      onChange(emptyValue as any);
      return;
    }
    const parsed = Number(raw);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  return (
    <FormItem className={className}>
      <FormLabel className="text-slate-700 font-semibold">
        {label}
        {labelNp && (
          <span className="text-slate-400 font-normal ml-1 text-xs">
            / {labelNp}
          </span>
        )}
        {required && (
          <span className="text-red-500 ml-1" aria-hidden>
            *
          </span>
        )}
      </FormLabel>
      <FormControl>
        <div className="relative">
          {Icon && (
            <Icon
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
              aria-hidden
            />
          )}
          {prefix && (
            <span
              className={cn(
                "absolute top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none select-none",
                Icon ? "left-9" : "left-3.5",
              )}
              aria-hidden
            >
              {prefix}
            </span>
          )}
          <Input
            type="number"
            inputMode="numeric"
            placeholder={placeholder}
            min={min}
            step={step}
            value={displayValue}
            onChange={handleChange}
            className={cn(
              "h-12 rounded-xl border-slate-200 focus:border-primary transition-colors",
              Icon && !prefix && "pl-10",
              Icon && prefix && "pl-14",
              !Icon && prefix && "pl-9",
              suffix && "pr-16",
            )}
          />
          {suffix && (
            <span
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none select-none"
              aria-hidden
            >
              {suffix}
            </span>
          )}
        </div>
      </FormControl>
      {description && (
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      )}
      <FormMessage />
    </FormItem>
  );
}
