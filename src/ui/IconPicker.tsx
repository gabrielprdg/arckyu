import { ImageUp, Loader2, Shapes } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { useIconSearch } from "../app/useIconSearch";
import type { IconSource } from "../icons/iconSource";
import { readAsDataUrl, validateUpload } from "../icons/readUpload";
import type { IconCategory } from "../model/types";
import { IconThumb } from "./IconThumb";

type IconPickerProps = {
  query: string;
  onQuery: (query: string) => void;
  category: IconCategory;
  picked: IconSource;
  onPick: (source: IconSource) => void;
};

const isPicked = (picked: IconSource, candidate: IconSource): boolean =>
  picked.kind === candidate.kind && (picked.kind !== "iconify" || (candidate.kind === "iconify" && picked.id === candidate.id));

const SearchResults = ({ query, category, picked, onPick }: Omit<IconPickerProps, "onQuery">) => {
  const search = useIconSearch(query);
  if (search.status === "loading") return <p className="hint"><Loader2 size={14} className="spin" /> Buscando “{query}”…</p>;
  if (search.status === "error") return <p className="hint is-error">Busca indisponível ({search.message}). Envie um arquivo ou use o genérico.</p>;
  if (search.status === "idle") return <p className="hint">Digite pelo menos 2 letras para buscar.</p>;
  if (search.results.length === 0) return <p className="hint">Nenhum ícone para “{query}”. Envie um arquivo ou use o genérico.</p>;
  return (
    <div className="picker__grid">
      {search.results.map((id) => {
        const source: IconSource = { kind: "iconify", id };
        return (
          <button key={id} type="button" title={id} className={`picker__option${isPicked(picked, source) ? " is-picked" : ""}`} onClick={() => onPick(source)}>
            <IconThumb icon={{ ref: id, category, source }} size={36} />
          </button>
        );
      })}
    </div>
  );
};

const UploadButton = ({ onPick }: Pick<IconPickerProps, "onPick">) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const problem = validateUpload(file);
    setError(problem);
    if (!problem) onPick({ kind: "upload", dataUrl: await readAsDataUrl(file) });
  };
  return (
    <>
      <button type="button" className="picker__action" onClick={() => inputRef.current?.click()}><ImageUp size={16} /> Enviar arquivo</button>
      <input ref={inputRef} type="file" accept="image/svg+xml,image/png,image/jpeg,image/webp" hidden onChange={onFile} />
      {error && <p className="hint is-error">{error}</p>}
    </>
  );
};

/** Escolha do ícone: busca por nome no Iconify, upload próprio ou glifo genérico da categoria. */
export const IconPicker = (props: IconPickerProps) => (
  <fieldset className="picker">
    <legend>Ícone</legend>
    <input value={props.query} onChange={(e) => props.onQuery(e.target.value)} placeholder="Buscar ícone (ex.: react, supabase)" aria-label="Buscar ícone" />
    <SearchResults {...props} />
    <div className="picker__actions">
      <UploadButton onPick={props.onPick} />
      <button type="button" className={`picker__action${props.picked.kind === "lucide" ? " is-picked" : ""}`} onClick={() => props.onPick({ kind: "lucide" })}>
        <Shapes size={16} /> Genérico
      </button>
    </div>
  </fieldset>
);
