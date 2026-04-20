import { useEffect, useMemo, useState } from "react";
import { Ban, BarChart3, EyeOff, Facebook, Flag, Globe, Instagram, Link as LinkIcon, Loader2, MessageSquare, PenSquare, ShieldCheck, SquarePen, Users, Vote, Youtube } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import ConfirmDialog from "@/components/ConfirmDialog";
import CreatePollDialog from "@/components/CreatePollDialog";
import CreatePostDialog from "@/components/CreatePostDialog";
import PublicWorkCard from "@/components/PublicWorkCard";
import ReportContentDialog from "@/components/ReportContentDialog";
import { listPublicWorksByAuthor } from "@/lib/publicWorksStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const socialMeta = {
  instagram: { label: "Instagram", icon: Instagram },
  twitter: { label: "X / Twitter", icon: LinkIcon },
  tiktok: { label: "TikTok", icon: LinkIcon },
  youtube: { label: "YouTube", icon: Youtube },
  facebook: { label: "Facebook", icon: Facebook },
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

function PostCard({ post, onReport, canModerate }) {
  return (
    <article className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          <SquarePen className="h-3.5 w-3.5" />
          Post
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{formatDate(post.created_date)}</span>
          {canModerate ? (
            <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs" onClick={() => onReport(post)}>
              <Flag className="h-3.5 w-3.5" />
              Denunciar
            </Button>
          ) : null}
        </div>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{post.content}</p>
      <div className="mt-4 inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
        {post.content.length} caracteres
      </div>
    </article>
  );
}

