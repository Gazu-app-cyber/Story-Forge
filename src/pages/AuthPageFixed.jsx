import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, PenTool, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EMPTY_ERRORS = {
  display_name: "",
  email: "",
  password: ""
};

export default function AuthPageFixed() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState(EMPTY_ERRORS);
  const [form, setForm] = useState({
    display_name: "",
    email: "",
    password: ""
  });

  function updateField(field, value) {
    setSubmitError("");
    setFieldErrors((current) => ({ ...current, [field]: "" }));
    setForm((current) => ({ ...current, [field]: value }));
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setSubmitError("");
    setFieldErrors(EMPTY_ERRORS);
  }

  function validateForm() {
    const email = form.email.trim();
    const password = form.password.trim();
    const displayName = form.display_name.trim();
    const nextErrors = { ...EMPTY_ERRORS };

    if (mode === "register" && !displayName) {
      nextErrors.display_name = "Informe seu nome para criar a conta.";
    }

    if (!email) {
      nextErrors.email = "Informe seu email.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      nextErrors.email = "Informe um email válido.";
    }

    if (!password) {
      nextErrors.password = "Informe sua senha.";
    } else if (mode === "register" && password.length < 6) {
      nextErrors.password = "A senha precisa ter pelo menos 6 caracteres.";
    }

    setFieldErrors(nextErrors);
    return nextErrors.display_name || nextErrors.email || nextErrors.password || "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");

    const validationMessage = validateForm();
    if (validationMessage) {
      setSubmitError(validationMessage);
      toast.error(validationMessage);
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login({ email: form.email.trim(), password: form.password });
        toast.success("Sessão iniciada.");
      } else {
        await register({
          display_name: form.display_name.trim(),
          email: form.email.trim(),
          password: form.password
        });
        toast.success("Conta criada com sucesso.");
      }

      setFieldErrors(EMPTY_ERRORS);
      navigate("/");
    } catch (error) {
      const message = error?.message || "Não foi possível continuar.";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(80,109,184,0.16),_transparent_38%),linear-gradient(180deg,_#f6f8fb_0%,_#eef3fb_100%)] px-6 py-12">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.8),transparent_42%,rgba(80,109,184,0.08))]" />
      <div className="relative w-full max-w-xl rounded-[32px] border border-slate-200/80 bg-white/95 p-8 shadow-[0_30px_80px_rgba(28,42,74,0.12)] backdrop-blur">
        <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-slate-900 shadow-[0_18px_50px_rgba(15,23,42,0.16)]">
          <PenTool className="h-12 w-12 text-amber-400" strokeWidth={1.8} />
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-slate-900">Welcome to StoryForge</h1>
          <p className="mt-4 text-xl text-slate-500">{mode === "login" ? "Sign in to continue" : "Create your account"}</p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${mode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
          >
            Sign up
          </button>
        </div>

        <form id="auth-form" className="space-y-5" onSubmit={handleSubmit} noValidate>
          {mode === "register" ? (
            <label className="block">
              <span className="mb-2 block text-center text-sm font-semibold text-slate-700">Name</span>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  name="display_name"
                  autoComplete="name"
                  value={form.display_name}
                  onChange={(event) => updateField("display_name", event.target.value)}
                  placeholder="Your name"
                  aria-invalid={Boolean(fieldErrors.display_name)}
                  className="h-14 rounded-2xl border-slate-200 pl-12 text-base"
                />
              </div>
              {fieldErrors.display_name ? <p className="mt-2 text-sm font-medium text-destructive">{fieldErrors.display_name}</p> : null}
            </label>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-center text-sm font-semibold text-slate-700">Email</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="you@example.com"
                aria-invalid={Boolean(fieldErrors.email)}
                className="h-14 rounded-2xl border-slate-200 pl-12 text-base"
              />
            </div>
            {fieldErrors.email ? <p className="mt-2 text-sm font-medium text-destructive">{fieldErrors.email}</p> : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-center text-sm font-semibold text-slate-700">Password</span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                placeholder={mode === "login" ? "Enter your password" : "Create a password"}
                aria-invalid={Boolean(fieldErrors.password)}
                className="h-14 rounded-2xl border-slate-200 pl-12 pr-12 text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {fieldErrors.password ? <p className="mt-2 text-sm font-medium text-destructive">{fieldErrors.password}</p> : null}
          </label>

          {submitError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
              {submitError}
            </div>
          ) : null}

          <Button type="submit" form="auth-form" disabled={loading} className="h-14 w-full rounded-2xl bg-slate-900 text-base font-semibold hover:bg-slate-800">
            {loading ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          Demo local: <span className="font-semibold text-slate-700">demo@storyforge.app</span> /{" "}
          <span className="font-semibold text-slate-700">storyforge</span>
        </div>
      </div>
    </div>
  );
}
