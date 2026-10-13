import { useState } from "react";
import type { AuthGateway, OAuthProvider } from "../auth/authGateway";
import { Link } from "../routing/Link";
import { PATHS } from "../routing/routes";
import { ArckyuWordmark } from "../ui/ArckyuWordmark";
import { GitHubMark, GoogleMark } from "./brandMarks";
import "./landing.css";

type LoginPageProps = { gateway: AuthGateway | null; problem: string | null; next: string };

const PROVIDERS: readonly { id: OAuthProvider; label: string; Mark: typeof GoogleMark }[] = [
  { id: "google", label: "Continuar com Google", Mark: GoogleMark },
  { id: "github", label: "Continuar com GitHub", Mark: GitHubMark },
];

/** Entrar com Google ou GitHub; depois do provedor volta para `next` (o app, ou o modelo que a pessoa escolheu). */
export const LoginPage = ({ gateway, problem, next }: LoginPageProps) => {
  const [pending, setPending] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(problem);
  const signIn = async (provider: OAuthProvider) => {
    if (!gateway) return;
    setPending(provider);
    setError(null);
    try {
      await gateway.signInWith(provider, `${window.location.origin}${next}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPending(null);
    }
  };
  return (
    <div className="login">
      <main className="login__card">
        <Link href={PATHS.landing} className="login__brand" aria-label="Arckyu, início"><ArckyuWordmark /></Link>
        <h1>Entrar no Arckyu</h1>
        <p>Use sua conta Google ou GitHub. Se for a primeira vez, a conta é criada na hora.</p>
        <div className="login__providers">
          {PROVIDERS.map(({ id, label, Mark }) => (
            <button key={id} type="button" className={`login__provider login__provider--${id}`} disabled={!gateway || pending !== null} onClick={() => void signIn(id)}>
              <Mark /> {pending === id ? "Abrindo…" : label}
            </button>
          ))}
        </div>
        {error && <p className="login__error" role="alert">{error}</p>}
        <p className="login__legal">Ao entrar você concorda com os <Link href={PATHS.terms}>Termos de uso</Link> e a <Link href={PATHS.privacy}>Política de privacidade</Link>.</p>
      </main>
    </div>
  );
};
