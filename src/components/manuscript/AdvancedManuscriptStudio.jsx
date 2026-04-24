import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Link2,
  MapPinned,
  Plus,
  Trash2,
  Users
} from "lucide-react";
import AdaptiveSelect from "@/components/AdaptiveSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  BLOCK_TYPE_OPTIONS,
  CHARACTER_CATEGORY_OPTIONS,
  CHAPTER_STAGE_OPTIONS,
  LOCATION_TYPE_OPTIONS,
  MANUSCRIPT_MODULES,
  MAP_NODE_TYPE_OPTIONS,
  TIMELINE_PRECISION_OPTIONS,
  createEmptyBlock,
  createEmptyChapter,
  createEmptyCharacter,
  createEmptyLocation,
  createEmptyMapConnection,
  createEmptyMapNode,
  createEmptyRelation,
  createEmptyTimelineEvent,
  getMapNodeMeta,
  moveItem,
  sortTimelineEvents
} from "@/lib/manuscriptStructure";
import { cn } from "@/lib/utils";

function cloneStructure(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeTags(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function renderRelationColor(weight) {
  if (weight === "support") return "stroke-emerald-400";
  if (weight === "conflict") return "stroke-rose-400";
  if (weight === "romance") return "stroke-fuchsia-400";
  return "stroke-amber-400";
}

function SectionCard({ title, subtitle, actions, children }) {
  return (
    <section className="rounded-3xl border border-border bg-card/80 p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

function RowActions({ onMoveUp, onMoveDown, onRemove, disableUp, disableDown }) {
  return (
    <div className="flex items-center gap-1">
      <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={onMoveUp} disabled={disableUp}>
        <ArrowUp className="h-3.5 w-3.5" />
      </Button>
      <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={onMoveDown} disabled={disableDown}>
        <ArrowDown className="h-3.5 w-3.5" />
      </Button>
      <Button type="button" variant="outline" size="icon" className="h-8 w-8 text-destructive" onClick={onRemove}>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function CrossReferenceChecklist({ title, options, value, onChange, emptyText = "Nenhum item disponível." }) {
  const selected = new Set(value || []);
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {options.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((option) => (
            <label key={option.value} className="flex items-start gap-2 rounded-2xl border border-border px-3 py-2 text-sm">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={selected.has(option.value)}
                onChange={(event) => {
                  const next = new Set(selected);
                  if (event.target.checked) next.add(option.value);
                  else next.delete(option.value);
                  onChange([...next]);
                }}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
}

function BlockEditor({ block, index, total, characterOptions, locationOptions, eventOptions, onChange, onMoveUp, onMoveDown, onRemove }) {
  return (
    <div className="rounded-3xl border border-border bg-background/70 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-muted p-2 text-muted-foreground">
            <GripVertical className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-foreground">{block.title || `Bloco ${index + 1}`}</p>
            <p className="text-xs text-muted-foreground">Tipo: {BLOCK_TYPE_OPTIONS.find((item) => item.value === block.type)?.label || "Texto"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" className="gap-1" onClick={() => onChange({ collapsed: !block.collapsed })}>
            {block.collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {block.collapsed ? "Expandir" : "Recolher"}
          </Button>
          <RowActions
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            onRemove={onRemove}
            disableUp={index === 0}
            disableDown={index === total - 1}
          />
        </div>
      </div>

      {!block.collapsed ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1.3fr,0.9fr]">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Título do bloco</label>
              <Input value={block.title} onChange={(event) => onChange({ title: event.target.value })} placeholder="Ex.: Gancho emocional" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Tipo</label>
              <AdaptiveSelect value={block.type} onValueChange={(value) => onChange({ type: value })} options={BLOCK_TYPE_OPTIONS} placeholder="Selecione" title="Tipo de bloco" />
            </div>
          </div>

          {block.type === "list" ? (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">Itens da lista</label>
              {(block.items || []).map((item, itemIndex) => (
                <div key={`${block.id}_item_${itemIndex}`} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(event) => {
                      const nextItems = [...(block.items || [])];
                      nextItems[itemIndex] = event.target.value;
                      onChange({ items: nextItems });
                    }}
                    placeholder={`Item ${itemIndex + 1}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 text-destructive"
                    onClick={() => onChange({ items: (block.items || []).filter((_, currentIndex) => currentIndex !== itemIndex) || [""] })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" className="gap-2" onClick={() => onChange({ items: [...(block.items || []), ""] })}>
                <Plus className="h-4 w-4" />
                Adicionar item
              </Button>
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                {block.type === "reference" ? "Descrição da referência" : block.type === "event" ? "Descrição do evento" : "Conteúdo"}
              </label>
              <Textarea value={block.text} onChange={(event) => onChange({ text: event.target.value })} placeholder="Escreva aqui..." className="min-h-[120px]" />
            </div>
          )}

          {block.type === "reference" ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Rótulo</label>
                <Input value={block.referenceLabel} onChange={(event) => onChange({ referenceLabel: event.target.value })} placeholder="Ex.: Inspiração visual" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Destino</label>
                <Input value={block.referenceTarget} onChange={(event) => onChange({ referenceTarget: event.target.value })} placeholder="Capítulo, link ou nota" />
              </div>
            </div>
          ) : null}

          {block.type === "event" ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Data ou marcador</label>
              <Input value={block.eventDate} onChange={(event) => onChange({ eventDate: event.target.value })} placeholder="Ex.: Dia 4 / 18 de maio / Era do Ferro" />
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-3">
            <CrossReferenceChecklist title="Personagens ligados" options={characterOptions} value={block.linkedCharacterIds} onChange={(next) => onChange({ linkedCharacterIds: next })} />
            <CrossReferenceChecklist title="Locais ligados" options={locationOptions} value={block.linkedLocationIds} onChange={(next) => onChange({ linkedLocationIds: next })} />
            <CrossReferenceChecklist title="Eventos ligados" options={eventOptions} value={block.linkedEventIds} onChange={(next) => onChange({ linkedEventIds: next })} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ChapterEditor({
  chapter,
  index,
  total,
  chapterOptions,
  eventOptions,
  characterOptions,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  onInsertAfter
}) {
  return (
    <div className="rounded-3xl border border-border bg-background/70 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{chapter.title || `Capítulo ${index + 1}`}</p>
          <p className="text-xs text-muted-foreground">
            {CHAPTER_STAGE_OPTIONS.find((item) => item.value === chapter.stage)?.label || "Desenvolvimento"}
            {chapter.parentId ? " · Subcapítulo" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" className="gap-1" onClick={() => onChange({ collapsed: !chapter.collapsed })}>
            {chapter.collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {chapter.collapsed ? "Expandir" : "Recolher"}
          </Button>
          <RowActions onMoveUp={onMoveUp} onMoveDown={onMoveDown} onRemove={onRemove} disableUp={index === 0} disableDown={index === total - 1} />
        </div>
      </div>

      {!chapter.collapsed ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-foreground">Título</label>
              <Input value={chapter.title} onChange={(event) => onChange({ title: event.target.value })} placeholder="Ex.: Confronto no mercado" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Etapa</label>
              <AdaptiveSelect value={chapter.stage} onValueChange={(value) => onChange({ stage: value })} options={CHAPTER_STAGE_OPTIONS} placeholder="Selecione" title="Etapa do capítulo" />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Inserido abaixo de</label>
              <AdaptiveSelect
                value={chapter.parentId || "root"}
                onValueChange={(value) => onChange({ parentId: value === "root" ? "" : value })}
                options={[{ value: "root", label: "Capítulo raiz" }, ...chapterOptions.filter((option) => option.value !== chapter.id)]}
                placeholder="Capítulo raiz"
                title="Subcapítulo"
              />
            </div>
            <div className="flex items-end">
              <Button type="button" variant="outline" className="gap-2" onClick={onInsertAfter}>
                <Plus className="h-4 w-4" />
                Inserir depois deste
              </Button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Resumo</label>
            <Textarea value={chapter.summary} onChange={(event) => onChange({ summary: event.target.value })} placeholder="O que precisa acontecer neste capítulo?" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Rascunho / cenas</label>
            <Textarea value={chapter.content} onChange={(event) => onChange({ content: event.target.value })} placeholder="Cenas, trechos, diálogos..." className="min-h-[160px]" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Notas editoriais</label>
            <Textarea value={chapter.notes} onChange={(event) => onChange({ notes: event.target.value })} placeholder="Ajustes, ritmo, POV, gancho..." />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <CrossReferenceChecklist title="Eventos relacionados" options={eventOptions} value={chapter.linkedEventIds} onChange={(next) => onChange({ linkedEventIds: next })} />
            <CrossReferenceChecklist title="Personagens relacionados" options={characterOptions} value={chapter.linkedCharacterIds} onChange={(next) => onChange({ linkedCharacterIds: next })} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LocationEditor({ location, index, total, characterOptions, onChange, onMoveUp, onMoveDown, onRemove }) {
  return (
    <div className="rounded-3xl border border-border bg-background/70 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{location.name || `Local ${index + 1}`}</p>
          <p className="text-xs text-muted-foreground">{LOCATION_TYPE_OPTIONS.find((item) => item.value === location.type)?.label || "Cidade/Vila"}</p>
        </div>
        <RowActions onMoveUp={onMoveUp} onMoveDown={onMoveDown} onRemove={onRemove} disableUp={index === 0} disableDown={index === total - 1} />
      </div>

      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Nome</label>
            <Input value={location.name} onChange={(event) => onChange({ name: event.target.value })} placeholder="Ex.: Reino de Vésper" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Tipo</label>
            <AdaptiveSelect value={location.type} onValueChange={(value) => onChange({ type: value })} options={LOCATION_TYPE_OPTIONS} placeholder="Selecione" title="Tipo de local" />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">Descrição narrativa</label>
          <Textarea value={location.description} onChange={(event) => onChange({ description: event.target.value })} placeholder="Como esse lugar funciona na história?" />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Importância na história</label>
            <Textarea value={location.importance} onChange={(event) => onChange({ importance: event.target.value })} placeholder="Conflitos, viradas, memórias..." />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Significado simbólico</label>
            <Textarea value={location.symbolism} onChange={(event) => onChange({ symbolism: event.target.value })} placeholder="O que esse lugar representa?" />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Tags</label>
            <Input value={(location.tags || []).join(", ")} onChange={(event) => onChange({ tags: normalizeTags(event.target.value) })} placeholder="#rpg, masmorras, porto" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Imagem / miniatura</label>
            <Input value={location.image || ""} onChange={(event) => onChange({ image: event.target.value })} placeholder="URL opcional da imagem" />
          </div>
        </div>

        <CrossReferenceChecklist title="Personagens associados" options={characterOptions} value={location.characterIds} onChange={(next) => onChange({ characterIds: next })} />
      </div>
    </div>
  );
}

function CharacterEditor({
  character,
  index,
  total,
  chapterOptions,
  locationOptions,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove
}) {
  return (
    <div className="rounded-3xl border border-border bg-background/70 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{character.name || `Personagem ${index + 1}`}</p>
          <p className="text-xs text-muted-foreground">{CHARACTER_CATEGORY_OPTIONS.find((item) => item.value === character.category)?.label || "Outros"}</p>
        </div>
        <RowActions onMoveUp={onMoveUp} onMoveDown={onMoveDown} onRemove={onRemove} disableUp={index === 0} disableDown={index === total - 1} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Nome</label>
              <Input value={character.name} onChange={(event) => onChange({ name: event.target.value })} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Categoria</label>
              <AdaptiveSelect value={character.category} onValueChange={(value) => onChange({ category: value })} options={CHARACTER_CATEGORY_OPTIONS} placeholder="Selecione" title="Categoria do personagem" />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <InputField label="Papel na história" value={character.storyRole} onChange={(value) => onChange({ storyRole: value })} />
            <InputField label="Função narrativa" value={character.narrativeFunction} onChange={(value) => onChange({ narrativeFunction: value })} />
          </div>
          <TextareaField label="Conflito com protagonista" value={character.protagonistConflict} onChange={(value) => onChange({ protagonistConflict: value })} />
          <div className="grid gap-3 md:grid-cols-3">
            <InputField label="Gênero" value={character.gender} onChange={(value) => onChange({ gender: value })} />
            <InputField label="Idade" value={character.age} onChange={(value) => onChange({ age: value })} />
            <InputField label="Pronomes" value={character.pronouns} onChange={(value) => onChange({ pronouns: value })} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <InputField label="Apelidos" value={character.nicknames} onChange={(value) => onChange({ nicknames: value })} />
            <InputField label="Forma de falar" value={character.speechStyle} onChange={(value) => onChange({ speechStyle: value })} />
          </div>
          <TextareaField label="Personalidade" value={character.personality} onChange={(value) => onChange({ personality: value })} />
          <TextareaField label="Aparência" value={character.appearance} onChange={(value) => onChange({ appearance: value })} />
          <div className="grid gap-3 md:grid-cols-2">
            <TextareaField label="Objetivos" value={character.objectives} onChange={(value) => onChange({ objectives: value })} />
            <TextareaField label="Obstáculos" value={character.obstacles} onChange={(value) => onChange({ obstacles: value })} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <TextareaField label="Pontos fortes" value={character.strengths} onChange={(value) => onChange({ strengths: value })} />
            <TextareaField label="Fraquezas" value={character.weaknesses} onChange={(value) => onChange({ weaknesses: value })} />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <TextareaField label="Estado inicial" value={character.mentalStateStart} onChange={(value) => onChange({ mentalStateStart: value })} />
            <TextareaField label="Estado no meio" value={character.mentalStateMiddle} onChange={(value) => onChange({ mentalStateMiddle: value })} />
            <TextareaField label="Estado no fim" value={character.mentalStateEnd} onChange={(value) => onChange({ mentalStateEnd: value })} />
          </div>
          <TextareaField label="História / passado" value={character.backstory} onChange={(value) => onChange({ backstory: value })} />
          <TextareaField label="Empatia com o leitor" value={character.empathyHooks} onChange={(value) => onChange({ empathyHooks: value })} />
          <div className="grid gap-3 md:grid-cols-2">
            <TextareaField label="Vida pessoal" value={character.personalLife} onChange={(value) => onChange({ personalLife: value })} />
            <TextareaField label="Relações sociais" value={character.socialLife} onChange={(value) => onChange({ socialLife: value })} />
          </div>
          <TextareaField label="Trabalho e hierarquia" value={character.workLife} onChange={(value) => onChange({ workLife: value })} />
          <InputField label="Tags" value={(character.tags || []).join(", ")} onChange={(value) => onChange({ tags: normalizeTags(value) })} />
          <CrossReferenceChecklist title="Capítulos ligados" options={chapterOptions} value={character.relatedChapterIds} onChange={(next) => onChange({ relatedChapterIds: next })} />
          <CrossReferenceChecklist title="Locais ligados" options={locationOptions} value={character.linkedLocationIds} onChange={(next) => onChange({ linkedLocationIds: next })} />
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">{label}</label>
      <Input value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">{label}</label>
      <Textarea value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </div>
  );
}

function TimelineEventEditor({ event, index, total, chapterOptions, characterOptions, locationOptions, onChange, onMoveUp, onMoveDown, onRemove }) {
  return (
    <div className="rounded-3xl border border-border bg-background/70 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{event.title || `Evento ${index + 1}`}</p>
          <p className="text-xs text-muted-foreground">{TIMELINE_PRECISION_OPTIONS.find((item) => item.value === event.precision)?.label || "Dia"}</p>
        </div>
        <RowActions onMoveUp={onMoveUp} onMoveDown={onMoveDown} onRemove={onRemove} disableUp={index === 0} disableDown={index === total - 1} />
      </div>

      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-foreground">Título</label>
            <Input value={event.title} onChange={(entry) => onChange({ title: entry.target.value })} placeholder="Ex.: Queda da Torre Leste" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Precisão</label>
            <AdaptiveSelect value={event.precision} onValueChange={(value) => onChange({ precision: value })} options={TIMELINE_PRECISION_OPTIONS} placeholder="Selecione" title="Precisão temporal" />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <InputField label="Data" value={event.date} onChange={(value) => onChange({ date: value })} placeholder="AAAA-MM-DD / MM-AAAA / Ano 54" />
          <InputField label="Era personalizada" value={event.eraLabel} onChange={(value) => onChange({ eraLabel: value })} placeholder="Ex.: Segunda Era" />
        </div>

        <TextareaField label="Descrição" value={event.description} onChange={(value) => onChange({ description: value })} />

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Local principal</label>
            <AdaptiveSelect
              value={event.locationId || "none"}
              onValueChange={(value) => onChange({ locationId: value === "none" ? "" : value })}
              options={[{ value: "none", label: "Sem local principal" }, ...locationOptions]}
              placeholder="Selecione"
              title="Local do evento"
            />
          </div>
          <InputField label="Tags" value={(event.tags || []).join(", ")} onChange={(value) => onChange({ tags: normalizeTags(value) })} placeholder="guerra, fundação, perda" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <CrossReferenceChecklist title="Personagens envolvidos" options={characterOptions} value={event.characterIds} onChange={(next) => onChange({ characterIds: next })} />
          <CrossReferenceChecklist title="Capítulos relacionados" options={chapterOptions} value={event.chapterIds} onChange={(next) => onChange({ chapterIds: next })} />
        </div>
      </div>
    </div>
  );
}

export default function AdvancedManuscriptStudio({ structure, onChange }) {
  const [activeTab, setActiveTab] = useState("plot");
  const [selectedMapNodeId, setSelectedMapNodeId] = useState("");
  const [draggingNodeId, setDraggingNodeId] = useState("");

  const characterOptions = useMemo(
    () => (structure.modules.characters.items || []).map((item) => ({ value: item.id, label: item.name || "Personagem sem nome" })),
    [structure.modules.characters.items]
  );
  const locationOptions = useMemo(
    () => (structure.modules.base.locations || []).map((item) => ({ value: item.id, label: item.name || "Local sem nome" })),
    [structure.modules.base.locations]
  );
  const chapterOptions = useMemo(
    () => (structure.modules.plot.chapters || []).map((item) => ({ value: item.id, label: item.title || "Capítulo sem título" })),
    [structure.modules.plot.chapters]
  );
  const eventOptions = useMemo(
    () => sortTimelineEvents(structure.timeline || []).map((item) => ({ value: item.id, label: item.title || "Evento sem título" })),
    [structure.timeline]
  );

  function commit(updater) {
    const draft = cloneStructure(structure);
    updater(draft);
    onChange(draft);
  }

  function moveMapNodeFromPoint(nodeId, clientX, clientY, currentStructure) {
    const canvas = document.getElementById("storyforge-map-canvas");
    const bounds = canvas?.getBoundingClientRect();
    if (!bounds) return;
    const zoom = currentStructure.modules.world.map.zoom || 1;
    const nextX = Math.max(30, Math.min(bounds.width - 30, (clientX - bounds.left) / zoom));
    const nextY = Math.max(30, Math.min(bounds.height - 30, (clientY - bounds.top) / zoom));
    updateMapNode(nodeId, { x: nextX, y: nextY });
  }

  function updateModule(moduleId, updater) {
    commit((draft) => {
      updater(draft.modules[moduleId]);
    });
  }

  function updateBlock(moduleId, blockId, patch) {
    updateModule(moduleId, (module) => {
      const collectionKey = moduleId === "general" ? "references" : "blocks";
      module[collectionKey] = module[collectionKey].map((block) => (block.id === blockId ? { ...block, ...patch } : block));
    });
  }

  function addBlock(moduleId, type = "text") {
    updateModule(moduleId, (module) => {
      const collectionKey = moduleId === "general" ? "references" : "blocks";
      module[collectionKey].push(createEmptyBlock(type));
    });
  }

  function moveBlock(moduleId, fromIndex, toIndex) {
    updateModule(moduleId, (module) => {
      const collectionKey = moduleId === "general" ? "references" : "blocks";
      module[collectionKey] = moveItem(module[collectionKey], fromIndex, toIndex);
    });
  }

  function removeBlock(moduleId, blockId) {
    updateModule(moduleId, (module) => {
      const collectionKey = moduleId === "general" ? "references" : "blocks";
      module[collectionKey] = module[collectionKey].filter((block) => block.id !== blockId);
      if (!module[collectionKey].length && moduleId !== "general") {
        module[collectionKey] = [createEmptyBlock("text")];
      }
    });
  }

  function updateChapter(chapterId, patch) {
    updateModule("plot", (module) => {
      module.chapters = module.chapters.map((chapter) => (chapter.id === chapterId ? { ...chapter, ...patch } : chapter));
    });
  }

  function insertChapter(position = "end", afterId = "") {
    updateModule("plot", (module) => {
      const nextChapter = createEmptyChapter();
      if (position === "start") {
        module.chapters.unshift(nextChapter);
        return;
      }
      if (position === "after") {
        const targetIndex = module.chapters.findIndex((chapter) => chapter.id === afterId);
        if (targetIndex >= 0) {
          module.chapters.splice(targetIndex + 1, 0, nextChapter);
          return;
        }
      }
      module.chapters.push(nextChapter);
    });
  }

  function moveChapter(fromIndex, toIndex) {
    updateModule("plot", (module) => {
      module.chapters = moveItem(module.chapters, fromIndex, toIndex);
    });
  }

  function removeChapter(chapterId) {
    updateModule("plot", (module) => {
      module.chapters = module.chapters.filter((chapter) => chapter.id !== chapterId);
      if (!module.chapters.length) module.chapters = [createEmptyChapter()];
    });
  }

  function updateLocation(locationId, patch) {
    updateModule("base", (module) => {
      module.locations = module.locations.map((location) => (location.id === locationId ? { ...location, ...patch } : location));
    });
  }

  function moveLocation(fromIndex, toIndex) {
    updateModule("base", (module) => {
      module.locations = moveItem(module.locations, fromIndex, toIndex);
    });
  }

  function removeLocation(locationId) {
    commit((draft) => {
      draft.modules.base.locations = draft.modules.base.locations.filter((location) => location.id !== locationId);
      if (!draft.modules.base.locations.length) draft.modules.base.locations = [createEmptyLocation()];
      draft.modules.world.map.nodes = draft.modules.world.map.nodes.map((node) =>
        node.locationId === locationId ? { ...node, locationId: "" } : node
      );
      draft.timeline = draft.timeline.map((event) => (event.locationId === locationId ? { ...event, locationId: "" } : event));
      draft.modules.characters.items = draft.modules.characters.items.map((character) => ({
        ...character,
        linkedLocationIds: (character.linkedLocationIds || []).filter((item) => item !== locationId)
      }));
    });
  }

  function updateCharacter(characterId, patch) {
    updateModule("characters", (module) => {
      module.items = module.items.map((character) => (character.id === characterId ? { ...character, ...patch } : character));
    });
  }

  function moveCharacter(fromIndex, toIndex) {
    updateModule("characters", (module) => {
      module.items = moveItem(module.items, fromIndex, toIndex);
    });
  }

  function removeCharacter(characterId) {
    commit((draft) => {
      draft.modules.characters.items = draft.modules.characters.items.filter((character) => character.id !== characterId);
      if (!draft.modules.characters.items.length) draft.modules.characters.items = [createEmptyCharacter()];
      draft.modules.characters.relations = draft.modules.characters.relations.filter(
        (relation) => relation.fromCharacterId !== characterId && relation.toCharacterId !== characterId
      );
      draft.modules.base.locations = draft.modules.base.locations.map((location) => ({
        ...location,
        characterIds: (location.characterIds || []).filter((item) => item !== characterId)
      }));
      draft.modules.plot.blocks = draft.modules.plot.blocks.map((block) => ({
        ...block,
        linkedCharacterIds: (block.linkedCharacterIds || []).filter((item) => item !== characterId)
      }));
      draft.modules.theme.blocks = draft.modules.theme.blocks.map((block) => ({
        ...block,
        linkedCharacterIds: (block.linkedCharacterIds || []).filter((item) => item !== characterId)
      }));
      draft.modules.world.blocks = draft.modules.world.blocks.map((block) => ({
        ...block,
        linkedCharacterIds: (block.linkedCharacterIds || []).filter((item) => item !== characterId)
      }));
      draft.timeline = draft.timeline.map((event) => ({
        ...event,
        characterIds: (event.characterIds || []).filter((item) => item !== characterId)
      }));
      draft.modules.plot.chapters = draft.modules.plot.chapters.map((chapter) => ({
        ...chapter,
        linkedCharacterIds: (chapter.linkedCharacterIds || []).filter((item) => item !== characterId)
      }));
    });
  }

  function updateRelation(relationId, patch) {
    updateModule("characters", (module) => {
      module.relations = module.relations.map((relation) => (relation.id === relationId ? { ...relation, ...patch } : relation));
    });
  }

  function updateMapNode(nodeId, patch) {
    updateModule("world", (module) => {
      module.map.nodes = module.map.nodes.map((node) => (node.id === nodeId ? { ...node, ...patch } : node));
    });
  }

  function updateMapConnection(connectionId, patch) {
    updateModule("world", (module) => {
      module.map.connections = module.map.connections.map((item) => (item.id === connectionId ? { ...item, ...patch } : item));
    });
  }

  function updateTimelineEvent(eventId, patch) {
    commit((draft) => {
      draft.timeline = draft.timeline.map((entry) => (entry.id === eventId ? { ...entry, ...patch } : entry));
    });
  }

  const sortedTimeline = useMemo(() => sortTimelineEvents(structure.timeline), [structure.timeline]);
  const mapNodes = structure.modules.world.map.nodes || [];
  const mapConnections = structure.modules.world.map.connections || [];
  const selectedNode = mapNodes.find((node) => node.id === selectedMapNodeId) || mapNodes[0] || null;
  const characterNodes = structure.modules.characters.items || [];
  const relationLines = structure.modules.characters.relations || [];

  return (
    <div className="space-y-6 rounded-[2rem] border border-border bg-[linear-gradient(180deg,rgba(132,92,63,0.08),rgba(236,225,208,0.08))] p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Studio do manuscrito</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Estruture plot, mundo, base, personagens, tema e visão geral em um JSON persistente, preparado para expansão e sincronização futura.
          </p>
        </div>
        <div className="rounded-2xl bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
          Template ativo: <span className="font-semibold text-foreground">{structure.templateId || "blank"}</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-3xl bg-card p-2">
          {MANUSCRIPT_MODULES.map((module) => (
            <TabsTrigger key={module.id} value={module.id} className="rounded-2xl px-4 py-2">
              {module.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="plot" className="space-y-6">
          <SectionCard
            title="Plot e blocos narrativos"
            subtitle="Monte a lógica da história com blocos reordenáveis para texto, listas, eventos, capítulos e referências."
            actions={
              <>
                <Button type="button" variant="outline" className="gap-2" onClick={() => addBlock("plot", "text")}>
                  <Plus className="h-4 w-4" />
                  Bloco de texto
                </Button>
                <Button type="button" variant="outline" className="gap-2" onClick={() => addBlock("plot", "event")}>
                  <Plus className="h-4 w-4" />
                  Bloco de evento
                </Button>
                <Button type="button" className="gap-2" onClick={() => insertChapter("end")}>
                  <Plus className="h-4 w-4" />
                  Novo capítulo
                </Button>
              </>
            }
          >
            <div className="space-y-4">
              {(structure.modules.plot.blocks || []).map((block, index, collection) => (
                <BlockEditor
                  key={block.id}
                  block={block}
                  index={index}
                  total={collection.length}
                  characterOptions={characterOptions}
                  locationOptions={locationOptions}
                  eventOptions={eventOptions}
                  onChange={(patch) => updateBlock("plot", block.id, patch)}
                  onMoveUp={() => moveBlock("plot", index, Math.max(0, index - 1))}
                  onMoveDown={() => moveBlock("plot", index, Math.min(collection.length - 1, index + 1))}
                  onRemove={() => removeBlock("plot", block.id)}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Capítulos e subcapítulos"
            subtitle="Insira capítulos no início, ao final ou abaixo de um capítulo existente, com vínculos reais a eventos e personagens."
            actions={
              <>
                <Button type="button" variant="outline" className="gap-2" onClick={() => insertChapter("start")}>
                  <Plus className="h-4 w-4" />
                  Inserir no início
                </Button>
                <Button type="button" className="gap-2" onClick={() => insertChapter("end")}>
                  <Plus className="h-4 w-4" />
                  Inserir ao final
                </Button>
              </>
            }
          >
            <div className="space-y-4">
              {(structure.modules.plot.chapters || []).map((chapter, index, collection) => (
                <ChapterEditor
                  key={chapter.id}
                  chapter={chapter}
                  index={index}
                  total={collection.length}
                  chapterOptions={chapterOptions}
                  eventOptions={eventOptions}
                  characterOptions={characterOptions}
                  onChange={(patch) => updateChapter(chapter.id, patch)}
                  onMoveUp={() => moveChapter(index, Math.max(0, index - 1))}
                  onMoveDown={() => moveChapter(index, Math.min(collection.length - 1, index + 1))}
                  onRemove={() => removeChapter(chapter.id)}
                  onInsertAfter={() => insertChapter("after", chapter.id)}
                />
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="world" className="space-y-6">
          <SectionCard
            title="Mundo e notas de worldbuilding"
            subtitle="Registre regras do universo, eras, sistemas e ideias de ambientação."
            actions={
              <Button type="button" variant="outline" className="gap-2" onClick={() => addBlock("world", "text")}>
                <Plus className="h-4 w-4" />
                Novo bloco
              </Button>
            }
          >
            <div className="space-y-4">
              {(structure.modules.world.blocks || []).map((block, index, collection) => (
                <BlockEditor
                  key={block.id}
                  block={block}
                  index={index}
                  total={collection.length}
                  characterOptions={characterOptions}
                  locationOptions={locationOptions}
                  eventOptions={eventOptions}
                  onChange={(patch) => updateBlock("world", block.id, patch)}
                  onMoveUp={() => moveBlock("world", index, Math.max(0, index - 1))}
                  onMoveDown={() => moveBlock("world", index, Math.min(collection.length - 1, index + 1))}
                  onRemove={() => removeBlock("world", block.id)}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Mapa simples 2D"
            subtitle="Adicione pontos, mova no canvas, conecte locais e mantenha nomes visíveis sem depender de imagens automáticas."
            actions={
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() =>
                    updateModule("world", (module) => {
                      const next = createEmptyMapNode();
                      next.x = 120 + module.map.nodes.length * 24;
                      next.y = 120 + module.map.nodes.length * 18;
                      module.map.nodes.push(next);
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                  Ponto no mapa
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() =>
                    updateModule("world", (module) => {
                      module.map.connections.push(createEmptyMapConnection());
                    })
                  }
                >
                  <Link2 className="h-4 w-4" />
                  Conexão
                </Button>
              </>
            }
          >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
              <div className="rounded-3xl border border-border bg-background/60 p-4">
                <div className="mb-3 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => updateModule("world", (module) => { module.map.zoom = Math.max(0.6, Number((module.map.zoom - 0.1).toFixed(2))); })}>
                    Zoom -
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => updateModule("world", (module) => { module.map.zoom = Math.min(1.8, Number((module.map.zoom + 0.1).toFixed(2))); })}>
                    Zoom +
                  </Button>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">Zoom {Math.round((structure.modules.world.map.zoom || 1) * 100)}%</span>
                </div>
                <div id="storyforge-map-canvas" className="relative h-[420px] overflow-hidden rounded-[28px] border border-border bg-[radial-gradient(circle_at_top,_rgba(92,67,44,0.12),_transparent_38%),linear-gradient(180deg,rgba(248,242,235,0.65),rgba(232,224,210,0.3))]">
                  <svg className="pointer-events-none absolute inset-0 h-full w-full">
                    {mapConnections.map((connection) => {
                      const fromNode = mapNodes.find((node) => node.id === connection.fromNodeId);
                      const toNode = mapNodes.find((node) => node.id === connection.toNodeId);
                      if (!fromNode || !toNode) return null;
                      return (
                        <g key={connection.id}>
                          <line x1={fromNode.x} y1={fromNode.y} x2={toNode.x} y2={toNode.y} className="stroke-[2.5] stroke-stone-500/70" />
                          {connection.label ? (
                            <text x={(fromNode.x + toNode.x) / 2} y={(fromNode.y + toNode.y) / 2 - 6} textAnchor="middle" className="fill-stone-700 text-[11px] font-medium">
                              {connection.label}
                            </text>
                          ) : null}
                        </g>
                      );
                    })}
                  </svg>

                  <div className="absolute inset-0" style={{ transform: `scale(${structure.modules.world.map.zoom || 1})`, transformOrigin: "center" }}>
                    {mapNodes.map((node) => {
                      const meta = getMapNodeMeta(node.type);
                      const attachedLocation = structure.modules.base.locations.find((item) => item.id === node.locationId);
                      const active = (selectedNode?.id || "") === node.id;
                      return (
                        <button
                          key={node.id}
                          type="button"
                          className={cn(
                            "absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border px-3 py-2 text-center shadow-sm transition",
                            active ? "border-amber-500 bg-card shadow-lg" : "border-border bg-card/90"
                          )}
                          style={{ left: node.x, top: node.y }}
                          onMouseDown={() => setDraggingNodeId(node.id)}
                          onMouseUp={() => setDraggingNodeId("")}
                          onMouseLeave={() => setDraggingNodeId("")}
                          onMouseMove={(event) => {
                            if (draggingNodeId !== node.id) return;
                            moveMapNodeFromPoint(node.id, event.clientX, event.clientY, structure);
                          }}
                          onTouchStart={() => setDraggingNodeId(node.id)}
                          onTouchEnd={() => setDraggingNodeId("")}
                          onTouchCancel={() => setDraggingNodeId("")}
                          onTouchMove={(event) => {
                            if (draggingNodeId !== node.id) return;
                            const touch = event.touches[0];
                            if (!touch) return;
                            moveMapNodeFromPoint(node.id, touch.clientX, touch.clientY, structure);
                          }}
                          onClick={() => setSelectedMapNodeId(node.id)}
                        >
                          <div className="text-base leading-none">{meta.icon}</div>
                          <div className="mt-2 text-xs font-semibold text-foreground">{node.name || "Ponto"}</div>
                          {attachedLocation ? <div className="text-[11px] text-muted-foreground">{attachedLocation.name}</div> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-border bg-background/70 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <MapPinned className="h-4 w-4 text-primary" />
                    <h4 className="font-medium text-foreground">Pontos do mapa</h4>
                  </div>
                  {selectedNode ? (
                    <div className="space-y-3">
                      <InputField label="Nome do ponto" value={selectedNode.name} onChange={(value) => updateMapNode(selectedNode.id, { name: value })} />
                      <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">Tipo do ícone</label>
                        <AdaptiveSelect value={selectedNode.type} onValueChange={(value) => updateMapNode(selectedNode.id, { type: value })} options={MAP_NODE_TYPE_OPTIONS} placeholder="Selecione" title="Ícone do mapa" />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">Local associado</label>
                        <AdaptiveSelect
                          value={selectedNode.locationId || "none"}
                          onValueChange={(value) => updateMapNode(selectedNode.id, { locationId: value === "none" ? "" : value })}
                          options={[{ value: "none", label: "Sem local associado" }, ...locationOptions]}
                          placeholder="Selecione"
                          title="Associar local"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full text-destructive"
                        onClick={() =>
                          updateModule("world", (module) => {
                            module.map.nodes = module.map.nodes.filter((item) => item.id !== selectedNode.id);
                            module.map.connections = module.map.connections.filter(
                              (item) => item.fromNodeId !== selectedNode.id && item.toNodeId !== selectedNode.id
                            );
                          })
                        }
                      >
                        Remover ponto
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Selecione um ponto no mapa para editar seus dados.</p>
                  )}
                </div>

                <div className="rounded-3xl border border-border bg-background/70 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-primary" />
                    <h4 className="font-medium text-foreground">Conexões</h4>
                  </div>
                  <div className="space-y-3">
                    {mapConnections.length ? (
                      mapConnections.map((connection) => (
                        <div key={connection.id} className="rounded-2xl border border-border p-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-sm font-medium text-foreground">De</label>
                              <AdaptiveSelect
                                value={connection.fromNodeId || "none"}
                                onValueChange={(value) => updateMapConnection(connection.id, { fromNodeId: value === "none" ? "" : value })}
                                options={[{ value: "none", label: "Selecione" }, ...mapNodes.map((node) => ({ value: node.id, label: node.name || "Ponto" }))]}
                                placeholder="Selecione"
                                title="Origem da conexão"
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-sm font-medium text-foreground">Para</label>
                              <AdaptiveSelect
                                value={connection.toNodeId || "none"}
                                onValueChange={(value) => updateMapConnection(connection.id, { toNodeId: value === "none" ? "" : value })}
                                options={[{ value: "none", label: "Selecione" }, ...mapNodes.map((node) => ({ value: node.id, label: node.name || "Ponto" }))]}
                                placeholder="Selecione"
                                title="Destino da conexão"
                              />
                            </div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Input value={connection.label || ""} onChange={(event) => updateMapConnection(connection.id, { label: event.target.value })} placeholder="Rótulo da linha" />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 text-destructive"
                              onClick={() =>
                                updateModule("world", (module) => {
                                  module.map.connections = module.map.connections.filter((item) => item.id !== connection.id);
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Adicione conexões para marcar estradas, fronteiras ou vínculos narrativos entre os locais.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Linha do tempo global"
            subtitle="Crie eventos com data, era, personagens, local, tags e capítulos relacionados."
            actions={
              <Button type="button" className="gap-2" onClick={() => commit((draft) => { draft.timeline.push(createEmptyTimelineEvent()); })}>
                <Plus className="h-4 w-4" />
                Novo evento
              </Button>
            }
          >
            <div className="mb-4 grid gap-3 rounded-3xl border border-border bg-background/60 p-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-border bg-card px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total de eventos</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{structure.timeline.length}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Personagens citados</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{new Set(structure.timeline.flatMap((item) => item.characterIds || [])).size}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Locais citados</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{new Set(structure.timeline.map((item) => item.locationId).filter(Boolean)).size}</p>
              </div>
            </div>
            <div className="space-y-4">
              {sortedTimeline.map((event, index, collection) => (
                <TimelineEventEditor
                  key={event.id}
                  event={event}
                  index={index}
                  total={collection.length}
                  chapterOptions={chapterOptions}
                  characterOptions={characterOptions}
                  locationOptions={locationOptions}
                  onChange={(patch) => updateTimelineEvent(event.id, patch)}
                  onMoveUp={() =>
                    commit((draft) => {
                      const currentIndex = draft.timeline.findIndex((entry) => entry.id === event.id);
                      draft.timeline = moveItem(draft.timeline, currentIndex, Math.max(0, currentIndex - 1));
                    })
                  }
                  onMoveDown={() =>
                    commit((draft) => {
                      const currentIndex = draft.timeline.findIndex((entry) => entry.id === event.id);
                      draft.timeline = moveItem(draft.timeline, currentIndex, Math.min(draft.timeline.length - 1, currentIndex + 1));
                    })
                  }
                  onRemove={() => commit((draft) => { draft.timeline = draft.timeline.filter((entry) => entry.id !== event.id); if (!draft.timeline.length) draft.timeline = [createEmptyTimelineEvent()]; })}
                />
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="base" className="space-y-6">
          <SectionCard
            title="Base e locais"
            subtitle="Documente países, cidades, bases e outras áreas relevantes com tags, descrição, simbolismo e conexão com personagens."
            actions={
              <Button type="button" className="gap-2" onClick={() => updateModule("base", (module) => { module.locations.push(createEmptyLocation()); })}>
                <Plus className="h-4 w-4" />
                Novo local
              </Button>
            }
          >
            <div className="space-y-4">
              {(structure.modules.base.locations || []).map((location, index, collection) => (
                <LocationEditor
                  key={location.id}
                  location={location}
                  index={index}
                  total={collection.length}
                  characterOptions={characterOptions}
                  onChange={(patch) => updateLocation(location.id, patch)}
                  onMoveUp={() => moveLocation(index, Math.max(0, index - 1))}
                  onMoveDown={() => moveLocation(index, Math.min(collection.length - 1, index + 1))}
                  onRemove={() => removeLocation(location.id)}
                />
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="characters" className="space-y-6">
          <SectionCard
            title="Personagens avançados"
            subtitle="Cadastre ficha detalhada, arco, vida social, aparência, psicologia e conexões com capítulos e locais."
            actions={
              <Button type="button" className="gap-2" onClick={() => updateModule("characters", (module) => { module.items.push(createEmptyCharacter()); })}>
                <Plus className="h-4 w-4" />
                Novo personagem
              </Button>
            }
          >
            <div className="space-y-4">
              {(structure.modules.characters.items || []).map((character, index, collection) => (
                <CharacterEditor
                  key={character.id}
                  character={character}
                  index={index}
                  total={collection.length}
                  chapterOptions={chapterOptions}
                  locationOptions={locationOptions}
                  onChange={(patch) => updateCharacter(character.id, patch)}
                  onMoveUp={() => moveCharacter(index, Math.max(0, index - 1))}
                  onMoveDown={() => moveCharacter(index, Math.min(collection.length - 1, index + 1))}
                  onRemove={() => removeCharacter(character.id)}
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Relações entre personagens"
            subtitle="Defina o vínculo entre pares e mantenha um diagrama simples para leitura rápida."
            actions={
              <Button type="button" variant="outline" className="gap-2" onClick={() => updateModule("characters", (module) => { module.relations.push(createEmptyRelation()); })}>
                <Plus className="h-4 w-4" />
                Nova relação
              </Button>
            }
          >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
              <div className="space-y-3">
                {(structure.modules.characters.relations || []).length ? (
                  structure.modules.characters.relations.map((relation) => (
                    <div key={relation.id} className="rounded-2xl border border-border bg-background/70 p-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-foreground">Origem</label>
                          <AdaptiveSelect
                            value={relation.fromCharacterId || "none"}
                            onValueChange={(value) => updateRelation(relation.id, { fromCharacterId: value === "none" ? "" : value })}
                            options={[{ value: "none", label: "Selecione" }, ...characterOptions]}
                            placeholder="Selecione"
                            title="Origem"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-foreground">Destino</label>
                          <AdaptiveSelect
                            value={relation.toCharacterId || "none"}
                            onValueChange={(value) => updateRelation(relation.id, { toCharacterId: value === "none" ? "" : value })}
                            options={[{ value: "none", label: "Selecione" }, ...characterOptions]}
                            placeholder="Selecione"
                            title="Destino"
                          />
                        </div>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-[1fr,180px,auto]">
                        <Input value={relation.label || ""} onChange={(event) => updateRelation(relation.id, { label: event.target.value })} placeholder="Ex.: rivalidade, respeito, dívida" />
                        <AdaptiveSelect
                          value={relation.weight || "neutral"}
                          onValueChange={(value) => updateRelation(relation.id, { weight: value })}
                          options={[
                            { value: "support", label: "Apoio" },
                            { value: "conflict", label: "Conflito" },
                            { value: "romance", label: "Afeto / romance" },
                            { value: "neutral", label: "Neutro" }
                          ]}
                          placeholder="Peso"
                          title="Tipo de relação"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 text-destructive"
                          onClick={() => updateModule("characters", (module) => { module.relations = module.relations.filter((entry) => entry.id !== relation.id); })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Ainda não há relações. Crie ligações para registrar respeito, rivalidade, romance ou alianças narrativas.</p>
                )}
              </div>

              <div className="rounded-3xl border border-border bg-background/70 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h4 className="font-medium text-foreground">Diagrama simples</h4>
                </div>
                <svg viewBox="0 0 320 360" className="h-[360px] w-full rounded-2xl border border-border bg-card">
                  {relationLines.map((relation) => {
                    const fromIndex = characterNodes.findIndex((character) => character.id === relation.fromCharacterId);
                    const toIndex = characterNodes.findIndex((character) => character.id === relation.toCharacterId);
                    if (fromIndex < 0 || toIndex < 0) return null;
                    const fromX = 70;
                    const toX = 250;
                    const fromY = 55 + fromIndex * 72;
                    const toY = 55 + toIndex * 72;
                    return (
                      <g key={relation.id}>
                        <line x1={fromX + 48} y1={fromY} x2={toX - 48} y2={toY} className={cn("stroke-[2.5]", renderRelationColor(relation.weight))} />
                        {relation.label ? (
                          <text x={(fromX + toX) / 2} y={(fromY + toY) / 2 - 4} textAnchor="middle" className="fill-slate-600 text-[11px] font-medium">
                            {relation.label}
                          </text>
                        ) : null}
                      </g>
                    );
                  })}
                  {characterNodes.map((character, index) => {
                    const x = index % 2 === 0 ? 70 : 250;
                    const y = 55 + index * 36;
                    return (
                      <g key={character.id}>
                        <circle cx={x} cy={y} r={28} className="fill-[#f1e8dc] stroke-[#8a6a4a] stroke-[2]" />
                        <text x={x} y={y - 2} textAnchor="middle" className="fill-[#3e2f20] text-[11px] font-semibold">
                          {(character.name || "P").slice(0, 10)}
                        </text>
                        <text x={x} y={y + 14} textAnchor="middle" className="fill-slate-500 text-[9px]">
                          {CHARACTER_CATEGORY_OPTIONS.find((item) => item.value === character.category)?.label?.replace("Personagem ", "") || "Outro"}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="theme" className="space-y-6">
          <SectionCard
            title="Tema, mensagem e símbolos"
            subtitle="Use blocos para tese emocional, símbolos recorrentes, perguntas centrais e frases-chave."
            actions={
              <Button type="button" variant="outline" className="gap-2" onClick={() => addBlock("theme", "text")}>
                <Plus className="h-4 w-4" />
                Novo bloco temático
              </Button>
            }
          >
            <div className="space-y-4">
              {(structure.modules.theme.blocks || []).map((block, index, collection) => (
                <BlockEditor
                  key={block.id}
                  block={block}
                  index={index}
                  total={collection.length}
                  characterOptions={characterOptions}
                  locationOptions={locationOptions}
                  eventOptions={eventOptions}
                  onChange={(patch) => updateBlock("theme", block.id, patch)}
                  onMoveUp={() => moveBlock("theme", index, Math.max(0, index - 1))}
                  onMoveDown={() => moveBlock("theme", index, Math.min(collection.length - 1, index + 1))}
                  onRemove={() => removeBlock("theme", block.id)}
                />
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <SectionCard title="Visão geral do manuscrito" subtitle="Centralize resumo, público, notas gerais, palavras-chave e referências cruzadas.">
            <div className="grid gap-4 lg:grid-cols-2">
              <TextareaField label="Sinopse" value={structure.modules.general.synopsis} onChange={(value) => updateModule("general", (module) => { module.synopsis = value; })} placeholder="Resumo curto da obra" />
              <TextareaField label="Público / intenção" value={structure.modules.general.audience} onChange={(value) => updateModule("general", (module) => { module.audience = value; })} placeholder="Para quem essa história foi pensada?" />
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
              <TextareaField label="Notas gerais" value={structure.modules.general.notes} onChange={(value) => updateModule("general", (module) => { module.notes = value; })} placeholder="Decisões globais, restrições, pendências..." />
              <InputField label="Tags gerais" value={(structure.modules.general.tags || []).join(", ")} onChange={(value) => updateModule("general", (module) => { module.tags = normalizeTags(value); })} placeholder="fantasia, jornada, trauma" />
            </div>
          </SectionCard>

          <SectionCard
            title="Referências e navegação cruzada"
            subtitle="Referências rápidas para capítulos, eventos, imagens, artigos ou notas úteis do projeto."
            actions={
              <Button type="button" variant="outline" className="gap-2" onClick={() => addBlock("general", "reference")}>
                <Plus className="h-4 w-4" />
                Nova referência
              </Button>
            }
          >
            <div className="space-y-4">
              {(structure.modules.general.references || []).map((block, index, collection) => (
                <BlockEditor
                  key={block.id}
                  block={block}
                  index={index}
                  total={collection.length}
                  characterOptions={characterOptions}
                  locationOptions={locationOptions}
                  eventOptions={eventOptions}
                  onChange={(patch) => updateBlock("general", block.id, patch)}
                  onMoveUp={() => moveBlock("general", index, Math.max(0, index - 1))}
                  onMoveDown={() => moveBlock("general", index, Math.min(collection.length - 1, index + 1))}
                  onRemove={() => removeBlock("general", block.id)}
                />
              ))}
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
