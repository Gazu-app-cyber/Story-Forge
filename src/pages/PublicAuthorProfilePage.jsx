import { useEffect, useState } from "react";
import { Globe, Instagram, Link as LinkIcon, Loader2, PenSquare, Users, Youtube } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import PublicWorkCard from "@/components/PublicWorkCard";
import { listPublicWorksByAuthor } from "@/lib/publicWorksStore";
import { Button } from "@/components/ui/button";

const socialMeta = {
  instagram: { label: "Instagram", icon: Instagram },
  twitter: { label: "X / Twitter", icon: LinkIcon },
  tiktok: { label: "TikTok", icon: LinkIcon },
  youtube: { label: "YouTube", icon: Youtube },
  website: { label: "Site", icon: Globe },
  wattpad: { label: "Wattpad", icon: PenSquare }
};

export default function PublicAuthorProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadProfile() {
    try {
      setLoading(true);
      const data = await base44.social.getPublicAuthorByUsername(username);
      setProfile(data.author);
      setWorks(listPublicWorksByAuthor(data.author.email).map((work) => ({ ...work, author_username: data.author.username })));
    } catch (error) {
      console.error("Failed to load public author profile", error);
      toast.error(error?.message || "Não foi possível carregar o perfil público.");
      setProfile(null);
      setWorks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, [username]);

  async function handleToggleFollow() {
    if (!profile) return;
    try {
      await base44.social.toggleFollow(profile.id);
      loadProfile();
    } catch (error) {
      toast.error(error?.message || "Não foi possível atualizar o estado de seguir.");
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  const visibleLinks = Object.entries(profile.social_links || {}).filter(([, value]) => value);

  return (
    <div className="page-shell mx-auto max-w-6xl px-4 pb-28 sm:px-6 lg:pb-10">
      <section className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
        <div className="social-banner h-44 sm:h-56" style={{ backgroundImage: profile.profile_banner ? `url(${profile.profile_banner})` : undefined }} />
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end gap-4">
              {profile.profile_image ? (
                <img src={profile.profile_image} alt="" className="h-24 w-24 rounded-[1.75rem] border-4 border-card object-cover shadow-sm" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-[1.75rem] border-4 border-card bg-primary text-3xl font-bold text-primary-foreground shadow-sm">
                  {(profile.display_name || profile.full_name || "A")[0].toUpperCase()}
                </div>
              )}
              <div className="pb-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{profile.display_name || profile.full_name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">@{profile.username}</p>
              </div>
            </div>
            <Button type="button" onClick={handleToggleFollow} variant={profile.is_following ? "secondary" : "default"} className="rounded-full px-5">
              {profile.is_following ? "Seguindo" : "Seguir autor"}
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-3 py-1.5">{profile.followers_count} seguidores</span>
            <span className="rounded-full bg-muted px-3 py-1.5">{profile.following_count} seguindo</span>
            <span className="rounded-full bg-muted px-3 py-1.5">{works.length} obras públicas</span>
          </div>

          {profile.bio ? <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">{profile.bio}</p> : null}

          {visibleLinks.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {visibleLinks.map(([key, value]) => {
                const meta = socialMeta[key];
                const Icon = meta?.icon || LinkIcon;
                return (
                  <a key={key} href={value} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:border-primary/40 hover:text-primary">
                    <Icon className="h-4 w-4" />
                    {meta?.label || key}
                  </a>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Vitrine de obras</h2>
            <p className="text-sm text-muted-foreground">Base pública do autor com banner, avatar, bio e catálogo de obras.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            Perfil público
          </div>
        </div>

        {works.length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {works.map((work) => (
              <PublicWorkCard key={work.id} work={work} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <p className="text-lg font-semibold text-foreground">Nenhuma obra pública ainda</p>
            <p className="mt-2 text-sm text-muted-foreground">Este espaço já está preparado para exibir histórias públicas quando o autor publicar sua vitrine.</p>
          </div>
        )}
      </section>

      <section className="mt-10 rounded-3xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Base social preparada</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Este perfil já suporta banner, avatar, bio, redes sociais, contadores sociais e catálogo público. A próxima etapa pode aprofundar comentários, leitura pública completa e interação entre leitores e autores.
        </p>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link to="/settings">Editar meu perfil</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
