import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";

export const Drawer = DrawerPrimitive.Root;

export function DrawerOverlay({ className, ...props }) {
  return <DrawerPrimitive.Overlay className={cn("fixed inset-0 z-50 bg-black/60 backdrop-blur-sm", className)} {...props} />;
}

export function DrawerContent({ className, children, ...props }) {
  return (
    <DrawerPrimitive.Portal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        className={cn("fixed inset-x-0 bottom-0 z-50 mt-24 rounded-t-[1.5rem] border border-border bg-card p-4 shadow-xl", className)}
        {...props}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPrimitive.Portal>
  );
}

export function DrawerHeader({ className, ...props }) {
  return <div className={cn("mb-4 space-y-1", className)} {...props} />;
}

export function DrawerTitle({ className, ...props }) {
  return <DrawerPrimitive.Title className={cn("text-lg font-semibold", className)} {...props} />;
}

export function DrawerDescription({ className, ...props }) {
  return <DrawerPrimitive.Description className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
