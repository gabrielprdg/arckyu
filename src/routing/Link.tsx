import { createContext, useContext, type AnchorHTMLAttributes, type MouseEvent } from "react";
import type { Navigate } from "./useLocation";

export const NavigateContext = createContext<Navigate | null>(null);

/** Navegação do app em qualquer componente da árvore (vem do NavigateContext). */
export const useNavigate = (): Navigate => {
  const navigate = useContext(NavigateContext);
  if (!navigate) throw new Error("useNavigate fora do NavigateContext.Provider (montar dentro do <App>)");
  return navigate;
};

// Ctrl/Cmd/Shift/botão do meio continuam abrindo em outra aba, como um link normal.
const isPlainClick = (event: MouseEvent<HTMLAnchorElement>): boolean =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

/** Link interno sem recarregar a página; âncoras (#secao) e links externos seguem o navegador. */
export const Link = ({ href, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => {
  const navigate = useNavigate();
  const internal = href.startsWith("/") && !href.startsWith("//");
  return (
    <a href={href} {...rest} onClick={(event) => {
      onClick?.(event);
      if (!internal || event.defaultPrevented || !isPlainClick(event)) return;
      event.preventDefault();
      navigate(href);
    }} />
  );
};
