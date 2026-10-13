import { LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AuthUser } from "../auth/authGateway";

/** Conta logada na barra e como sair. */
export type AccountControls = { user: AuthUser; onSignOut: () => void };

const initialsOf = (user: AuthUser): string =>
  (user.name ?? user.email ?? "?").split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";

// Fecha ao clicar fora, como um menu nativo.
const useCloseOnOutside = (open: boolean, close: () => void) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => { if (event.target instanceof Node && !ref.current?.contains(event.target)) close(); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, close]);
  return ref;
};

/** Avatar da conta (foto do Google/GitHub ou iniciais) com menu: nome, e-mail e Sair. */
export const UserMenu = ({ user, onSignOut }: AccountControls) => {
  const [open, setOpen] = useState(false);
  const ref = useCloseOnOutside(open, () => setOpen(false));
  return (
    <div className="user-menu" ref={ref}>
      <button type="button" className="user-menu__avatar" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Conta" title={user.email ?? "Conta"}>
        {user.avatarUrl ? <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" /> : <span>{initialsOf(user)}</span>}
      </button>
      {open && (
        <div className="user-menu__panel" role="menu">
          <strong>{user.name ?? "Sua conta"}</strong>
          {user.email && <span className="user-menu__email">{user.email}</span>}
          <button type="button" role="menuitem" onClick={onSignOut}><LogOut size={15} /> Sair</button>
        </div>
      )}
    </div>
  );
};
