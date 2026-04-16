import { BookOpen, Eye, Heart, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { getPublicWorkChapterCount, getPublicWorkStatusLabel } from "@/lib/publicWorks";

export default function PublicWorkCard({ work, compact = false }) {
  const chapterCount = getPublicWorkChapterCount(work);
  const statusLabel = getPublicWorkStatusLabel(work);

  return (
    <article className="discover-card overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30">
      <Link to={`/obra/${work.id}`} className="block">
        <div className="overflow-hidden bg-muted" style={{ aspectRatio: compact ? "4/3" : "16/9" }}>
          {work.cover_image ? (
            <img src={work.cover_image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
              <BookOpen className="h-10 w-10 text-primary/40" />
            </div>
          )}
        </div>
        <div className="space-y-4 p-5">
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">{work.genre || work.public_genre}</span>
              <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">{statusLabel}</span>
              <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">{work.age_rating || "Livre"}</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground">{work.title || work.name}</h3>
            {work.author_username ? (
              <p className="mt-1 text-sm text-muted-foreground">por @{work.author_username}</p>
            ) : null}
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{work.short_description || work.public_summary || work.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
            <div className="rounded-2xl bg-muted/60 px-3 py-2">{chapterCount} capítulos</div>
            <div className="flex items-center gap-1 rounded-2xl bg-muted/60 px-3 py-2">
              <Heart className="h-3.5 w-3.5" />
              {work.public_likes || 0}
            </div>
            <div className="flex items-center gap-1 rounded-2xl bg-muted/60 px-3 py-2">
              <MessageCircle className="h-3.5 w-3.5" />
              {work.public_comments || 0}
            </div>
            <div className="flex items-center gap-1 rounded-2xl bg-muted/60 px-3 py-2">
              <Eye className="h-3.5 w-3.5" />
              {work.public_views || 0}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
