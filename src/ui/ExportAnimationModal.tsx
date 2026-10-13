import { X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ExportStatus } from "../app/useAnimationExport";
import type { AnimationExportRequest } from "../export/animationExport";
import { animationDurationMs, PLAY_HOLD_MS } from "../export/exportTimeline";
import { exportRequestFrom, type ExportChoices } from "../export/exportRequest";
import type { Scenario } from "../model/types";

type ExportAnimationModalProps = {
  open: boolean;
  scenarios: readonly Scenario[];
  activeScenario: number;
  theme: "light" | "dark";
  playSpeed: number;
  status: ExportStatus;
  onExport: (request: AnimationExportRequest) => void;
  onCancel: () => void;
  onClose: () => void;
};

type FieldsProps = { choices: ExportChoices; update: (patch: Partial<ExportChoices>) => void };

const SECONDS = [5, 10, 15, 30];
const SPEEDS = [0.5, 1, 2];

const ContentFields = ({ choices, update, scenarios }: FieldsProps & { scenarios: readonly Scenario[] }) => (
  <>
    <fieldset className="field export__choice"><legend>O que exportar</legend>
      <label><input type="radio" checked={choices.content === "ambient"} onChange={() => update({ content: "ambient" })} /> Animação da arquitetura (bolinhas nas setas)</label>
      <label><input type="radio" checked={choices.content === "play"} disabled={scenarios.length === 0} onChange={() => update({ content: "play" })} /> Play de um cenário</label>
    </fieldset>
    {choices.content === "play" && (
      <div className="export__row">
        <label className="field export__wide"><span>Cenário</span>
          <select value={choices.scenarioIndex} onChange={(e) => update({ scenarioIndex: Number(e.target.value) })}>
            {scenarios.map((scenario, index) => <option key={`${index}-${scenario.name}`} value={index}>{scenario.name} ({scenario.steps.length} passos)</option>)}
          </select>
        </label>
        <label className="field"><span>Velocidade</span>
          <select value={choices.speed} onChange={(e) => update({ speed: Number(e.target.value) })}>
            {SPEEDS.map((speed) => <option key={speed} value={speed}>{speed}×</option>)}
          </select>
        </label>
      </div>
    )}
  </>
);

const OutputFields = ({ choices, update }: FieldsProps) => (
  <>
    <label className="field"><span>Formato</span>
      <select value={choices.format} onChange={(e) => update({ format: e.target.value === "svg" ? "svg" : "video" })}>
        <option value="video">Vídeo MP4 (PowerPoint, Teams, WhatsApp)</option>
        <option value="svg">SVG animado em loop (navegador, GitHub, Confluence)</option>
      </select>
    </label>
    <div className="export__row">
      {choices.format === "video" && choices.content === "ambient" && (
        <label className="field"><span>Duração</span>
          <select value={choices.seconds} onChange={(e) => update({ seconds: Number(e.target.value) })}>
            {SECONDS.map((seconds) => <option key={seconds} value={seconds}>{seconds} s</option>)}
          </select>
        </label>
      )}
      {choices.format === "video" && (
        <label className="field"><span>Resolução</span>
          <select value={choices.longSidePx} onChange={(e) => update({ longSidePx: Number(e.target.value) })}>
            <option value={1920}>Full HD (1920 px)</option>
            <option value={3840}>4K (3840 px)</option>
          </select>
        </label>
      )}
      <label className="field"><span>Tema</span>
        <select value={choices.theme} onChange={(e) => update({ theme: e.target.value === "dark" ? "dark" : "light" })}>
          <option value="light">Claro</option>
          <option value="dark">Escuro</option>
        </select>
      </label>
    </div>
  </>
);

const summaryOf = (choices: ExportChoices, scenarios: readonly Scenario[]): string => {
  if (choices.format === "svg") return "O SVG repete sozinho, sem fim. Abra no navegador ou cole no README.";
  if (choices.content === "ambient") return `Vídeo de ${choices.seconds} s a 30 quadros por segundo.`;
  const steps = scenarios[choices.scenarioIndex]?.steps ?? [];
  const seconds = animationDurationMs({ kind: "play", steps, speed: choices.speed }) / 1000;
  return `Vídeo de ${seconds.toFixed(1)} s: ${steps.length} passos e ${PLAY_HOLD_MS / 1000} s no fim com tudo aceso.`;
};

const StatusLine = ({ status }: { status: ExportStatus }) => {
  if (status.kind === "running") return <div className="export__status"><progress value={status.progress} max={1} /> {Math.round(status.progress * 100)}%</div>;
  if (status.kind === "done") return <p className="export__status">Pronto: {status.filename} foi baixado.</p>;
  if (status.kind === "error") return <p className="export__status hint is-error">Não deu para exportar: {status.message}</p>;
  return null;
};

const initialChoices = (props: ExportAnimationModalProps): ExportChoices => ({
  content: "ambient", scenarioIndex: props.activeScenario, speed: props.playSpeed, seconds: 10,
  format: "video", theme: props.theme, longSidePx: 1920,
});

// Abre/fecha o <dialog> nativo e recomeça as escolhas a cada abertura (tema e cenário atuais).
const useDialog = (props: ExportAnimationModalProps, reset: () => void) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (props.open && !dialog.open) { reset(); dialog.showModal(); }
    if (!props.open && dialog.open) dialog.close();
  }, [props.open]);
  return dialogRef;
};

/** Modal do export de animação: fundo ou play, vídeo ou SVG, tema e resolução. */
export const ExportAnimationModal = (props: ExportAnimationModalProps) => {
  const { scenarios, status, onExport, onCancel, onClose } = props;
  const [choices, setChoices] = useState<ExportChoices>(() => initialChoices(props));
  const update = (patch: Partial<ExportChoices>) => setChoices((current) => ({ ...current, ...patch }));
  const dialogRef = useDialog(props, () => setChoices(initialChoices(props)));
  const prepared = exportRequestFrom(choices, scenarios);
  const running = status.kind === "running";
  const close = () => { if (running) onCancel(); onClose(); };
  const submit = (event: FormEvent) => { event.preventDefault(); if (prepared.ok && !running) onExport(prepared.request); };

  return (
    <dialog ref={dialogRef} className="modal" onClose={close} aria-labelledby="export-title">
      <form onSubmit={submit}>
        <header className="modal__head">
          <h2 id="export-title">Exportar animação</h2>
          <button type="button" className="modal__close" onClick={close} aria-label="Fechar"><X size={18} /></button>
        </header>
        <div className="modal__body">
          <ContentFields choices={choices} update={update} scenarios={scenarios} />
          <OutputFields choices={choices} update={update} />
          <p className={prepared.ok ? "hint" : "hint is-error"}>{prepared.ok ? summaryOf(choices, scenarios) : prepared.error}</p>
          <StatusLine status={status} />
        </div>
        <footer className="modal__foot">
          {running ? <button type="button" onClick={onCancel}>Cancelar export</button> : <button type="button" onClick={close}>Fechar</button>}
          <button type="submit" className="is-primary" disabled={!prepared.ok || running}>{running ? "Exportando…" : "Exportar"}</button>
        </footer>
      </form>
    </dialog>
  );
};