function PollCard({ poll, canVote, onVote, onReport, canModerate }) {
  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);

  return (
    <article className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          <Vote className="h-3.5 w-3.5" />
          Enquete
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{formatDate(poll.created_date)}</span>
          {canModerate ? (
            <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs" onClick={() => onReport(poll)}>
              <Flag className="h-3.5 w-3.5" />
              Denunciar
            </Button>
          ) : null}
        </div>
      </div>

      <h3 className="text-base font-semibold text-foreground">{poll.question}</h3>
      <div className="mt-4 space-y-2">
        {poll.options.map((option) => (
          <div key={option.id} className="overflow-hidden rounded-2xl border border-border bg-background">
            <button
              type="button"
              onClick={() => onVote(poll.id, option.id)}
              disabled={!canVote}
              className={cn(
                "flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors",
                canVote ? "hover:bg-primary/5" : "bg-muted/30"
              )}
            >
              <span className="font-medium text-foreground">{option.label}</span>
              <span className="text-muted-foreground">{option.votes} votos</span>
            </button>
            <div className="h-1.5 bg-muted">
              <div
                className="h-full bg-primary/70 transition-all"
                style={{ width: `${totalVotes ? (option.votes / totalVotes) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{totalVotes} voto{totalVotes !== 1 ? "s" : ""} no total</span>
        {!canVote ? <span className="rounded-full bg-muted px-2 py-1">Você já votou</span> : null}
      </div>
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
  const [loadError, setLoadError] = useState("");
  const [profileVisibility, setProfileVisibility] = useState("public");
  const [togglingProfile, setTogglingProfile] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [moderationState, setModerationState] = useState({ isBlocked: false, blockedByViewer: false, viewerBlockedByUser: false });
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showUnblockConfirm, setShowUnblockConfirm] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);

  const isOwnProfile = Boolean(profile && currentUser && profile.id === currentUser.id);

  async function loadProfile() {
    try {
      setLoading(true);
      setLoadError("");
      const viewer = await base44.auth.me().catch(() => null);
      const resolvedUsername = username || viewer?.username;

      if (!resolvedUsername) {
        setCurrentUser(viewer);
        setProfile(null);
        setProfileVisibility("public");
        setWorks([]);
        setPosts([]);
        setPolls([]);
        setLoadError("");
        return;
      }

      const data = await base44.social.getAuthorProfileView(resolvedUsername);
      setCurrentUser(viewer);
      setProfile(data.author);
      setProfileVisibility(data.visibility || "public");
      setWorks(listPublicWorksByAuthor(data.author.email).map((work) => ({ ...work, author_username: data.author.username })));
      setPosts(data.posts || []);
      setPolls(data.polls || []);
      setModerationState(
        data.author?.moderation_state ||
          (data.author?.email ? await base44.moderation.getUserModerationState(data.author.email) : { isBlocked: false, blockedByViewer: false, viewerBlockedByUser: false })
      );
    } catch (error) {
      console.error("Failed to load public profile", error);
      toast.error(error?.message || "Não foi possível carregar o perfil público.");
      setProfile(null);
      setProfileVisibility("public");
      setWorks([]);
      setPosts([]);
      setPolls([]);
      setModerationState({ isBlocked: false, blockedByViewer: false, viewerBlockedByUser: false });
      setLoadError(error?.message || "Não foi possível carregar o perfil público.");
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

  async function handleTogglePublicProfile() {
    if (!isOwnProfile) return;
    setTogglingProfile(true);
    try {
      const nextValue = profileVisibility !== "public";
      await base44.auth.updateMe({ public_profile: nextValue });
      toast.success(nextValue ? "Seu perfil público foi ativado." : "Seu perfil público foi desativado.");
      await loadProfile();
    } catch (error) {
      toast.error(error?.message || "Não foi possível atualizar o perfil público.");
    } finally {
      setTogglingProfile(false);
    }
  }

  async function handleBlockUser() {
    if (!profile?.email) return;
    try {
      await base44.moderation.blockUserByEmail(profile.email);
      setShowBlockConfirm(false);
      setModerationState({ isBlocked: true, blockedByViewer: true, viewerBlockedByUser: false });
      toast.success("Usuário bloqueado.");
      loadProfile();
    } catch (error) {
      toast.error(error?.message || "Não foi possível bloquear este usuário.");
    }
  }

  async function handleUnblockUser() {
    if (!profile?.email) return;
    try {
      await base44.moderation.unblockUserByEmail(profile.email);
      setShowUnblockConfirm(false);
      setModerationState({ isBlocked: false, blockedByViewer: false, viewerBlockedByUser: false });
      toast.success("Usuário desbloqueado.");
      loadProfile();
    } catch (error) {
      toast.error(error?.message || "Não foi possível desbloquear este usuário.");
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

  if (!profile) {
    return (
      <div className="page-shell mx-auto max-w-4xl px-4 pb-28 sm:px-6 lg:pb-10">
        <div className="rounded-[1.75rem] border border-dashed border-border bg-card px-6 py-20 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <p className="text-lg font-semibold text-foreground">Perfil público indisponível</p>
          <p className="mt-2 text-sm text-muted-foreground">{loadError || "Não foi possível localizar este perfil público."}</p>
          <Button asChild className="mt-4">
            <Link to="/discover">Voltar para descobrir</Link>
          </Button>
        </div>
      </div>
    );
  }

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
                  <Button type="button" variant={profileVisibility === "public" ? "secondary" : "outline"} className="rounded-full px-5" onClick={handleTogglePublicProfile} disabled={togglingProfile}>
                    {togglingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {profileVisibility === "public" ? "Desativar perfil público" : "Ativar perfil público"}
                  </Button>
                  <Button type="button" variant="outline" className="rounded-full px-5" onClick={() => setShowCreatePost(true)}>
                    Novo post
                  </Button>
                  <Button type="button" className="rounded-full px-5" onClick={() => setShowCreatePoll(true)}>
                    Nova enquete
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" onClick={handleToggleFollow} variant={profile.is_following ? "secondary" : "default"} className="rounded-full px-5">
                    {profile.is_following ? "Seguindo" : "Seguir autor"}
                  </Button>
                  {moderationState.blockedByViewer ? (
                    <Button type="button" variant="secondary" className="rounded-full px-5" onClick={() => setShowUnblockConfirm(true)}>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Desbloquear
                    </Button>
                  ) : (
                    <Button type="button" variant="outline" className="rounded-full px-5" onClick={() => setShowBlockConfirm(true)}>
                      <Ban className="mr-2 h-4 w-4" />
                      Bloquear usuário
                    </Button>
                  )}
                </>
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

          {isOwnProfile && profileVisibility !== "public" ? (
            <div className="mt-5 rounded-2xl border border-amber-300/40 bg-amber-500/10 p-4 text-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-foreground">Seu perfil público está desativado</p>
                  <p className="mt-1 text-muted-foreground">Ative seu perfil para aparecer publicamente. Enquanto isso, esta página continua disponível só para você.</p>
                </div>
                <Button type="button" onClick={handleTogglePublicProfile} disabled={togglingProfile} className="gap-2">
                  {togglingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <EyeOff className="h-4 w-4" />}
                  Ativar perfil
                </Button>
              </div>
            </div>
          ) : null}

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
                <PostCard key={post.id} post={post} onReport={setReportTarget} canModerate={!isOwnProfile} />
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
                  onReport={setReportTarget}
                  canModerate={!isOwnProfile}
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
      <ReportContentDialog
        open={Boolean(reportTarget)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setReportTarget(null);
        }}
        contentType={reportTarget?.question ? "public_poll" : "public_post"}
        contentId={reportTarget?.id || ""}
        contentTitle={reportTarget?.question || reportTarget?.content?.slice(0, 80) || "Conteúdo público"}
        contentAuthorEmail={profile?.email || ""}
        triggerLabel="Denunciar conteúdo"
      />
      <ConfirmDialog
        open={showBlockConfirm}
        onOpenChange={setShowBlockConfirm}
        title="Bloquear este usuário?"
        description="Ao bloquear esta conta, o app passa a ocultar perfil e conteúdos públicos dela sempre que isso for possível na camada atual."
        onConfirm={handleBlockUser}
        destructive
      />
      <ConfirmDialog
        open={showUnblockConfirm}
        onOpenChange={setShowUnblockConfirm}
        title="Desbloquear este usuário?"
        description="Ao desbloquear, o perfil público e os conteúdos desse usuário voltam a ficar acessíveis para a sua conta."
        onConfirm={handleUnblockUser}
      />
    </div>
  );
}
