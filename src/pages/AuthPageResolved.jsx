import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, Lock, Mail, PenTool, UserRound } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EMPTY_ERRORS = {
  display_name: "",
  email: "",
  password: "",
  confirm_password: ""
};

const EMPTY_FORM = {
  display_name: "",
  email: "",
  password: "",
  confirm_password: ""
};

function isValidEmail(value) {
  return /\S+@\S+\.\S+/.test(value);
}

export default function AuthPageResolved() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register, resendVerificationEmail, requestPasswordReset, resetPassword, verifyEmail } = useAuth();
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState(EMPTY_ERRORS);
  const [form, setForm] = useState(EMPTY_FORM);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [deliveryState, setDeliveryState] = useState(null);
  const [verificationState, setVerificationState] = useState(null);
  const processedTokenRef = useRef("");

  const action = searchParams.get("action") || "";
  const isVerificationScreen = action === "verify-email";
  const isPasswordResetScreen = action === "reset-password";

  const activeTitle = useMemo(() => {
    if (isVerificationScreen) return "Verify your email";
    if (isPasswordResetScreen) return "Create a new password";
    return "Welcome to StoryForge";
  }, [isPasswordResetScreen, isVerificationScreen]);

  const activeSubtitle = useMemo(() => {
    if (isVerificationScreen) return "We are validating your access link";
    if (isPasswordResetScreen) return "Choose a new password to recover your access";
    return mode === "login" ? "Sign in to continue" : "Create your account";
  }, [isPasswordResetScreen, isVerificationScreen, mode]);

  useEffect(() => {
    if (!isVerificationScreen || processedTokenRef.current === action) return;

    processedTokenRef.current = action;
    setLoading(true);
    setVerificationState({ status: "loading", message: "Verificando seu email..." });

    verifyEmail()
      .then((result) => {
        setVerificationState({ status: "success", message: result.message });
        toast.success(result.message);
      })
      .catch((error) => {
        const message = error?.message || "Nao foi possivel verificar o email.";
        setVerificationState({ status: "error", message });
        toast.error(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [action, isVerificationScreen, verifyEmail]);

  function clearSensitiveFields() {
    setForm((current) => ({
      ...current,
      password: "",
      confirm_password: ""
    }));
  }

  function updateField(field, value) {
    setSubmitError("");
    setFieldErrors((current) => ({ ...current, [field]: "" }));
    setForm((current) => ({ ...current, [field]: value }));
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setSubmitError("");
    setFieldErrors(EMPTY_ERRORS);
    setForgotPasswordOpen(false);
    clearSensitiveFields();
  }

  function validateAuthForm() {
    const email = form.email.trim();
    const password = form.password;
    const displayName = form.display_name.trim();
    const confirmation = form.confirm_password;
    const nextErrors = { ...EMPTY_ERRORS };

    if (mode === "register" && !displayName) {
      nextErrors.display_name = "Informe seu nome para criar a conta.";
    }

    if (!email) {
      nextErrors.email = "Informe seu email.";
    } else if (!isValidEmail(email)) {
      nextErrors.email = "Informe um email valido.";
    }

    if (!password) {
      nextErrors.password = "Informe sua senha.";
    } else if (mode === "register" && password.length < 6) {
      nextErrors.password = "A senha precisa ter pelo menos 6 caracteres.";
    }

    if (mode === "register" && !confirmation) {
      nextErrors.confirm_password = "Confirme sua senha.";
    } else if (mode === "register" && password !== confirmation) {
      nextErrors.confirm_password = "As senhas precisam ser exatamente iguais.";
    }

    setFieldErrors(nextErrors);
    return Object.values(nextErrors).find(Boolean) || "";
  }

  function validateResetForm() {
    const nextErrors = { ...EMPTY_ERRORS };

    if (!form.password) {
      nextErrors.password = "Informe a nova senha.";
    } else if (form.password.length < 6) {
      nextErrors.password = "A nova senha precisa ter pelo menos 6 caracteres.";
    }

    if (!form.confirm_password) {
      nextErrors.confirm_password = "Confirme a nova senha.";
    } else if (form.password !== form.confirm_password) {
      nextErrors.confirm_password = "As senhas precisam ser exatamente iguais.";
    }

    setFieldErrors(nextErrors);
    return Object.values(nextErrors).find(Boolean) || "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");
    setDeliveryState(null);

    const validationMessage = validateAuthForm();
    if (validationMessage) {
      setSubmitError(validationMessage);
      toast.error(validationMessage);
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login({ email: form.email.trim(), password: form.password });
        clearSensitiveFields();
        toast.success("Sessao iniciada.");
        navigate("/");
        return;
      }

      const result = await register({
        display_name: form.display_name.trim(),
        email: form.email.trim(),
        password: form.password
      });

      clearSensitiveFields();
      setMode("login");
      setDeliveryState(result);
      setSubmitError("");
      toast.success(result.message);
    } catch (error) {
      const message = error?.message || "Nao foi possivel continuar.";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    setLoading(true);
    try {
      const result = await resendVerificationEmail(form.email.trim());
      setDeliveryState(result);
      setSubmitError("");
      toast.success(result.message);
    } catch (error) {
      const message = error?.message || "Nao foi possivel reenviar a verificacao.";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPasswordSubmit(event) {
    event.preventDefault();
    setSubmitError("");

    const email = form.email.trim();
    if (!email) {
      setFieldErrors((current) => ({ ...current, email: "Informe seu email para recuperar a senha." }));
      return;
    }

    if (!isValidEmail(email)) {
      setFieldErrors((current) => ({ ...current, email: "Informe um email valido." }));
      return;
    }

    setLoading(true);
    try {
      const result = await requestPasswordReset(email);
      setDeliveryState(result);
      setForgotPasswordOpen(false);
      toast.success(result.message);
    } catch (error) {
      const message = error?.message || "Nao foi possivel enviar a recuperacao.";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset(event) {
    event.preventDefault();
    setSubmitError("");

    const validationMessage = validateResetForm();
    if (validationMessage) {
      setSubmitError(validationMessage);
      toast.error(validationMessage);
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword("", form.password);
      clearSensitiveFields();
      toast.success(result.message);
      navigate("/auth");
    } catch (error) {
      const message = error?.message || "Nao foi possivel redefinir a senha.";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function renderDeliveryCard() {
    if (!deliveryState?.message) return null;

    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
        <p className="font-semibold">{deliveryState.message}</p>
        <p className="mt-2 text-emerald-800">
          Confira sua caixa de entrada e também a pasta de spam. Se estiver no celular, você pode abrir o link no navegador do próprio aparelho.
        </p>
      </div>
    );
  }

  function renderVerificationScreen() {
    return (
      <div className="space-y-5">
        <div
          className={`rounded-2xl px-4 py-4 text-sm font-medium ${
            verificationState?.status === "error"
              ? "border border-destructive/20 bg-destructive/5 text-destructive"
              : "border border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          {verificationState?.message || "Verificando seu email..."}
        </div>
        <Button type="button" className="h-14 w-full rounded-2xl bg-slate-900" onClick={() => navigate("/auth")}>
          Ir para o login
        </Button>
      </div>
    );
  }

  function renderPasswordResetScreen() {
    return (
      <form className="space-y-5" onSubmit={handlePasswordReset} noValidate>
        <label className="block">
          <span className="mb-2 block text-center text-sm font-semibold text-slate-700">Nova senha</span>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="Digite a nova senha"
              aria-invalid={Boolean(fieldErrors.password)}
              className="h-14 rounded-2xl border-slate-200 pl-12 pr-12 text-base"
            />
            <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {fieldErrors.password ? <p className="mt-2 text-sm font-medium text-destructive">{fieldErrors.password}</p> : null}
        </label>

        <label className="block">
          <span className="mb-2 block text-center text-sm font-semibold text-slate-700">Confirmar nova senha</span>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              name="confirm_password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.confirm_password}
              onChange={(event) => updateField("confirm_password", event.target.value)}
              placeholder="Repita a nova senha"
              aria-invalid={Boolean(fieldErrors.confirm_password)}
              className="h-14 rounded-2xl border-slate-200 pl-12 pr-12 text-base"
            />
            <button type="button" onClick={() => setShowConfirmPassword((current) => !current)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {fieldErrors.confirm_password ? <p className="mt-2 text-sm font-medium text-destructive">{fieldErrors.confirm_password}</p> : null}
        </label>

        {submitError ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
            {submitError}
          </div>
        ) : null}

        <Button type="submit" disabled={loading} className="h-14 w-full rounded-2xl bg-slate-900 text-base font-semibold hover:bg-slate-800">
          {loading ? "Salvando..." : "Salvar nova senha"}
        </Button>
      </form>
    );
  }

  function renderAuthForm() {
    return (
      <>
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
              <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {fieldErrors.password ? <p className="mt-2 text-sm font-medium text-destructive">{fieldErrors.password}</p> : null}
          </label>

          {mode === "register" ? (
            <label className="block">
              <span className="mb-2 block text-center text-sm font-semibold text-slate-700">Confirm password</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  name="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.confirm_password}
                  onChange={(event) => updateField("confirm_password", event.target.value)}
                  placeholder="Repeat your password"
                  aria-invalid={Boolean(fieldErrors.confirm_password)}
                  className="h-14 rounded-2xl border-slate-200 pl-12 pr-12 text-base"
                />
                <button type="button" onClick={() => setShowConfirmPassword((current) => !current)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {fieldErrors.confirm_password ? <p className="mt-2 text-sm font-medium text-destructive">{fieldErrors.confirm_password}</p> : null}
            </label>
          ) : null}

          {submitError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
              {submitError}
            </div>
          ) : null}

          {renderDeliveryCard()}

          <Button type="submit" form="auth-form" disabled={loading} className="h-14 w-full rounded-2xl bg-slate-900 text-base font-semibold hover:bg-slate-800">
            {loading ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
          </Button>

          {mode === "login" ? (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setForgotPasswordOpen((current) => !current)}
                className="text-sm font-medium text-slate-500 underline-offset-4 hover:text-slate-800 hover:underline"
              >
                Forgot your password?
              </button>

              {submitError.toLowerCase().includes("verifique seu email") ? (
                <Button type="button" variant="outline" onClick={handleResendVerification} disabled={loading} className="rounded-2xl">
                  Reenviar verificacao
                </Button>
              ) : null}

              {forgotPasswordOpen ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-3 text-sm text-slate-600">Vamos gerar um link seguro para redefinir sua senha.</p>
                  <Button type="button" variant="outline" onClick={handleForgotPasswordSubmit} disabled={loading} className="w-full rounded-2xl">
                    {loading ? "Enviando..." : "Enviar link de recuperacao"}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </form>
      </>
    );
  }

  return (
    <div className="mobile-auth-shell relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(80,109,184,0.16),_transparent_38%),linear-gradient(180deg,_#f6f8fb_0%,_#eef3fb_100%)] px-4 py-8 sm:px-6 sm:py-12">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.8),transparent_42%,rgba(80,109,184,0.08))]" />
      <div className="relative w-full max-w-xl rounded-[32px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_30px_80px_rgba(28,42,74,0.12)] backdrop-blur sm:p-8">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 shadow-[0_18px_50px_rgba(15,23,42,0.16)] sm:mb-8 sm:h-28 sm:w-28">
          <PenTool className="h-9 w-9 text-amber-400 sm:h-12 sm:w-12" strokeWidth={1.8} />
        </div>

        <div className="mb-6 text-center sm:mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">{activeTitle}</h1>
          <p className="mt-3 text-base text-slate-500 sm:mt-4 sm:text-xl">{activeSubtitle}</p>
        </div>

        {isVerificationScreen ? renderVerificationScreen() : isPasswordResetScreen ? renderPasswordResetScreen() : renderAuthForm()}

        {!isVerificationScreen && !isPasswordResetScreen ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Demo local: <span className="font-semibold text-slate-700">demo@storyforge.app</span> /{" "}
            <span className="font-semibold text-slate-700">storyforge</span>
          </div>
        ) : null}

        <p className="mt-5 text-center text-xs leading-6 text-slate-500 sm:text-sm">
          Ao usar o StoryForge, você pode consultar nossa{" "}
          <Link to="/privacy" className="font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-900">
            Política de Privacidade
          </Link>
          .
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 sm:text-sm">
          <Link to="/terms" className="font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-900">
            Termos de Uso
          </Link>
          <span>•</span>
          <Link to="/community-guidelines" className="font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-900">
            Diretrizes da Comunidade
          </Link>
          <span>•</span>
          <Link to="/delete-account" className="font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-900">
            Exclusão de conta
          </Link>
        </div>
      </div>
    </div>
  );
}
