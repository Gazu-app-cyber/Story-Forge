import { Button } from "@/components/ui/button";

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      {Icon ? (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Icon className="h-7 w-7 text-muted-foreground" />
        </div>
      ) : null}
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      {description ? <p className="mb-5 max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {actionLabel && onAction ? <Button onClick={onAction}>{actionLabel}</Button> : null}
    </div>
  );
}
