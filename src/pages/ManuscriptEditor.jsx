import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactQuill, { Quill } from "react-quill";
import moment from "moment";
import "moment/locale/pt-br";
import { ArrowLeft, BookOpen, Check, Clock, Eraser, Loader2, Pencil, Redo2, Star, Trash2, Undo2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { getTypeColor, getTypeIcon } from "@/lib/manuscriptTypes";
import { cn } from "@/lib/utils";
import "@/lib/theme";

moment.locale("pt-br");

const Font = Quill.import("formats/font");
Font.whitelist = ["crimson", "merriweather", "lora", "source-serif", "inter"];
Quill.register(Font, true);

const Size = Quill.import("attributors/style/size");
Size.whitelist = ["14px", "16px", "18px", "20px", "24px", "30px"];
Quill.register(Size, true);

const quillModules = {
  toolbar: {
    container: [
      [{ font: Font.whitelist }],
      [{ size: Size.whitelist }],
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline"],
      [{ align: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ color: [] }, { background: [] }],
      ["link"],
      ["clean"],
      ["undo", "redo"]
    ],
    handlers: {
      undo() {
        this.quill.history.undo();
      },
      redo() {
        this.quill.history.redo();
      }
    }
  },
  history: {
    delay: 600,
    maxStack: 200,
    userOnly: true
  }
};

const quillFormats = ["font", "size", "header", "bold", "italic", "underline", "align", "list", "bullet", "color", "background", "link"];

const editorFonts = {
  "'Crimson Pro', serif": "crimson",
  "'Merriweather', serif": "merriweather",
  "'Lora', serif": "lora",
  "'Source Serif 4', serif": "source-serif",
  "'Inter', sans-serif": "inter"
};

function countWords(html) {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean).length;
}

