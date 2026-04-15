import moment from "moment";
import "moment/locale/pt-br";
import { Link } from "react-router-dom";
import { BookOpen, FolderInput, FolderOutput, MoreVertical, Pencil, Star, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

moment.locale("pt-br");

export default function ProjectCard({ project, viewMode = "grid", onToggleFavorite, onDelete, onEdit, onMove, folders = [] }) {
  const initial = (project.name || "P")[0].toUpperCase();
  const hasActions = onToggleFavorite || onEdit || onMove || onDelete;
  const currentFolder = folders.find((folder) => folder.id === project.folder_id);
  const isList = viewMode === "list";

  return (
    <Link to={`/project/${project.id}`} className="group block">
      <div className={cn("overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_24px_rgba(0,0,0,0.3)]", isList && "flex flex-col items-stretch sm:flex-row")}>
        <div className={cn("relative overflow-hidden bg-muted", isList && "sm:w-[220px] sm:shrink-0")} style={{ aspectRatio: isList ? "16/10" : "16/9", width: isList ? undefined : "100%" }}>
          {project.cover_image ? (
            <img
              src={project.cover_image}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(event) => {
                event.currentTarget.style.display = "none";
                const sibling = event.currentTarget.nextElementSibling;
                if (sibling) sibling.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/8 via-background to-accent/8"
            style={{ display: project.cover_image ? "none" : "flex" }}
          >
            <BookOpen className="mb-1 h-8 w-8 text-primary/25" strokeWidth={1.5} />
            <span className="text-3xl font-bold text-primary/15" style={{ fontFamily: "'Crimson Pro', serif" }}>
              {initial}
            </span>
          </div>

          {hasActions ? (
            <div className="absolute right-2.5 top-2.5 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
              {onToggleFavorite ? (
                <button
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 bg-background/85 shadow-sm backdrop-blur-sm transition-transform hover:scale-110"
                  onClick={(event) => {
                    event.preventDefault();
                    onToggleFavorite(project);
                  }}
                >
                  <Star className={cn("h-3.5 w-3.5", project.is_favorite ? "fill-amber-400 text-amber-400" : "text-foreground/60")} />
                </button>
              ) : null}

              {onEdit || onMove || onDelete ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 bg-background/85 shadow-sm backdrop-blur-sm transition-transform hover:scale-110"
                      onClick={(event) => event.preventDefault()}
                    >
                      <MoreVertical className="h-3.5 w-3.5 text-foreground/60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48" onClick={(event) => event.preventDefault()}>
                    {onEdit ? (
                      <DropdownMenuItem onClick={() => onEdit(project)}>
                        <Pencil className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                        Editar
                      </DropdownMenuItem>
                    ) : null}
                    {onMove && project.folder_id ? (
                      <DropdownMenuItem onClick={() => onMove(project, null)}>
                        <FolderOutput className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                        Remover da pasta
                      </DropdownMenuItem>
                    ) : null}
                    {onMove
                      ? folders
                          .filter((folder) => folder.id !== project.folder_id)
                          .map((folder) => (
                            <DropdownMenuItem key={folder.id} onClick={() => onMove(project, folder.id)}>
                              <FolderInput className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                              {folder.name}
                            </DropdownMenuItem>
                          ))
                      : null}
                    {onDelete ? (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(project)}>
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

          {project.is_favorite ? (
            <div className="absolute left-2.5 top-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-background/85 shadow-sm backdrop-blur-sm">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              </div>
            </div>
          ) : null}
        </div>

        <div className={cn("p-4", isList && "flex flex-1 flex-col justify-between")}>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-[15px] font-semibold text-card-foreground transition-colors group-hover:text-primary">{project.name}</h3>
              {currentFolder ? <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">{currentFolder.name}</span> : null}
            </div>
            {project.description ? <p className={cn("mt-1.5 text-[13px] leading-relaxed text-muted-foreground", isList ? "line-clamp-2" : "line-clamp-2")}>{project.description}</p> : null}
          </div>
          <div className={cn("text-[11px] text-muted-foreground", isList ? "mt-4 flex flex-wrap items-center gap-3" : "mt-3")}>
            <span>Editado {moment(project.updated_date).fromNow()}</span>
            {isList ? <span>Criado {moment(project.created_date).fromNow()}</span> : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
