import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, Lock, Mail, PenTool, UserRound } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isNativeApp } from "@/lib/mobile";

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

function normalizeBrokenText(value = "") {
  const stringValue = String(value || "").trim();
  try {
    return decodeURIComponent(escape(stringValue));
  } catch {
    return stringValue;
  }
}

function normalizeAuthMessage(error) {
  const rawMessage = normalizeBrokenText(error?.message || error || "").toLowerCase();

  if (!rawMessage) {
    return "Não foi possível entrar agora. Tente novamente em instantes.";
  }

  if (
    rawMessage.includes("invalid login credentials") ||
    rawMessage.includes("invalid_credentials") ||
    rawMessage.includes("invalid credentials") ||
    rawMessage.includes("email ou senha") ||
    rawMessage.includes("senha inválida") ||
    rawMessage.includes("senha invalida") ||
    rawMessage.includes("credenciais")
  ) {
    return "Email ou senha inválidos.";
  }

  if (
    rawMessage.includes("email not confirmed") ||
    rawMessage.includes("confirme seu email") ||
    rawMessage.includes("verify your email") ||
    rawMessage.includes("email não confirmado") ||
    rawMessage.includes("email nao confirmado")
  ) {
    return "Confirme seu email antes de entrar.";
  }

  if (
    rawMessage.includes("network") ||
    rawMessage.includes("fetch") ||
    rawMessage.includes("timed out") ||
    rawMessage.includes("timeout") ||
    rawMessage.includes("resolve host") ||
    rawMessage.includes("server") ||
    rawMessage.includes("internal") ||
    rawMessage.includes("503") ||
    rawMessage.includes("500")
  ) {
    return "Não foi possível entrar agora. Tente novamente em instantes.";
  }

  return normalizeBrokenText(error?.message || "Não foi possível entrar agora. Tente novamente em instantes.");
}

function isEmailConfirmationError(message) {
  return normalizeAuthMessage(message) === "Confirme seu email antes de entrar.";
}

function ErrorPanel({ message }) {
  if (!message) return null;

  return (
    <div className="rounded-2xl border border-rose-300/70 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
      {message}
    </div>
  );
}