export default function ManuscriptEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const quillRef = useRef(null);
  const saveTimeout = useRef(null);
  const nameInputRef = useRef(null);

  const [manuscript, setManuscript] = useState(null);
  const [project, setProject] = useState(null);
  const [content, setContent] = useState("");
  const [name, setName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingState, setSavingState] = useState("idle");
  const [showDelete, setShowDelete] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [manuscriptList, currentUser] = await Promise.all([base44.entities.Manuscript.filter({ id }), base44.auth.me()]);
        const currentManuscript = manuscriptList[0];
        if (currentManuscript) {
          setManuscript(currentManuscript);
          setContent(currentManuscript.content || "");
          setName(currentManuscript.name);
          setUser(currentUser);
          const projectList = await base44.entities.Project.filter({ id: currentManuscript.project_id });
          setProject(projectList[0]);
        }
      } catch (error) {
        console.error("Failed to load manuscript editor", error);
        setManuscript(null);
        setProject(null);
      } finally {
        setLoading(false);
      }
    }

    loadData();
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [id]);

  const editorFont = user?.font_family || "'Crimson Pro', serif";
  const editorSize = user?.font_size || 18;
  const quillFontClass = editorFonts[editorFont] || "crimson";

  const saveContent = useCallback(
    async (newContent) => {
      setSavingState("saving");
      await base44.entities.Manuscript.update(id, { content: newContent });
      setSavingState("saved");
      setTimeout(() => setSavingState("idle"), 2500);
    },
    [id]
  );

  function handleContentChange(value) {
    setContent(value);
    setSavingState("saving");
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => saveContent(value), 1200);
  }

  async function handleNameSave() {
    setEditingName(false);
    if (name.trim() && name.trim() !== manuscript.name) {
      await base44.entities.Manuscript.update(id, { name: name.trim() });
      setManuscript((current) => ({ ...current, name: name.trim() }));
    } else {
      setName(manuscript.name);
    }
  }

  async function handleToggleFavorite() {
    const nextFavorite = !manuscript.is_favorite;
    await base44.entities.Manuscript.update(id, { is_favorite: nextFavorite });
    setManuscript((current) => ({ ...current, is_favorite: nextFavorite }));
  }

  async function handleDelete() {
    await base44.entities.Manuscript.delete(id);
    navigate(`/project/${manuscript.project_id}`);
  }

  function runEditorCommand(command) {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    if (command === "undo") editor.history.undo();
    if (command === "redo") editor.history.redo();
    if (command === "clean") {
      const range = editor.getSelection();
      if (range) editor.removeFormat(range.index, range.length);
    }
  }

  const stats = useMemo(() => ({ words: countWords(content), chars: content.replace(/<[^>]*>/g, "").length }), [content]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!manuscript) return null;

  const TypeIcon = getTypeIcon(manuscript.type);
  const typeColor = getTypeColor(manuscript.type);

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md" style={{ paddingTop: "var(--safe-top)" }}>
        <div className="flex items-center gap-3 px-3 py-3 sm:px-4">
          <Link to={`/project/${manuscript.project_id}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Link>

          <div className="min-w-0 flex-1">
            {project ? (
              <p className="mb-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                <BookOpen className="h-3 w-3" />
                {project.name}
              </p>
            ) : null}
            <div className="flex items-center gap-2">
              {editingName ? (
                <input
                  ref={nameInputRef}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={(event) => event.key === "Enter" && handleNameSave()}
                  className="min-w-0 max-w-xs flex-1 border-b border-primary bg-transparent text-sm font-semibold text-foreground outline-none"
                  autoFocus
                />
              ) : (
                <button onClick={() => setEditingName(true)} className="group flex items-center gap-1.5 text-sm font-semibold text-foreground transition-colors hover:text-primary">
                  <span className="max-w-[180px] truncate sm:max-w-xs">{manuscript.name}</span>
                  <Pencil className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              )}
              <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", typeColor)}>
                <TypeIcon className="h-2.5 w-2.5" />
                {manuscript.type}
              </span>
            </div>
          </div>

          <div className="hidden items-center gap-2 text-[11px] text-muted-foreground sm:flex">
            {savingState === "saving" ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Salvando
              </>
            ) : null}
            {savingState === "saved" ? (
              <>
                <Check className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Salvo</span>
              </>
            ) : null}
            {savingState === "idle" && manuscript.updated_date ? (
              <>
                <Clock className="h-3 w-3" />
                {moment(manuscript.updated_date).fromNow()}
              </>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button onClick={handleToggleFavorite} className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-muted">
              <Star className={cn("h-4 w-4", manuscript.is_favorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
            </button>
            <button onClick={() => setShowDelete(true)} className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-destructive/10">
              <Trash2 className="h-4 w-4 text-muted-foreground transition-colors hover:text-destructive" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-3">
              <span>{stats.words} palavras</span>
              <span>{stats.chars} caracteres</span>
              <span>Fonte {editorSize}px</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => runEditorCommand("undo")}>
                <Undo2 className="h-3.5 w-3.5" />
                Desfazer
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => runEditorCommand("redo")}>
                <Redo2 className="h-3.5 w-3.5" />
                Refazer
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => runEditorCommand("clean")}>
                <Eraser className="h-3.5 w-3.5" />
                Limpar
              </Button>
            </div>
          </div>

          <style>{`
            .writer-editor .ql-editor {
              font-family: ${editorFont};
              font-size: ${editorSize}px;
            }
            .writer-editor .ql-editor p {
              margin-bottom: 0.8em;
            }
            .writer-editor .ql-editor h1 {
              font-size: 2em;
              font-weight: 700;
              margin-bottom: 0.5em;
            }
            .writer-editor .ql-editor h2 {
              font-size: 1.5em;
              font-weight: 600;
              margin-bottom: 0.5em;
            }
            .writer-editor .ql-editor h3 {
              font-size: 1.2em;
              font-weight: 600;
              margin-bottom: 0.5em;
            }
            .writer-editor .ql-editor blockquote {
              border-left: 3px solid hsl(var(--primary));
              color: hsl(var(--muted-foreground));
              font-style: italic;
              margin: 1rem 0;
              padding-left: 1rem;
            }
            .ql-font-crimson { font-family: 'Crimson Pro', serif; }
            .ql-font-merriweather { font-family: 'Merriweather', serif; }
            .ql-font-lora { font-family: 'Lora', serif; }
            .ql-font-source-serif { font-family: 'Source Serif 4', serif; }
            .ql-font-inter { font-family: 'Inter', sans-serif; }
          `}</style>

          <div className="writer-editor overflow-hidden rounded-[1.25rem] border border-border bg-card shadow-sm">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={content}
              onChange={handleContentChange}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Comece a escrever sua história..."
              className={cn("min-h-[70vh]", `font-${quillFontClass}`)}
            />
          </div>

          <div className="mt-3 flex justify-end text-[11px] tabular-nums text-muted-foreground">{stats.words} palavras</div>
        </div>
      </div>

      <ConfirmDialog open={showDelete} onOpenChange={setShowDelete} title="Excluir manuscrito?" description="Esta ação não pode ser desfeita." onConfirm={handleDelete} destructive />
    </div>
  );
}
