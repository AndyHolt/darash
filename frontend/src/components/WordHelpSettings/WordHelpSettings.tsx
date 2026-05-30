import { BookOpen } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  formatOccurrencePreset,
  formatRankPreset,
  OCCURRENCE_PRESETS,
  RANK_PRESETS,
  useWordHelpSettings,
  type WordHelpMode,
} from "./state";

// Wrap radio items with onSelect preventDefault so menu stays open on select
function StickyRadioItem(props: ComponentProps<typeof DropdownMenuRadioItem>) {
  return (
    <DropdownMenuRadioItem
      {...props}
      onSelect={(e) => {
        e.preventDefault();
        props.onSelect?.(e);
      }}
    />
  );
}

export function WordHelpSettings() {
  const [settings] = useWordHelpSettings();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Word help settings">
          <BookOpen className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <ModeSelector />
        <DropdownMenuSeparator />
        <ThresholdSubmenu mode={settings.mode} />
        <DropdownMenuSeparator />
        <FrequencyStatsToggle />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// All helpers below are defined at module scope (not inside WordHelpSettings)
// so React preserves their component identity across renders. Each calls
// useWordHelpSettings directly — the shared useSyncExternalStore-backed store
// makes that cheaper than threading value/onChange props through every helper.

function ModeSelector() {
  const [settings, setSettings] = useWordHelpSettings();
  return (
    <>
      <DropdownMenuLabel>Show help by</DropdownMenuLabel>
      <div className="px-1.5 py-1">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          spacing={0}
          value={settings.mode}
          // Radix allows deselecting the current item, which would leave us
          // with an empty value. Ignore that — there is always an active mode.
          onValueChange={(v) => {
            if (v) setSettings({ ...settings, mode: v as WordHelpMode });
          }}
          className="w-full"
        >
          <ToggleGroupItem value="occurrences" className="flex-1">
            Word count
          </ToggleGroupItem>
          <ToggleGroupItem value="rank" className="flex-1">
            Vocab rank
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </>
  );
}

function FrequencyStatsToggle() {
  const [settings, setSettings] = useWordHelpSettings();
  return (
    <DropdownMenuCheckboxItem
      checked={settings.showFrequencyStats}
      onCheckedChange={(checked) => setSettings({ ...settings, showFrequencyStats: checked })}
      onSelect={(e) => e.preventDefault()}
    >
      Show frequency stats
    </DropdownMenuCheckboxItem>
  );
}

function ThresholdSubmenu({ mode }: { mode: WordHelpMode }) {
  switch (mode) {
    case "occurrences":
      return <OccurrencesPresets />;
    case "rank":
      return <RankPresets />;
    default: {
      const _exhaustive: never = mode;
      throw new Error(`Unhandled WordHelpMode: ${_exhaustive}`);
    }
  }
}

function OccurrencesPresets() {
  const [settings, setSettings] = useWordHelpSettings();
  const { occurrencesIsCustom: isCustom, occurrencesThreshold: t } = settings;

  return (
    <>
      <DropdownMenuLabel>Show help for lemmas with</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        // When in custom mode, the "custom" sentinel keeps that radio selected
        // regardless of how the typed value relates to the preset list.
        value={isCustom ? "custom" : String(t)}
        onValueChange={(v) => {
          if (v === "custom") {
            setSettings({ ...settings, mode: "occurrences", occurrencesIsCustom: true });
          } else {
            setSettings({
              ...settings,
              mode: "occurrences",
              occurrencesThreshold: Number(v),
              occurrencesIsCustom: false,
            });
          }
        }}
      >
        {OCCURRENCE_PRESETS.map((n) => (
          <StickyRadioItem key={n} value={String(n)}>
            {formatOccurrencePreset(n)}
          </StickyRadioItem>
        ))}
        <StickyRadioItem value="custom">Custom…</StickyRadioItem>
      </DropdownMenuRadioGroup>
      {isCustom && (
        <CustomThresholdRow
          prefix="≤"
          suffix="occurrences"
          // Infinity ("All words" preset) can't be rendered in a number input;
          // fall back to empty so the placeholder shows.
          value={Number.isFinite(t) ? t : ""}
          onChange={(n) =>
            setSettings({
              ...settings,
              mode: "occurrences",
              occurrencesThreshold: n,
              occurrencesIsCustom: true,
            })
          }
        />
      )}
    </>
  );
}

function RankPresets() {
  const [settings, setSettings] = useWordHelpSettings();
  const { rankIsCustom: isCustom, rankThreshold: t } = settings;

  return (
    <>
      <DropdownMenuLabel>Show help for lemmas</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={isCustom ? "custom" : String(t)}
        onValueChange={(v) => {
          if (v === "custom") {
            setSettings({ ...settings, mode: "rank", rankIsCustom: true });
          } else {
            setSettings({
              ...settings,
              mode: "rank",
              rankThreshold: Number(v),
              rankIsCustom: false,
            });
          }
        }}
      >
        {RANK_PRESETS.map((n) => (
          <StickyRadioItem key={n} value={String(n)}>
            {formatRankPreset(n)}
          </StickyRadioItem>
        ))}
        <StickyRadioItem value="custom">Custom…</StickyRadioItem>
      </DropdownMenuRadioGroup>
      {isCustom && (
        <CustomThresholdRow
          prefix="Outside top"
          // 0 ("All words" preset) renders as an empty input rather than literal 0.
          value={t > 0 ? t : ""}
          onChange={(n) =>
            setSettings({
              ...settings,
              mode: "rank",
              rankThreshold: n,
              rankIsCustom: true,
            })
          }
        />
      )}
    </>
  );
}

// Custom-value row shown beneath the radio group when "Custom…" is selected.
// Kept in the same visual idiom as the preset radios so the format stays
// consistent (e.g. "≤ [N] occurrences"). Committed live on each keystroke,
// matching the radios' instant-apply behavior. A bare <input> is used in
// place of a wrapped UI primitive since adding a shadcn Input component just
// for this one use isn't worth it.
function CustomThresholdRow({
  prefix,
  suffix,
  value,
  onChange,
}: {
  prefix: string;
  suffix?: string;
  value: number | "";
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm">
      <span>{prefix}</span>
      <input
        type="number"
        min={1}
        step={1}
        value={value}
        placeholder="N"
        // Stop keystrokes from reaching Radix's DropdownMenu, which would
        // otherwise treat single characters as typeahead for menu items.
        onKeyDown={(e) => e.stopPropagation()}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") return;
          const n = Number(raw);
          if (Number.isFinite(n) && n >= 1) onChange(n);
        }}
        className="w-16 rounded border border-input bg-background px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
      {suffix && <span>{suffix}</span>}
    </div>
  );
}
