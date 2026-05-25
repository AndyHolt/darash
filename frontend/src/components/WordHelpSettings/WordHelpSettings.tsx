import { BookOpen } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
      <DropdownMenuRadioGroup
        value={settings.mode}
        onValueChange={(v) => setSettings({ ...settings, mode: v as WordHelpMode })}
      >
        <StickyRadioItem value="occurrences">Occurrences</StickyRadioItem>
        <StickyRadioItem value="rank">Rank</StickyRadioItem>
      </DropdownMenuRadioGroup>
    </>
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
  return (
    <>
      <DropdownMenuLabel>Show help for lemmas with</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={String(settings.occurrencesThreshold)}
        onValueChange={(v) =>
          setSettings({ ...settings, mode: "occurrences", occurrencesThreshold: Number(v) })
        }
      >
        {OCCURRENCE_PRESETS.map((n) => (
          <StickyRadioItem key={n} value={String(n)}>
            {formatOccurrencePreset(n)}
          </StickyRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </>
  );
}

function RankPresets() {
  const [settings, setSettings] = useWordHelpSettings();
  return (
    <>
      <DropdownMenuLabel>Show help for lemmas</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={String(settings.rankThreshold)}
        onValueChange={(v) => setSettings({ ...settings, mode: "rank", rankThreshold: Number(v) })}
      >
        {RANK_PRESETS.map((n) => (
          <StickyRadioItem key={n} value={String(n)}>
            {formatRankPreset(n)}
          </StickyRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </>
  );
}
