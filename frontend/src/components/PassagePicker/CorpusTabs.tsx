import { CORPUS_LIST, type CorpusId } from "@/bible/corpora";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export interface CorpusTabsProps {
  value: CorpusId;
  onChange: (id: CorpusId) => void;
}

// The picker's top-level choice: which corpus (text-family) to browse. Sits
// above the book grid at the book step; switching it swaps the book list and
// the destination route. A segmented single-select — never empty, so the guard
// ignores Radix's deselect-to-"" event.
export function CorpusTabs({ value, onChange }: CorpusTabsProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next as CorpusId);
      }}
      variant="outline"
      spacing={0}
      className="mb-2 w-full"
    >
      {CORPUS_LIST.map((corpus) => (
        <ToggleGroupItem key={corpus.id} value={corpus.id} className="flex-1">
          {corpus.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