export default function AuthPageResolved() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register, resendVerificationEmail, requestPasswordReset, resetPassword, verifyEmail, preparePasswordReset } = useAuth();
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
  const [passwordResetState, setPasswordResetState] = useState(null);
  const processedTokenRef = useRef("");
  const isNative = isNativeApp();

  const hashParams = useMemo(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    const rawHash = window.location.hash || "";
    return new URLSearchParams(rawHash.startsWith("#") ? rawHash.slice(1) : rawHash);
  }, []);

  const action = searchParams.get("action") || "";
  const tokenHash = searchParams.get("token_hash") || hashParams.get("token_hash") || "";
  const otpType = searchParams.get("type") || hashParams.get("type") || "";
  const inferredAction = useMemo(() => {
    if (action) return action;
    if (otpType === "recovery") return "reset-password";
    if (otpType === "signup" || otpType === "email") return "verify-email";
    return "";
  }, [action, otpType]);

  const isVerificationScreen = inferredAction === "verify-email";
  const isPasswordResetScreen = inferredAction === "reset-password";
  const callbackFingerprint = `${inferredAction}:${tokenHash}:${otpType}`;

  const activeTitle = isVerificationScreen ? "Verificar email" : isPasswordResetScreen ? "Criar nova senha" : "Welcome to StoryForge";
  const activeSubtitle = isVerificationScreen
    ? "Estamos validando seu link de acesso"
    : isPasswordResetScreen
      ? "Defina uma nova senha para recuperar sua conta"
      : mode === "login"
        ? "Entre para continuar"
        : "Crie sua conta";

  useEffect(() => {
    if (!isVerificationScreen || verificationState?.status === "success" || processedTokenRef.current === callbackFingerprint) return;

    processedTokenRef.current = callbackFingerprint;
    setLoading(true);
    setVerificationState({ status: "loading", message: "Verificando seu email..." });

    verifyEmail(tokenHash, otpType || "email")
      .then((result) => {
        const message = normalizeBrokenText(result.message || "Email confirmado com sucesso.");
        setVerificationState({ status: "success", message });
        toast.success(message);
      })
      .catch((error) => {
        const message = normalizeAuthMessage(error);
        setVerificationState({ status: "error", message });
        console.error("Email verification failed", error);
        toast.error(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [callbackFingerprint, isVerificationScreen, otpType, tokenHash, verificationState?.status, verifyEmail]);

  useEffect(() => {
    if (!isPasswordResetScreen || passwordResetState?.status === "ready" || processedTokenRef.current === callbackFingerprint) return;

    processedTokenRef.current = callbackFingerprint;
    setLoading(true);
    setPasswordResetState({ status: "loading", message: "Validando seu link de recuperação..." });

    preparePasswordReset(tokenHash, otpType || "recovery")
      .then((result) => {
        setPasswordResetState({ status: "ready", message: normalizeBrokenText(result.message || "Link validado. Agora você já pode criar uma nova senha.") });
      })
      .catch((error) => {
        const message = normalizeAuthMessage(error);
        setPasswordResetState({ status: "error", message });
        console.error("Password reset preparation failed", error);
        toast.error(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [callbackFingerprint, isPasswordResetScreen, otpType, passwordResetState?.status, preparePasswordReset, tokenHash]);

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

    if (mode === "register" && !displayName) nextErrors.display_name = "Informe seu nome para criar a conta.";
    if (!email) nextErrors.email = "Informe seu email.";
    else if (!isValidEmail(email)) nextErrors.email = "Informe um email válido.";
    if (!password) nextErrors.password = "Informe sua senha.";
    else if (mode === "register" && password.length < 6) nextErrors.password = "A senha precisa ter pelo menos 6 caracteres.";
    if (mode === "register" && !confirmation) nextErrors.confirm_password = "Confirme sua senha.";
    else if (mode === "register" && password !== confirmation) nextErrors.confirm_password = "As senhas precisam ser exatamente iguais.";

    setFieldErrors(nextErrors);
    return Object.values(nextErrors).find(Boolean) || "";
  }

  function validateResetForm() {
    const nextErrors = { ...EMPTY_ERRORS };
    if (!form.password) nextErrors.password = "Informe a nova senha.";
    else if (form.password.length < 6) nextErrors.password = "A nova senha precisa ter pelo menos 6 caracteres.";
    if (!form.confirm_password) nextErrors.confirm_password = "Confirme a nova senha.";
    else if (form.password !== form.confirm_password) nextErrors.confirm_password = "As senhas precisam ser exatamente iguais.";
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
      toast.success("Sessão iniciada.");
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
      setDeliveryState({ ...result, message: normalizeBrokenText(result.message || "Conta criada. Confira seu email para confirmar o acesso.") });
      toast.success(normalizeBrokenText(result.message || "Conta criada. Confira seu email para confirmar o acesso."));
    } catch (error) {
      const message = normalizeAuthMessage(error);
      setSubmitError(message);
      console.error("Auth submit failed", error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    setLoading(true);
    try {
      const result = await resendVerificationEmail(form.email.trim());
      setDeliveryState({ ...result, message: normalizeBrokenText(result.message || "Enviamos um novo email de confirmação.") });
      toast.success(normalizeBrokenText(result.message || "Enviamos um novo email de confirmação."));
    } catch (error) {
      const message = "Não foi possível reenviar a confirmação agora. Tente novamente em instantes.";
      setSubmitError(message);
      console.error("Resend verification failed", error);
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
      setFieldErrors((current) => ({ ...current, email: "Informe um email válido." }));
      return;
    }

    setLoading(true);
    try {
      const result = await requestPasswordReset(email);
      setDeliveryState({ ...result, message: normalizeBrokenText(result.message || "Enviamos um link para redefinir sua senha.") });
      setForgotPasswordOpen(false);
      toast.success(normalizeBrokenText(result.message || "Enviamos um link para redefinir sua senha."));
    } catch (error) {
      const message = "Não foi possível enviar o email de recuperação agora.";
      setSubmitError(message);
      console.error("Forgot password failed", error);
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
      toast.success(normalizeBrokenText(result.message || "Senha redefinida com sucesso."));
      navigate("/auth");
    } catch (error) {
      const message = "Não foi possível redefinir a senha agora.";
      setSubmitError(message);
      console.error("Password reset failed", error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function renderDeliveryCard() {
    if (!deliveryState?.message) return null;
    return (
      <div className="rounded-2xl border border-emerald-300/70 bg-emerald-50 px-4 py-4 text-sm text-emerald-800 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
        <p className="font-semibold">{deliveryState.message}</p>
        <p className="mt-2 text-emerald-700 dark:text-emerald-300">
          Confira sua caixa de entrada e também a pasta de spam. Se estiver no celular, abra o link no navegador do próprio aparelho.
        </p>
      </div>
    );
  }

  function renderVerificationScreen() {
    return (
      <div className="space-y-5">
        <div
          className={verificationState?.status === "error"
            ? "rounded-2xl border border-rose-300/70 bg-rose-50 px-4 py-4 text-sm font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200"
            : "rounded-2xl border border-emerald-300/70 bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200"}
        >
          {verificationState?.message || "Verificando seu email..."}
        </div>
        <Button type="button" className="h-14 w-full rounded-2xl bg-slate-900 text-base font-semibold text-white hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400" onClick={() => navigate("/auth")}>
          Ir para o login
        </Button>
      </div>
    );
  }

  function renderPasswordResetScreen() {
    if (passwordResetState?.status !== "ready") {
      return (
        <div className="space-y-5">
          <div
            className={passwordResetState?.status === "error"
              ? "rounded-2xl border border-rose-300/70 bg-rose-50 px-4 py-4 text-sm font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200"
              : "rounded-2xl border border-sky-300/70 bg-sky-50 px-4 py-4 text-sm font-medium text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-200"}
          >
            {passwordResetState?.message || "Validando seu link de recuperação..."}
          </div>
          <Button type="button" className="h-14 w-full rounded-2xl bg-slate-900 text-base font-semibold text-white hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400" onClick={() => navigate("/auth")}>
            Voltar para o login
          </Button>
        </div>
      );
    }

    return (
      <form className="space-y-5" onSubmit={handlePasswordReset} noValidate>
        <FormPasswordField
          label="Nova senha"
          value={form.password}
          onChange={(value) => updateField("password", value)}
          error={fieldErrors.password}
          show={showPassword}
          onToggle={() => setShowPassword((current) => !current)}
          placeholder="Digite a nova senha"
        />

        <FormPasswordField
          label="Confirmar nova senha"
          value={form.confirm_password}
          onChange={(value) => updateField("confirm_password", value)}
          error={fieldErrors.confirm_password}
          show={showConfirmPassword}
          onToggle={() => setShowConfirmPassword((current) => !current)}
          placeholder="Repita a nova senha"
        />

        <ErrorPanel message={submitError} />

        <Button type="submit" disabled={loading} className="h-14 w-full rounded-2xl bg-slate-900 text-base font-semibold text-white hover:bg-slate-800 disabled:bg-slate-700/70 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 dark:disabled:bg-amber-600/70">
          {loading ? "Salvando..." : "Salvar nova senha"}
        </Button>
      </form>
    );
  }

  function renderAuthForm() {
    return (
      <>
        <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-900/70">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={mode === "login"
              ? "rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm dark:bg-slate-200 dark:text-slate-950"
              : "rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className={mode === "register"
              ? "rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm dark:bg-slate-200 dark:text-slate-950"
              : "rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"}
          >
            Sign up
          </button>
        </div>

        <form id="auth-form" className="space-y-5" onSubmit={handleSubmit} noValidate>
          {mode === "register" ? (
            <FormInputField
              label="Nome"
              icon={UserRound}
              value={form.display_name}
              onChange={(value) => updateField("display_name", value)}
              error={fieldErrors.display_name}
              placeholder="Seu nome"
            />
          ) : null}

          <FormInputField
            label="Email"
            icon={Mail}
            value={form.email}
            onChange={(value) => updateField("email", value)}
            error={fieldErrors.email}
            placeholder="voce@exemplo.com"
            type="email"
          />

          <FormPasswordField
            label="Senha"
            value={form.password}
            onChange={(value) => updateField("password", value)}
            error={fieldErrors.password}
            show={showPassword}
            onToggle={() => setShowPassword((current) => !current)}
            placeholder={mode === "login" ? "Digite sua senha" : "Crie uma senha"}
          />

          {mode === "register" ? (
            <FormPasswordField
              label="Confirmar senha"
              value={form.confirm_password}
              onChange={(value) => updateField("confirm_password", value)}
              error={fieldErrors.confirm_password}
              show={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((current) => !current)}
              placeholder="Repita sua senha"
            />
          ) : null}

          <ErrorPanel message={submitError} />
          {renderDeliveryCard()}

          <Button type="submit" form="auth-form" disabled={loading} className="h-14 w-full rounded-2xl bg-slate-900 text-base font-semibold text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800 disabled:bg-slate-700/70 dark:bg-amber-500 dark:text-slate-950 dark:shadow-amber-500/10 dark:hover:bg-amber-400 dark:disabled:bg-amber-600/70">
            {loading ? "Processando..." : mode === "login" ? "Sign in" : "Create account"}
          </Button>

          {mode === "login" ? (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setForgotPasswordOpen((current) => !current)}
                className="text-sm font-medium text-slate-500 underline-offset-4 transition hover:text-slate-900 hover:underline dark:text-slate-300 dark:hover:text-white"
              >
                Forgot your password?
              </button>

              {!isNative && isEmailConfirmationError(submitError) ? (
                <Button type="button" variant="outline" onClick={handleResendVerification} disabled={loading} className="rounded-2xl border-slate-300 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100">
                  Reenviar confirmação
                </Button>
              ) : null}

              {forgotPasswordOpen ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                  <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">Vamos gerar um link seguro para redefinir sua senha.</p>
                  <Button type="button" variant="outline" onClick={handleForgotPasswordSubmit} disabled={loading} className="w-full rounded-2xl border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                    {loading ? "Enviando..." : "Enviar link de recuperação"}
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
    <div className="mobile-auth-shell relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(125,94,63,0.18),_transparent_38%),linear-gradient(180deg,_#f6f0e8_0%,_#efe5d8_100%)] px-4 py-8 dark:bg-[radial-gradient(circle_at_top,_rgba(168,120,72,0.18),_transparent_38%),linear-gradient(180deg,_#15110c_0%,_#1f1811_100%)] sm:px-6 sm:py-12">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.6),transparent_42%,rgba(109,78,48,0.08))] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.03),transparent_42%,rgba(245,158,11,0.08))]" />

      <div className="relative w-full max-w-xl rounded-[32px] border border-stone-200/80 bg-white/95 p-5 shadow-[0_30px_80px_rgba(65,47,26,0.16)] backdrop-blur dark:border-stone-800 dark:bg-stone-950/92 dark:shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:p-8">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-stone-900 shadow-[0_18px_50px_rgba(15,23,42,0.16)] dark:bg-amber-500 sm:mb-8 sm:h-28 sm:w-28">
          <PenTool className="h-9 w-9 text-amber-300 dark:text-stone-950 sm:h-12 sm:w-12" strokeWidth={1.8} />
        </div>

        <div className="mb-6 text-center sm:mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-stone-50 sm:text-5xl">{activeTitle}</h1>
          <p className="mt-3 text-base text-slate-500 dark:text-stone-300 sm:mt-4 sm:text-xl">{activeSubtitle}</p>
        </div>

        {isVerificationScreen ? renderVerificationScreen() : isPasswordResetScreen ? renderPasswordResetScreen() : renderAuthForm()}

        {!isVerificationScreen && !isPasswordResetScreen ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
            Demo local: <span className="font-semibold text-slate-700 dark:text-slate-100">demo@storyforge.app</span> /{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-100">storyforge</span>
          </div>
        ) : null}

        <p className="mt-5 text-center text-xs leading-6 text-slate-500 dark:text-stone-400 sm:text-sm">
          Ao usar o StoryForge, você pode consultar nossa{" "}
          <Link to="/privacy" className="font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-900 dark:text-stone-100 dark:hover:text-white">
            Política de Privacidade
          </Link>
          .
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 dark:text-stone-400 sm:text-sm">
          <Link to="/terms" className="font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-900 dark:text-stone-100 dark:hover:text-white">
            Termos de Uso
          </Link>
          <span>•</span>
          <Link to="/community-guidelines" className="font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-900 dark:text-stone-100 dark:hover:text-white">
            Diretrizes da Comunidade
          </Link>
          <span>•</span>
          <Link to="/delete-account" className="font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-900 dark:text-stone-100 dark:hover:text-white">
            Exclusão de conta
          </Link>
        </div>
      </div>
    </div>
  );
}

function FormInputField({ label, icon: Icon, value, onChange, error, placeholder, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-center text-sm font-semibold text-slate-700 dark:text-stone-200">{label}</span>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-stone-500" />
        <Input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          className="h-14 rounded-2xl border-slate-300 bg-white/90 pl-12 text-base text-slate-900 placeholder:text-slate-400 dark:border-stone-700 dark:bg-stone-900/90 dark:text-stone-50 dark:placeholder:text-stone-500"
        />
      </div>
      {error ? <p className="mt-2 text-sm font-medium text-rose-600 dark:text-rose-300">{error}</p> : null}
    </label>
  );
}

function FormPasswordField({ label, value, onChange, error, show, onToggle, placeholder }) {
  return (
    <label className="block">
      <span className="mb-2 block text-center text-sm font-semibold text-slate-700 dark:text-stone-200">{label}</span>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-stone-500" />
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          className="h-14 rounded-2xl border-slate-300 bg-white/90 pl-12 pr-12 text-base text-slate-900 placeholder:text-slate-400 dark:border-stone-700 dark:bg-stone-900/90 dark:text-stone-50 dark:placeholder:text-stone-500"
        />
        <button type="button" onClick={onToggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 dark:text-stone-500 dark:hover:text-stone-200">
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm font-medium text-rose-600 dark:text-rose-300">{error}</p> : null}
    </label>
  );
}
