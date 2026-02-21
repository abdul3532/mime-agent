import { useEffect, useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandSeparator,
} from "@/components/ui/command";
import { Package, SlidersHorizontal, Lightbulb } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchCommand({ open, onOpenChange }: Props) {
  const { products, rules, setActiveTab } = useDashboard();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const filteredProducts = products
    .filter((p) => p.title.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 8);

  const filteredRules = rules
    .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search products, rules..." value={search} onValueChange={setSearch} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {filteredProducts.length > 0 && (
          <CommandGroup heading="Products">
            {filteredProducts.map((p) => (
              <CommandItem
                key={p.id}
                onSelect={() => {
                  setActiveTab("products");
                  onOpenChange(false);
                }}
              >
                <Package className="mr-2 h-4 w-4" />
                <span>{p.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">€{p.price}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredRules.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Rules">
              {filteredRules.map((r) => (
                <CommandItem
                  key={r.id}
                  onSelect={() => {
                    setActiveTab("rules");
                    onOpenChange(false);
                  }}
                >
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  <span>{r.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
