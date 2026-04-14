import { useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function AdaptiveSelect({
  value,
  onValueChange,
  options,
  placeholder,
  triggerClassName,
  title = "Selecionar",
  description
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const selectedLabel = useMemo(() => options.find((option) => option.value === value)?.label, [options, value]);

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <>
      <button
        type="button"
        className={cn("flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm", triggerClassName)}
        onClick={() => setOpen(true)}
      >
        <span className={selectedLabel ? "text-foreground" : "text-muted-foreground"}>{selectedLabel || placeholder}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="mobile-bottom-safe">
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            {description ? <DrawerDescription>{description}</DrawerDescription> : null}
          </DrawerHeader>
          <div className="space-y-2 pb-2">
            {options.map((option) => {
              const active = option.value === value;
              return (
                <Button
                  key={option.value}
                  type="button"
                  variant={active ? "default" : "outline"}
                  className="w-full justify-between"
                  onClick={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                  {active ? <Check className="h-4 w-4" /> : null}
                </Button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
