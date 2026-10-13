import { Pencil } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

type InlineNameProps = { value: string; label: string; onCommit: (name: string) => void; startEditing?: boolean; onDone?: () => void };

/** Nome com edição no lugar: lápis (ou duplo clique) abre o campo; Enter/sair salva, Esc cancela. */
export const InlineName = ({ value, label, onCommit, startEditing = false, onDone }: InlineNameProps) => {
  const [draft, setDraft] = useState<string | null>(startEditing ? value : null);
  const finish = (save: boolean) => {
    // Criando (startEditing), o nome sugerido vale mesmo sem mudar; renomeando, só se mudou.
    if (save && draft !== null && draft.trim() !== "" && (startEditing || draft !== value)) onCommit(draft);
    setDraft(null);
    onDone?.();
  };
  const onKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") finish(true);
    if (event.key === "Escape") finish(false);
  };
  if (draft !== null) {
    // Texto já selecionado: digitar substitui o nome sugerido em vez de somar ("Nova coleçãoClientes").
    return <input className="inline-name__input" autoFocus value={draft} aria-label={label} onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setDraft(e.target.value)} onBlur={() => finish(true)} onKeyDown={onKey} />;
  }
  return (
    <span className="inline-name" onDoubleClick={() => setDraft(value)}>
      <span className="inline-name__text" title={value}>{value}</span>
      <button type="button" className="icon-button" onClick={() => setDraft(value)} aria-label={label} title="Renomear"><Pencil size={13} /></button>
    </span>
  );
};
