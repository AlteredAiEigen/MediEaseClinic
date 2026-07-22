import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, ChevronDown } from "lucide-react";
import { usePrescriptionCatalogSearch } from "@/hooks/use-prescription-catalog-search";
import { MEDICINE_TYPES, TIMING_PRESETS } from "@/lib/prescription-catalog";
import type { PrescriptionCatalogItem } from "@/lib/prescription-catalog";

export interface MedicineEntry {
  id: string;
  name: string;
  type: string;
  composition: string;
  dosageMorning: number;
  dosageAfternoon: number;
  dosageNight: number;
  timingFreqDuration: string;
  quantity: number;
}

interface MedicineRowProps {
  index: number;
  medicine: MedicineEntry;
  onChange: (id: string, field: keyof MedicineEntry, value: string | number) => void;
  onRemove: (id: string) => void;
  language: "en" | "hi";
  readOnly?: boolean;
}

export function PrescriptionMedicineRow({
  index,
  medicine,
  onChange,
  onRemove,
  language,
  readOnly = false,
}: MedicineRowProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showTimingPresets, setShowTimingPresets] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [suggestionRect, setSuggestionRect] = useState({ left: 0, top: 0, width: 0 });
  const [timingRect, setTimingRect] = useState({ left: 0, top: 0, width: 0 });
  const nameWrapRef = useRef<HTMLDivElement>(null);
  const timingWrapRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const { items: suggestions, loading } = usePrescriptionCatalogSearch(medicine.name, {
    types: [medicine.type],
    limit: 25,
    enabled: showSuggestions,
  });

  const updateSuggestionPosition = () => {
    const rect = nameInputRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSuggestionRect({ left: rect.left, top: rect.bottom + 4, width: rect.width });
  };

  const updateTimingPosition = () => {
    const rect = timingWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTimingRect({ left: rect.left, top: rect.bottom + 4, width: Math.max(rect.width, 260) });
  };

  const openSuggestions = () => {
    updateSuggestionPosition();
    setShowSuggestions(true);
  };

  const openTimingPresets = () => {
    updateTimingPosition();
    setShowTimingPresets(true);
  };

  useEffect(() => {
    if (!showSuggestions) return;
    updateSuggestionPosition();
    window.addEventListener("resize", updateSuggestionPosition);
    window.addEventListener("scroll", updateSuggestionPosition, true);
    return () => {
      window.removeEventListener("resize", updateSuggestionPosition);
      window.removeEventListener("scroll", updateSuggestionPosition, true);
    };
  }, [showSuggestions, medicine.name, suggestions.length]);

  useEffect(() => {
    if (!showTimingPresets) return;
    updateTimingPosition();
    window.addEventListener("resize", updateTimingPosition);
    window.addEventListener("scroll", updateTimingPosition, true);
    return () => {
      window.removeEventListener("resize", updateTimingPosition);
      window.removeEventListener("scroll", updateTimingPosition, true);
    };
  }, [showTimingPresets, medicine.timingFreqDuration]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (nameWrapRef.current && !nameWrapRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (timingWrapRef.current && !timingWrapRef.current.contains(e.target as Node)) {
        setShowTimingPresets(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setHighlight(0);
  }, [medicine.name, suggestions.length]);

  const selectMedicine = (med: PrescriptionCatalogItem) => {
    onChange(medicine.id, "name", med.name);
    onChange(medicine.id, "type", med.type);
    onChange(medicine.id, "composition", med.composition || "");
    setShowSuggestions(false);
  };

  const handleTypeChange = (nextType: string) => {
    onChange(medicine.id, "type", nextType);
    onChange(medicine.id, "name", "");
    onChange(medicine.id, "composition", "");
    openSuggestions();
    requestAnimationFrame(() => nameInputRef.current?.focus());
  };

  const presets = TIMING_PRESETS[language];
  const timingQuery = medicine.timingFreqDuration.trim().toLowerCase();
  const filteredPresets =
    timingQuery.length === 0
      ? presets
      : presets.filter((p) => p.toLowerCase().includes(timingQuery));

  return (
    <tr className="border-b border-border hover:bg-accent/30 transition-colors group align-top">
      <td className="p-2 text-center text-xs text-muted-foreground font-mono w-8 align-top">
        {index + 1}
      </td>
      <td className="p-2 align-top">
        <div className="flex gap-1 items-start">
          <select
            value={medicine.type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="h-8 w-20 rounded border border-input bg-background px-1 text-xs focus:ring-1 focus:ring-ring"
            aria-label="Medicine type"
            disabled={readOnly}
          >
            {MEDICINE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <div className="relative flex-1" ref={nameWrapRef}>
            <Input
              ref={nameInputRef}
              value={medicine.name}
              onChange={(e) => {
                onChange(medicine.id, "name", e.target.value);
                openSuggestions();
              }}
              onFocus={openSuggestions}
              onKeyDown={(e) => {
                if (!showSuggestions || suggestions.length === 0) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHighlight((h) => (h + 1) % suggestions.length);
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
                } else if (e.key === "Enter" && suggestions[highlight]) {
                  e.preventDefault();
                  selectMedicine(suggestions[highlight]);
                } else if (e.key === "Escape") {
                  setShowSuggestions(false);
                }
              }}
              placeholder="Select or type medicine…"
              className="h-8 text-xs font-medium pr-7 w-full"
              autoComplete="off"
              readOnly={readOnly}
              disabled={readOnly}
            />
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                if (showSuggestions) {
                  setShowSuggestions(false);
                } else {
                  openSuggestions();
                }
              }}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
              aria-label="Toggle medicine suggestions"
              disabled={readOnly}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {showSuggestions &&
              createPortal(
                <div
                  className="fixed z-[10001] bg-popover border border-border rounded-md shadow-lg max-h-56 overflow-auto"
                  style={{
                    left: suggestionRect.left,
                    top: suggestionRect.top,
                    width: suggestionRect.width,
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {loading ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground">Searching…</div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((s, i) => (
                      <button
                        key={s.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={() => selectMedicine(s)}
                        className={`w-full text-left px-3 py-2 text-xs border-b border-border last:border-0 ${
                          i === highlight ? "bg-accent" : "hover:bg-accent"
                        }`}
                      >
                        <span className="font-medium">
                          {s.type}. {s.name}
                        </span>
                        {s.composition && (
                          <span className="block text-muted-foreground text-[10px]">
                            {s.composition}
                          </span>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      No matching medicine
                    </div>
                  )}
                </div>,
                document.body,
              )}
            <Input
              value={medicine.composition}
              onChange={(e) => onChange(medicine.id, "composition", e.target.value)}
              placeholder="Composition"
              className="h-6 text-[10px] text-muted-foreground mt-1 border-dashed"
              readOnly={readOnly}
              disabled={readOnly}
            />
          </div>
        </div>
      </td>
      <td className="p-2 align-top">
        <div className="flex gap-0.5 items-center justify-center pt-1">
          <Input
            type="number"
            min={0}
            value={medicine.dosageMorning}
            onChange={(e) =>
              onChange(medicine.id, "dosageMorning", parseInt(e.target.value) || 0)
            }
            className="h-8 w-10 text-xs text-center p-0"
            readOnly={readOnly}
            disabled={readOnly}
          />
          <span className="text-muted-foreground text-xs">-</span>
          <Input
            type="number"
            min={0}
            value={medicine.dosageAfternoon}
            onChange={(e) =>
              onChange(medicine.id, "dosageAfternoon", parseInt(e.target.value) || 0)
            }
            className="h-8 w-10 text-xs text-center p-0"
            readOnly={readOnly}
            disabled={readOnly}
          />
          <span className="text-muted-foreground text-xs">-</span>
          <Input
            type="number"
            min={0}
            value={medicine.dosageNight}
            onChange={(e) =>
              onChange(medicine.id, "dosageNight", parseInt(e.target.value) || 0)
            }
            className="h-8 w-10 text-xs text-center p-0"
            readOnly={readOnly}
            disabled={readOnly}
          />
        </div>
      </td>
      <td className="p-2 align-top">
        <div className="relative" ref={timingWrapRef}>
          <Input
            value={medicine.timingFreqDuration}
            onChange={(e) => {
              onChange(medicine.id, "timingFreqDuration", e.target.value);
              openTimingPresets();
            }}
            onFocus={openTimingPresets}
            onKeyDown={(e) => {
              if (e.key === "Tab" || e.key === "Escape") setShowTimingPresets(false);
            }}
            placeholder={
              language === "hi"
                ? "खाने से पहले - रोज़ - 60 दिन"
                : "Before food - Daily - 60 days"
            }
            className="h-8 text-xs"
            autoComplete="off"
            readOnly={readOnly}
            disabled={readOnly}
          />
          {showTimingPresets &&
            createPortal(
              <div
                className="fixed z-[10001] bg-popover border border-border rounded-md shadow-lg max-h-56 overflow-auto"
                style={{
                  left: timingRect.left,
                  top: timingRect.top,
                  width: timingRect.width,
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {filteredPresets.length > 0 ? (
                  filteredPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={() => {
                        onChange(medicine.id, "timingFreqDuration", preset);
                        setShowTimingPresets(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-accent text-xs border-b border-border last:border-0"
                    >
                      {preset}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    Keep typing — free text allowed
                  </div>
                )}
              </div>,
              document.body,
            )}
        </div>
      </td>
      <td className="p-2 align-top">
        <Input
          type="number"
          min={0}
          value={medicine.quantity}
          onChange={(e) => onChange(medicine.id, "quantity", parseInt(e.target.value) || 0)}
          className="h-8 w-16 text-xs text-center"
          readOnly={readOnly}
          disabled={readOnly}
        />
      </td>
      <td className="p-2 w-8 align-top">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(medicine.id)}
          disabled={readOnly}
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
        >
          <X className="h-3 w-3" />
        </Button>
      </td>
    </tr>
  );
}
