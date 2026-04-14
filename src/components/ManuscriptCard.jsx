import moment from "moment";
import "moment/locale/pt-br";
import { Link } from "react-router-dom";
import { Copy, MoreVertical, Pencil, Star, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { getTypeColor, getTypeIcon } from "@/lib/manuscriptTypes";
import { cn } from "@/lib/utils";

moment.locale("pt-br");

export default function ManuscriptCard({ manuscript, onToggleFavorite, onDelete, onEdit, onDuplicate }) {
  const TypeIcon = getTypeIcon(manuscript.type);
  const typeColor = getTypeColor(manuscript.type);
  const preview = manuscript.content ? manuscript.content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 110) : "";
  const hasActions = onEdit || onDuplicate || onDelete || onToggleFavorite;

  return (
    <Link to={`/manuscript/${manuscript.id}`} className="group block h-full">
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        {manuscript.image ? (
          <div className="relative w-full overflow-hidden bg-muted" style={{ aspectRatio: "16/7" }}>
            <img
              src={manuscript.image}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(event) => {
                event.currentTarget.parentElement.style.display = "none";
              }}
            />
          </div>
        ) : null}

        <div className="flex flex-1 flex-col gap-2.5 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide", typeColor)}>
              <TypeIcon className="h-3 w-3 shrink-0" />
              <span>{manuscript.type}</span>
            </span>

            {hasActions ? (
              <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                {onToggleFavorite ? (
                  <button
                    className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-muted"
                    onClick={(event) => {
                      event.preventDefault();
                      onToggleFavorite(manuscript);
                    }}
                  >
                    <Star className={cn("h-3.5 w-3.5", manuscript.is_favorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                  </button>
                ) : null}

                {onEdit || onDuplicate || onDelete ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-muted"
                        onClick={(event) => event.preventDefault()}
                      >
                        <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44" onClick={(event) => event.preventDefault()}>
                      {onEdit ? (
                        <DropdownMenuItem onClick={() => onEdit(manuscript)}>
                          <Pencil className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                          Editar
                        </DropdownMenuItem>
                      ) : null}
                      {onDuplicate ? (
                        <DropdownMenuItem onClick={() => onDuplicate(manuscript)}>
                          <Copy className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                          Duplicar
                        </DropdownMenuItem>
                      ) : null}
                      {onDelete ? (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(manuscript)}>
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Excluir
                          </DropdownMenuItem>
                        </>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>
            ) : null}
          </div>

          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-card-foreground transition-colors group-hover:text-primary">
            {manuscript.name}
          </h3>

          {preview ? <p className="line-clamp-3 flex-1 text-[13px] leading-relaxed text-muted-foreground">{preview}</p> : null}

          <div className="mt-auto flex items-center justify-between pt-1">
            <span className="text-[11px] text-muted-foreground">{moment(manuscript.updated_date).fromNow()}</span>
            {manuscript.is_favorite ? <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
