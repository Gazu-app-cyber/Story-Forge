import { useEffect, useMemo, useState } from "react";
import { BarChart3, Globe, Instagram, Link as LinkIcon, Loader2, MessageSquare, PenSquare, SquarePen, Users, Vote, Youtube } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import CreatePollDialog from "@/components/CreatePollDialog";
import CreatePostDialog from "@/components/CreatePostDialog";
import PublicWorkCard from "@/components/PublicWorkCard";
import { listPublicWorksByAuthor } from "@/lib/publicWorksStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const socialMeta = {
  instagram: { label: "Instagram", icon: Instagram },
  twitter: { label: "X / Twitter", icon: LinkIcon },
  tiktok: { label: "TikTok", icon: LinkIcon },
  youtube: { label: "YouTube", icon: Youtube },
  website: { label: "Site", icon: Globe },
  wattpad: { label: "Wattpad", icon: PenSquare }
};

const tabs = [
  { value: "works", label: "Obras", icon: BarChart3 },
  { value: "posts", label: "Posts", icon: MessageSquare },
  { value: "polls", label: "Enquetes", icon: Vote }
];

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return "";
  }
}

function PostCard({ post }) {
  return (
    <article className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          <SquarePen className="h-3.5 w-3.5" />
          Post
        </span>
        <span className="text-xs text-muted-foreground">{formatDate(post.created_date)}</span>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{post.content}</p>
    </article>
  );
}

function PollCard({ poll, canVote, onVote }) {
  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);

  return (
    <article className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          <Vote className="h-3.5 w-3.5" />
          Enquete
        </span>
        <span className="text-xs text-muted-foreground">{formatDate(poll.created_date)}</span>
      </div>

      <h3 className="text-base font-semibold text-foreground">{poll.question}</h3>
      <div className="mt-4 space-y-2">
        {poll.options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onVote(poll.id, option.id)}
            disabled={!canVote}
            className={cn(
              "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition-colors",
              canVote ? "border-border bg-background hover:border-primary/35 hover:bg-primary/5" : "border-border bg-muted/40"
            )}
          >
            <span className="font-medium text-foreground">{option.label}</span>
            <span className="text-muted-foreground">{option.votes} votos</span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{totalVotes} voto{totalVotes !== 1 ? "s" : ""} no total</p>
    </article>
  );
}

export default function PublicProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [works, setWorks] = useState([]);
  const [posts, setPosts] = useState([]);
  const [polls, setPolls] = useState([]);
  const [activeTab, setActiveTab] = useState("works");
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreatePoll, setShowCreatePoll] = useState(false);

  const isOwnProfile = Boolean(profile && currentUser && profile.id === currentUser.id);

  async function loadProfile() {
    try {
      setLoading(true);
      const viewer = await base44.auth.me().catch(() => null);
      const resolvedUsername = username || viewer?.username;

      if (!resolvedUsername) {
        setCurrentUser(viewer);
        setProfile(null);
        setWorks([]);
        setPosts([]);
        setPolls([]);
        return;
      }

      const data = await base44.social.getPublicAuthorByUsername(resolvedUsername);
      setCurrentUser(viewer);
      setProfile(data.author);
      setWorks(listPublicWorksByAuthor(data.author.email).map((work) => ({ ...work, author_username: data.author.username })));
      setPosts(data.posts || []);
      setPolls(data.polls || []);
    } catch (error) {
      console.error("Failed to load public profile", error);
      toast.error(error?.message || "Não foi possível carregar o perfil público.");
      setProfile(null);
      setWorks([]);
      setPosts([]);
      setPolls([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();

    function handleRefresh() {
      loadProfile();
    }

    window.addEventListener("storyforge:data-changed", handleRefresh);
    window.addEventListener("storage", handleRefresh);
    return () => {
      window.removeEventListener("storyforge:data-changed", handleRefresh);
      window.removeEventListener("storage", handleRefresh);
    };
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

  async function handleVote(pollId, optionId) {
    try {
      await base44.social.votePoll(pollId, optionId);
      loadProfile();
    } catch (error) {
      toast.error(error?.message || "Não foi possível registrar o voto.");
    }
  }

  const visibleLinks = useMemo(() => Object.entries(profile?.social_links || {}).filter(([, value]) => value), [profile]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

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
            <div className="flex flex-wrap gap-2">
              {isOwnProfile ? (
                <>
                  <Button type="button" variant="outline" className="rounded-full px-5" onClick={() => setShowCreatePost(true)}>
                    Novo post
                  </Button>
                  <Button type="button" className="rounded-full px-5" onClick={() => setShowCreatePoll(true)}>
                    Nova enquete
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={handleToggleFollow} variant={profile.is_following ? "secondary" : "default"} className="rounded-full px-5">
                  {profile.is_following ? "Seguindo" : "Seguir autor"}
                </Button>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-3 py-1.5">{profile.followers_count} seguidores</span>
            <span className="rounded-full bg-muted px-3 py-1.5">{profile.following_count} seguindo</span>
            <span className="rounded-full bg-muted px-3 py-1.5">{works.length} obras públicas</span>
            <span className="rounded-full bg-muted px-3 py-1.5">{posts.length} posts</span>
            <span className="rounded-full bg-muted px-3 py-1.5">{polls.length} enquetes</span>
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
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Perfil público</h2>
            <p className="text-sm text-muted-foreground">Obras, posts e enquetes em uma base social focada em autores.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            Autor em destaque
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === tab.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "works" ? (
          works.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {works.map((work) => (
                <PublicWorkCard key={work.id} work={work} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
              <p className="text-lg font-semibold text-foreground">Nenhuma obra pública ainda</p>
              <p className="mt-2 text-sm text-muted-foreground">Este perfil já está pronto para exibir histórias públicas quando o autor publicar sua vitrine.</p>
            </div>
          )
        ) : null}

        {activeTab === "posts" ? (
          posts.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
              <p className="text-lg font-semibold text-foreground">Nenhum post publicado</p>
              <p className="mt-2 text-sm text-muted-foreground">Use posts para compartilhar bastidores, avisos de capítulo novo e atualizações com leitores.</p>
            </div>
          )
        ) : null}

        {activeTab === "polls" ? (
          polls.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {polls.map((poll) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  canVote={Boolean(currentUser) && !(poll.voter_ids || []).includes(currentUser.id)}
                  onVote={handleVote}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
              <p className="text-lg font-semibold text-foreground">Nenhuma enquete publicada</p>
              <p className="mt-2 text-sm text-muted-foreground">Use enquetes para testar capas, títulos, personagens favoritos ou decisões narrativas com seus leitores.</p>
            </div>
          )
        ) : null}
      </section>

      <section className="mt-10 rounded-3xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Camada social já funcional</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          O perfil público agora já suporta banner, avatar, bio, redes sociais, vitrine de obras, posts e enquetes com persistência local e atualização imediata.
        </p>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link to="/settings">Editar meu perfil</Link>
          </Button>
        </div>
      </section>

      <CreatePostDialog open={showCreatePost} onOpenChange={setShowCreatePost} onSuccess={loadProfile} />
      <CreatePollDialog open={showCreatePoll} onOpenChange={setShowCreatePoll} onSuccess={loadProfile} />
    </div>
  );
}
