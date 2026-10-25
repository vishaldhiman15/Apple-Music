import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Headphones,
  Loader2,
  HardDrive,
} from "lucide-react";
import { Brand } from "../components/UI";
import { useAuthStore } from "../store/useAuthStore";
export default function AuthPage({ register = false }) {
  const nav = useNavigate();
  const {
    login,
    register: signup,
    backendAvailable,
    checking,
    authProvider,
  } = useAuthStore();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    setError("");
    const r = register
      ? await signup(form.name, form.email, form.password)
      : await login(form.email, form.password);
    setBusy(false);
    if (r.success) nav("/");
    else setError(r.message);
  }
  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-top-brand">
          <Brand />
        </div>
        <div className="auth-orbits">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="auth-visual-copy">
          <span className="eyebrow">MORE THAN A PLAY BUTTON</span>
          <h1>
            A little closer
            <br />
            to what moves you.
          </h1>
          <p>
            Your favorites. Your discoveries.
            <br />
            Your own kind of music.
          </p>
        </div>
      </div>
      <div className="auth-form-side">
        <button className="back-to-music" onClick={() => nav("/")}>
          <ArrowLeft size={16} />
          Back to the music
        </button>
        <div className="auth-form">
          <Headphones size={33} className="auth-headphones" />
          <span className="eyebrow">YOUR LIBRARY, A LITTLE MORE CONNECTED</span>
          <h2>{register ? "Make yourself at home." : "Welcome back."}</h2>
          <p>
            {register
              ? "Keep your playlists and favorites in sync."
              : "Pick up right where the good music left off."}
          </p>
          {authProvider === "chatgpt" ? (
            <div className="device-welcome">
              <Headphones size={24} />
              <h3>Your cloud library is connected.</h3>
              <p>
                This hosted app uses your ChatGPT sign-in for your private
                music, favorites, and playlists.
              </p>
              <button className="btn primary" onClick={() => nav("/")}>
                Continue to music
              </button>
            </div>
          ) : backendAvailable ? (
            <form onSubmit={submit}>
              {register && (
                <label>
                  Your name
                  <input
                    name="name"
                    required
                    autoComplete="name"
                    maxLength={60}
                    placeholder="What should we call you?"
                  />
                </label>
              )}
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  maxLength={254}
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete={register ? "new-password" : "current-password"}
                  minLength={register ? 10 : 1}
                  maxLength={128}
                  placeholder={
                    register ? "At least 10 characters" : "Your password"
                  }
                />
              </label>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button className="btn primary full-width" disabled={busy}>
                {busy ? (
                  <Loader2 className="spin" size={17} />
                ) : register ? (
                  "Create account"
                ) : (
                  "Sign in"
                )}
                <ArrowRight size={16} />
              </button>
              <p className="auth-switch">
                {register ? "Already have an account?" : "New here?"}{" "}
                <Link to={register ? "/login" : "/signup"}>
                  {register ? "Sign in" : "Create an account"}
                </Link>
              </p>
            </form>
          ) : (
            <div className="device-welcome">
              <HardDrive size={24} />
              <h3>Your music is already at home.</h3>
              <p>
                {checking
                  ? "Checking account availability…"
                  : "This edition saves your library on this device. You can make playlists, save favorites, and import your own music without an account."}
              </p>
              <button
                className="btn primary full-width"
                onClick={() => nav("/")}
              >
                Continue listening <ArrowRight size={16} />
              </button>
            </div>
          )}
          <p className="auth-footnote">
            An independent music player. Not affiliated with Apple.
            <br />
            The included collection contains original demo recordings.
          </p>
        </div>
      </div>
    </div>
  );
}
