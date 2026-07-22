import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { usePrescriptionCatalogSearch } from "@/hooks/use-prescription-catalog-search";
import type { PrescriptionCatalogItem, PrescriptionItemCategory } from "@/lib/prescription-catalog";

type PrescriptionItemAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: PrescriptionCatalogItem) => void;
  placeholder?: string;
  categories?: PrescriptionItemCategory[];
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

const categoryToTypes: Record<PrescriptionItemCategory, string[]> = {
  Medicine: ["TAB", "CAP", "SYR", "DROP", "OINT", "OTHER"],
  Injection: ["INJ"],
  Test: ["TEST"],
};

export function PrescriptionItemAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Type medicine, injection, or test…",
  categories,
  className,
  onKeyDown,
}: PrescriptionItemAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const types = categories?.length
    ? categories.flatMap((c) => categoryToTypes[c])
    : undefined;

  const { items: suggestions } = usePrescriptionCatalogSearch(value, {
    types,
    limit: 8,
    enabled: open,
  });

  useEffect(() => {
    setHighlight(0);
  }, [value, suggestions.length]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pick = (item: PrescriptionCatalogItem) => {
    onSelect(item);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <Input
        value={value}
        placeholder={placeholder}
        className={className}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (open && suggestions.length > 0) {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => (h + 1) % suggestions.length);
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
              return;
            }
            if (e.key === "Enter" && suggestions[highlight]) {
              e.preventDefault();
              pick(suggestions[highlight]);
              return;
            }
            if (e.key === "Escape") {
              setOpen(false);
              return;
            }
          }
          onKeyDown?.(e);
        }}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-52 overflow-auto rounded-md border border-border bg-popover shadow-lg">
          {suggestions.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(item)}
              className={`w-full text-left px-3 py-2 text-sm border-b border-border last:border-0 ${
                i === highlight ? "bg-accent" : "hover:bg-accent/70"
              }`}
            >
              <span className="font-medium">
                <span className="text-[10px] uppercase text-muted-foreground mr-1.5">
                  {item.type}
                </span>
                {item.name}
              </span>
              {item.composition && (
                <span className="block text-xs text-muted-foreground">{item.composition}</span>
              )}
              {item.dosage && item.category !== "Test" && (
                <span className="block text-[11px] text-muted-foreground/80">
                  {item.dosage} · {item.frequency} · {item.duration}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
