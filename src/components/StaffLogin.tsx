import { FormEvent, useState } from "react";
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import appLogo from "../assets/logo2.png";

export interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "staff";
  jobTitle: string;
  department: string;
  phone: string;
  profileCompleted: boolean;
  pageAccess: string[];
}

interface StaffLoginProps {
  onAuthenticated: (user: StaffUser) => Promise<void>;
}

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
}

function PasswordInput({ value, onChange, autoComplete, placeholder, minLength, maxLength, required = true }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return <div className="relative mt-2">
    <input
      required={required}
      type={visible ? "text" : "password"}
      autoComplete={autoComplete}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      minLength={minLength}
      maxLength={maxLength}
      className="staff-login-input h-12 w-full rounded-xl border px-3.5 pr-12 text-sm font-normal"
    />
    <button
      type="button"
      onClick={() => setVisible((current) => !current)}
      aria-label={visible ? "Hide password" : "Show password"}
      aria-pressed={visible}
      className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-400 transition hover:text-slate-700"
    >
      {visible ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
    </button>
  </div>;
}

const apiRequest = async <T,>(path: string, body: Record<string, string>) => {
  const response = await fetch(`/api/staff-auth/${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const result = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
  return result;
};

export function StaffLogin({ onAuthenticated }: StaffLoginProps) {
  const query = new URLSearchParams(window.location.search);
  const [mode, setMode] = useState<"login" | "invite" | "accept" | "forgot" | "reset">(
    query.has("invite") ? "accept" : query.has("reset") ? "reset" : "login"
  );
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "invite") {
        const body: Record<string, string> = { email, name };
        if (adminKey) body.adminKey = adminKey;
        const result = await apiRequest<{ message: string }>("invitations", body);
        setNotice(result.message);
      } else if (mode === "accept") {
        const token = new URLSearchParams(window.location.search).get("invite") ?? "";
        const result = await apiRequest<{ message: string }>("accept-invitation", { token, password });
        setNotice(result.message);
        setMode("login");
        window.history.replaceState({}, "", "/staff-login");
      } else if (mode === "forgot") {
        const result = await apiRequest<{ message: string }>("request-password-reset", { email });
        setNotice(result.message);
      } else if (mode === "reset") {
        const token = new URLSearchParams(window.location.search).get("reset") ?? "";
        const result = await apiRequest<{ message: string }>("reset-password", { token, password });
        setNotice(result.message);
        setMode("login");
        setPassword("");
        window.history.replaceState({}, "", "/staff-login");
      } else {
        const result = await apiRequest<{ data: StaffUser }>("login", { email, password });
        await onAuthenticated(result.data);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to continue.");
    } finally {
      setBusy(false);
    }
  };

  const title = mode === "accept"
    ? "Activate your account"
    : mode === "invite"
      ? "Invite a staff member"
      : mode === "forgot"
        ? "Reset your password"
        : mode === "reset"
          ? "Create a new password"
          : "Welcome back";
  const subtitle = mode === "invite"
    ? "Invite your team to collaborate in one secure workspace."
    : mode === "accept"
      ? "Set up your password to activate your TDS workspace."
      : mode === "forgot"
        ? "Enter your work email and we'll send you a secure reset link."
        : mode === "reset"
          ? "Choose a new password for your TDS workspace."
      : "Sign in to continue to your workspace.";
  return (
    <main className="staff-login-shell flex min-h-screen items-center justify-center px-4 py-8 sm:px-8">
      <section className="staff-login-frame grid w-full max-w-5xl overflow-hidden rounded-[28px] bg-white">
        <aside className="staff-login-brand flex flex-col justify-between p-7 sm:p-10 lg:p-12">
          <div>
            <div className="flex items-center gap-3">
              <span className="staff-login-logo grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-lg">
                <img src={appLogo} alt="TDS logo" className="h-10 w-10 object-contain" />
              </span>
              <div>
                <p className="staff-login-brand-name">TDS-OS</p>
                <p className="staff-login-brand-caption">CUSTOMER RELATIONSHIP PLATFORM</p>
              </div>
            </div>
            <div className="mt-12 max-w-md sm:mt-16 lg:mt-24">
              <div className="staff-login-kicker inline-flex items-center gap-2 rounded-full px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>One workspace. Better relationships.</span>
              </div>
              <h2 className="staff-login-headline mt-6 text-3xl font-bold leading-tight sm:text-4xl lg:text-[42px]">
                Your customer relationships, <span>in sync.</span>
              </h2>
              <p className="staff-login-copy mt-4 max-w-sm text-sm leading-6 sm:text-base">
                Bring your leads, projects, conversations and customer operations together in one clear view.
              </p>
            </div>
          </div>
          <div className="mt-10 hidden space-y-4 sm:block">
            {["A shared source of truth for your team", "Customer context at every stage", "Secure access built for your business"].map((item) => (
              <p key={item} className="staff-login-feature flex items-center gap-3 text-sm">
                <span className="staff-login-check grid h-6 w-6 shrink-0 place-items-center rounded-full"><Check className="h-3.5 w-3.5" /></span>
                {item}
              </p>
            ))}
          </div>
          <p className="staff-login-footer mt-10 text-xs">© {new Date().getFullYear()} TDS-OS · Built for better business</p>
        </aside>

        <div className="flex items-center justify-center px-6 py-9 sm:px-10 sm:py-12 lg:px-14">
          <div className="w-full max-w-sm">
            <div className="staff-login-secure mb-8 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold">
              <ShieldCheck className="h-4 w-4" /> Secure team access
            </div>
            <div className="mb-7">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">{title}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
            </div>
            <form onSubmit={submit} className="space-y-5">
              {mode === "invite" && <>
                <label className="staff-login-label block text-sm font-semibold">Full name
                  <input required maxLength={120} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className="staff-login-input mt-2 h-12 w-full rounded-xl border px-3.5 text-sm font-normal" />
                </label>
                <label className="staff-login-label block text-sm font-semibold">Work email
                  <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" className="staff-login-input mt-2 h-12 w-full rounded-xl border px-3.5 text-sm font-normal" />
                </label>
                <label className="staff-login-label block text-sm font-semibold">Bootstrap administrator key <span className="font-normal text-slate-400">(first account only)</span>
                  <PasswordInput value={adminKey} onChange={setAdminKey} autoComplete="off" required={false} />
                </label>
              </>}
              {mode === "login" && <>
                <label className="staff-login-label block text-sm font-semibold">Work email
                  <input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" className="staff-login-input mt-2 h-12 w-full rounded-xl border px-3.5 text-sm font-normal" />
                </label>
                <label className="staff-login-label block text-sm font-semibold">Password
                  <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" placeholder="Enter your password" maxLength={128} />
                </label>
                <button type="button" onClick={() => { setMode("forgot"); setError(""); setNotice(""); }} className="-mt-2 block w-full text-right text-sm font-semibold text-orange-700 hover:text-orange-800">
                  Forgot password?
                </button>
              </>}
              {mode === "forgot" && <label className="staff-login-label block text-sm font-semibold">Work email
                <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" className="staff-login-input mt-2 h-12 w-full rounded-xl border px-3.5 text-sm font-normal" />
              </label>}
              {(mode === "accept" || mode === "reset") && <>
                <label className="staff-login-label block text-sm font-semibold">Create password
                  <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" placeholder="At least 12 characters" minLength={12} maxLength={128} />
                </label>
                <p className="-mt-2 text-xs text-slate-500">Use at least 12 characters to keep your account secure.</p>
              </>}
              {error && <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
              {notice && <p role="status" className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
              <button disabled={busy} className="staff-login-submit flex h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
                {busy ? "Please wait…" : mode === "invite" ? "Send invitation" : mode === "accept" ? "Activate account" : mode === "forgot" ? "Send reset link" : mode === "reset" ? "Update password" : "Sign in to workspace"}
                {!busy && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
            {mode !== "accept" && mode !== "reset" && (
              <button type="button" onClick={() => { setMode(mode === "login" ? "invite" : "login"); setError(""); setNotice(""); }} className="mt-6 w-full text-center text-sm font-semibold text-orange-700 hover:text-orange-800">
                {mode === "login" ? "Set up or invite a staff account" : "Back to sign in"}
              </button>
            )}
            <p className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400"><LockKeyhole className="h-3.5 w-3.5" /> Your workspace is protected by secure sign-in</p>
          </div>
        </div>
      </section>
    </main>
  );
}
