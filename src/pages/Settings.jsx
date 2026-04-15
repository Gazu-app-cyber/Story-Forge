import { useEffect, useState } from "react";
import { ImagePlus, Loader2, LogOut, Moon, Palette, Save, Smartphone, Trash2, Type, User } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import AdaptiveSelect from "@/components/AdaptiveSelect";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PLAN_DEFINITIONS, normalizePlan } from "@/lib/planLimits";
import { COLOR_PRESETS, getResolvedThemeMode, getTheme, saveTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const fontOptions = [
  { value: "'Source Sans 3', sans-serif", label: "Source Sans 3 (Documento)" },
  { value: "'Inter', sans-serif", label: "Inter (Sem serifa)" },
  { value: "'Crimson Pro', serif", label: "Crimson Pro (Serifada)" },
  { value: "'Literata', serif", label: "Literata (Leitura longa)" },
  { value: "'Newsreader', serif", label: "Newsreader (Editorial)" },
  { value: "'Source Serif 4', serif", label: "Source Serif 4" },
  { value: "'Merriweather', serif", label: "Merriweather" },
  { value: "'Lora', serif", label: "Lora" }
];

const themeModeOptions = [
  { value: "system", label: "Seguir sistema" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" }
];

const planOptions = ["free", "premium", "pro"];

const colorDotMap = {
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  rose: "bg-rose-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  sky: "bg-sky-500"
};

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [themeMode, setThemeMode] = useState("system");
  const [plan, setPlan] = useState("free");
  const [colorPreset, setColorPreset] = useState("indigo");
  const [customPrimary, setCustomPrimary] = useState("");
  const [fontFamily, setFontFamily] = useState("'Crimson Pro', serif");
  const [fontSize, setFontSize] = useState(18);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setPlan(normalizePlan(currentUser.plan));
        setDisplayName(currentUser.display_name || currentUser.full_name || "");
        setUsername(currentUser.username || "");
        setBio(currentUser.bio || "");
        setProfileImage(currentUser.profile_image || "");

        const stored = getTheme();
        setThemeMode(stored.theme_mode || (stored.dark_mode ? "dark" : "system"));
        setColorPreset(stored.color_preset ?? currentUser.color_preset ?? "indigo");
        setCustomPrimary(stored.custom_primary ?? currentUser.custom_primary ?? "");
        setFontFamily(stored.font_family ?? currentUser.font_family ?? "'Crimson Pro', serif");
        setFontSize(stored.font_size ?? currentUser.font_size ?? 18);
        setReducedMotion(Boolean(stored.reduced_motion));
      } catch (error) {
        console.error("Failed to load settings", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function previewTheme(next) {
    saveTheme({
      theme_mode: next.theme_mode ?? themeMode,
      dark_mode: (next.theme_mode ?? themeMode) === "dark",
      color_preset: next.color_preset ?? colorPreset,
      custom_primary: next.custom_primary ?? customPrimary,
      font_family: next.font_family ?? fontFamily,
      font_size: next.font_size ?? fontSize,
      reduced_motion: next.reduced_motion ?? reducedMotion
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const themeData = {
        theme_mode: themeMode,
        dark_mode: getResolvedThemeMode({ theme_mode: themeMode }) === "dark",
        color_preset: colorPreset,
        custom_primary: customPrimary,
        font_family: fontFamily,
        font_size: fontSize,
        reduced_motion: reducedMotion
      };
      saveTheme(themeData);
      document.body.style.fontFamily = fontFamily;
      document.body.style.fontSize = `${fontSize}px`;

      await base44.auth.updateMe({
        display_name: displayName.trim(),
        username: username.trim(),
        bio: bio.trim(),
        profile_image: profileImage,
        plan,
        ...themeData
      });

      toast.success("Configurações salvas!");
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProfileImage(file_url);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteAccount() {
    await base44.auth.deleteMe();
    toast.success("Conta removida.");
    window.location.href = "/";
  }

  async function handlePlanUpgrade(nextPlan) {
    setPlan(nextPlan);
    const updatedUser = await base44.auth.updateMe({ plan: nextPlan });
    setUser(updatedUser);
    toast.success(`Plano alterado para ${PLAN_DEFINITIONS[nextPlan].label}.`);
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="page-shell mx-auto max-w-2xl px-4 pb-28 sm:px-6 lg:pb-16">
      <h1 className="mb-8 text-2xl font-bold tracking-tight">Configurações</h1>

      <section className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
          <User className="h-4 w-4 text-muted-foreground" />
          Perfil
        </h2>
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            {profileImage ? (
              <img src={profileImage} alt="" className="h-20 w-20 rounded-full border border-border object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
                <span className="text-2xl font-bold text-primary">{(displayName || "U")[0].toUpperCase()}</span>
              </div>
            )}
            <div className="space-y-2">
              <label className="inline-block cursor-pointer">
                <Button variant="outline" size="sm" className="pointer-events-none gap-2">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  {profileImage ? "Trocar foto" : "Adicionar foto"}
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              {profileImage ? (
                <Button variant="ghost" size="sm" onClick={() => setProfileImage("")}>
                  Remover foto
                </Button>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Nome de exibição</Label>
              <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Nome de usuário</Label>
              <Input value={username} onChange={(event) => setUsername(event.target.value)} className="mt-1.5" placeholder="seu_username" />
            </div>
          </div>

          <div>
            <Label>E-mail</Label>
            <Input value={user?.email || ""} disabled className="mt-1.5 opacity-60" />
          </div>

          <div>
            <Label>Biografia</Label>
            <Textarea value={bio} onChange={(event) => setBio(event.target.value)} className="mt-1.5" rows={3} placeholder="Conte um pouco sobre você..." />
          </div>
        </div>
      </section>

      <Separator />

      <section className="my-8">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
          <Palette className="h-4 w-4 text-muted-foreground" />
          Plano
        </h2>
        <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm text-muted-foreground">Plano atual</p>
          <p className="text-xl font-semibold text-foreground">{PLAN_DEFINITIONS[plan].label}</p>
          <p className="mt-1 text-sm text-muted-foreground">O upgrade aqui e simulado e serve para liberar recursos do app localmente.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {planOptions.map((option) => {
            const active = option === plan;
            return (
              <button
                key={option}
                type="button"
                onClick={() => handlePlanUpgrade(option)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition-all",
                  active ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/30"
                )}
              >
                <p className="font-semibold text-foreground">{PLAN_DEFINITIONS[option].label}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {option === "free"
                    ? "5 projetos, 20.000 palavras por manuscrito e sem colaboracao."
                    : option === "premium"
                      ? "Exportacao, estatisticas e ate 5 colaboradores por projeto."
                      : "Colaboracao ilimitada, templates e modo livro."}
                </p>
                <div className="mt-4">
                  <Button type="button" size="sm" variant={active ? "default" : "outline"}>
                    {active ? "Plano atual" : "Fazer upgrade"}
                  </Button>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <Separator />

      <section className="my-8">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
          <Moon className="h-4 w-4 text-muted-foreground" />
          Tema
        </h2>
        <div className="space-y-4">
          <div>
            <Label>Modo do tema</Label>
            <div className="mt-1.5">
              <AdaptiveSelect
                value={themeMode}
                onValueChange={(value) => {
                  setThemeMode(value);
                  previewTheme({ theme_mode: value });
                }}
                options={themeModeOptions}
                placeholder="Escolha o tema"
                title="Modo do tema"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Suavizar animações</p>
                <p className="text-sm text-muted-foreground">Reduz a sensação de movimento em telas mobile.</p>
              </div>
              <Switch
                checked={reducedMotion}
                onCheckedChange={(value) => {
                  setReducedMotion(value);
                  previewTheme({ reduced_motion: value });
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <Separator />

      <section className="my-8">
        <h2 className="mb-1 flex items-center gap-2 text-base font-semibold">
          <Palette className="h-4 w-4 text-muted-foreground" />
          Cor principal
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">Altera a cor dos botões, links e destaques do app.</p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {Object.entries(COLOR_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => {
                setColorPreset(key);
                setCustomPrimary("");
                previewTheme({ color_preset: key, custom_primary: "" });
              }}
              className={cn("flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all", colorPreset === key ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30")}
            >
              <div className={cn("h-8 w-8 rounded-full shadow-sm", colorDotMap[key])} />
              <span className="text-[11px] font-medium text-muted-foreground">{preset.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Cor personalizada</p>
              <p className="text-sm text-muted-foreground">Use a roda de cores para um ajuste fino sem perder as opÃ§Ãµes rÃ¡pidas acima.</p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2">
              <input
                type="color"
                value={customPrimary || "#5b4bb6"}
                onChange={(event) => {
                  const nextColor = event.target.value;
                  setCustomPrimary(nextColor);
                  previewTheme({ custom_primary: nextColor });
                }}
                className="h-11 w-14 cursor-pointer rounded-md border-0 bg-transparent p-0"
                aria-label="Selecionar cor personalizada"
              />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Cor ativa</p>
                <p className="font-medium text-foreground">{customPrimary ? customPrimary.toUpperCase() : "Paleta predefinida"}</p>
              </div>
            </div>
          </div>
          {customPrimary ? (
            <div className="mt-3 flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span className="text-muted-foreground">A cor personalizada estÃ¡ sendo usada como cor principal do app.</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCustomPrimary("");
                  previewTheme({ custom_primary: "" });
                }}
              >
                Voltar para paleta
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      <Separator />

      <section className="my-8">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
          <Type className="h-4 w-4 text-muted-foreground" />
          Tipografia do editor
        </h2>
        <div className="space-y-5">
          <div>
            <Label>Fonte</Label>
            <div className="mt-1.5">
              <AdaptiveSelect
                value={fontFamily}
                onValueChange={(value) => {
                  setFontFamily(value);
                  previewTheme({ font_family: value });
                }}
                options={fontOptions}
                placeholder="Escolha uma fonte"
                title="Fonte do editor"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Tamanho da fonte</Label>
              <span className="text-sm tabular-nums text-muted-foreground">{fontSize}px</span>
            </div>
            <Slider
              value={[fontSize]}
              onValueChange={(value) => {
                setFontSize(value[0]);
                previewTheme({ font_size: value[0] });
              }}
              min={12}
              max={28}
              step={1}
            />
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Pré-visualização</p>
            <p style={{ fontFamily, fontSize: `${fontSize}px`, lineHeight: 1.8 }} className="text-foreground">
              Era uma vez, num reino distante, um escritor que sonhava em criar mundos inteiros com o poder
              das palavras. Cada frase era uma porta para o desconhecido...
            </p>
          </div>
        </div>
      </section>

      <Separator />

      <section className="my-8">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
          <Smartphone className="h-4 w-4 text-muted-foreground" />
          Experiência mobile
        </h2>
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Navegação inferior, safe areas, transições leves e seletores adaptados para drawer já estão habilitados
          nesta nova versão do app.
        </div>
      </section>

      <Separator />

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar configurações
        </Button>
        <Button variant="outline" onClick={() => base44.auth.logout().then(() => (window.location.href = "/"))} className="gap-2">
          <LogOut className="h-4 w-4" />
          Sair da conta
        </Button>
      </div>

      <section className="mt-12 rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
        <h2 className="mb-2 text-base font-semibold text-destructive">Zona destrutiva</h2>
        <p className="mb-4 text-sm text-muted-foreground">Use esta ação com cuidado. Ela exige confirmação antes de prosseguir.</p>
        <Button variant="destructive" className="gap-2" onClick={() => setShowDeleteAccount(true)}>
          <Trash2 className="h-4 w-4" />
          Excluir Conta
        </Button>
      </section>

      <ConfirmDialog
        open={showDeleteAccount}
        onOpenChange={setShowDeleteAccount}
        title="Excluir conta?"
        description="Esta ação é destrutiva. Nesta base, a confirmação encerra sua sessão e prepara o fluxo para a exclusão definitiva no backend."
        onConfirm={handleDeleteAccount}
        destructive
      />
    </div>
  );
}
