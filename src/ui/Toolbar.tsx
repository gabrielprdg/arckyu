import { Circle, Clapperboard, FolderOpen, LayoutTemplate, Moon, Pause, Play, SkipBack, SkipForward, Square, Sun } from "lucide-react";
import type { PlayerAction, PlayerState } from "../flow/playerReducer";
import { ArckyuWordmark } from "./ArckyuWordmark";
import { UserMenu, type AccountControls } from "./UserMenu";

type RecorderControls = { recording: boolean; clicks: number; error: string | null; start: () => void; cancel: () => void; finish: () => void };

type ToolbarProps = {
  paused: boolean;
  onTogglePause: () => void;
  player: PlayerState;
  dispatchPlayer: (action: PlayerAction) => void;
  scenarioNames: string[];
  activeScenario: number;
  onSelectScenario: (index: number) => void;
  playSpeed: number;
  onPlaySpeed: (speed: number) => void;
  recorder: RecorderControls;
  templates: readonly { id: string; title: string }[];
  onLoadTemplate: (templateId: string) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onExportAnimation: () => void;
  drawingName: string;
  onOpenLibrary: () => void;
  account: AccountControls;
};

type PlayControlsProps = Pick<ToolbarProps, "player" | "dispatchPlayer" | "scenarioNames" | "activeScenario" | "onSelectScenario" | "playSpeed" | "onPlaySpeed">;

const ScenarioPicker = ({ scenarioNames, activeScenario, onSelectScenario }: Pick<ToolbarProps, "scenarioNames" | "activeScenario" | "onSelectScenario">) =>
  scenarioNames.length === 0 ? <span className="toolbar__label">Sem cenário</span> : (
    <select className="toolbar__scenario" value={activeScenario} onChange={(e) => onSelectScenario(Number(e.target.value))} aria-label="Cenário do play">
      {scenarioNames.map((name, index) => <option key={`${index}-${name}`} value={index}>{name}</option>)}
    </select>
  );

const PlayControls = ({ player, dispatchPlayer, playSpeed, onPlaySpeed, ...picker }: PlayControlsProps) => {
  const isPlaying = player.status === "playing";
  const disabled = player.totalSteps === 0;
  return (
    <div className="toolbar__group" aria-label="Modo play">
      <ScenarioPicker {...picker} />
      <button disabled={disabled} onClick={() => dispatchPlayer({ type: "prev" })} title="Passo anterior"><SkipBack size={18} /></button>
      <button disabled={disabled} className="is-primary" onClick={() => dispatchPlayer({ type: isPlaying ? "pause" : "play" })}>
        {isPlaying ? <Pause size={18} /> : <Play size={18} />} {isPlaying ? "Pausar" : "Play"}
      </button>
      <button disabled={disabled} onClick={() => dispatchPlayer({ type: "next" })} title="Próximo passo"><SkipForward size={18} /></button>
      <button disabled={player.status === "idle"} onClick={() => dispatchPlayer({ type: "stop" })} title="Parar"><Square size={16} /></button>
      <span className="toolbar__step">{player.status === "idle" ? `${player.totalSteps} passos` : `${Math.min(player.stepIndex + 1, player.totalSteps)}/${player.totalSteps}`}</span>
      <select value={playSpeed} onChange={(e) => onPlaySpeed(Number(e.target.value))} aria-label="Velocidade do play">
        {[0.5, 1, 2].map((speed) => <option key={speed} value={speed}>{speed}×</option>)}
      </select>
    </div>
  );
};

const RecordControls = ({ recorder }: { recorder: RecorderControls }) => (
  <div className="toolbar__group">
    {recorder.recording ? (
      <>
        <span className="toolbar__rec">● Gravando · selecione os cards em ordem ({recorder.clicks})</span>
        <button className="is-primary" disabled={recorder.clicks < 2} onClick={recorder.finish}>Concluir</button>
        <button onClick={recorder.cancel}>Cancelar</button>
      </>
    ) : (
      <button onClick={recorder.start} title="Selecione os cards na ordem da requisição" aria-label="Gravar cenário"><Circle size={16} /> <span className="toolbar__optional">Gravar cenário</span></button>
    )}
    {recorder.error && <span className="toolbar__error">{recorder.error}</span>}
  </div>
);

export const Toolbar = (props: ToolbarProps) => (
  <header className="toolbar">
    <strong className="toolbar__brand"><ArckyuWordmark /></strong>
    <button className="toolbar__drawing" onClick={props.onOpenLibrary} title="Meus desenhos: abrir, criar, renomear, organizar em coleções">
      <FolderOpen size={18} /> <span className="toolbar__drawing-name">{props.drawingName}</span>
    </button>
    <button className={props.paused ? "is-warning" : ""} onClick={props.onTogglePause} title={`${props.paused ? "Retomar" : "Pausar"} animações (Alt+P)`} aria-label={props.paused ? "Retomar animações" : "Pausar animações"}>
      {props.paused ? <Play size={18} /> : <Pause size={18} />} <span className="toolbar__optional">{props.paused ? "Retomar animações" : "Pausar animações"}</span>
    </button>
    <PlayControls {...props} />
    <RecordControls recorder={props.recorder} />
    <button className="toolbar__theme" onClick={props.onToggleTheme} title="Alternar tema claro/escuro">
      {props.theme === "dark" ? <Sun size={18} /> : <Moon size={18} />} <span className="toolbar__optional">{props.theme === "dark" ? "Claro" : "Escuro"}</span>
    </button>
    <button onClick={props.onExportAnimation} title="Exportar a animação da arquitetura ou o play de um cenário (vídeo ou SVG)">
      <Clapperboard size={18} /> <span className="toolbar__optional">Exportar animação</span>
    </button>
    <label className="toolbar__templates" title="Criar um desenho novo a partir de um modelo pronto">
      <LayoutTemplate size={18} />
      <select value="" onChange={(e) => e.target.value && props.onLoadTemplate(e.target.value)} aria-label="Novo desenho a partir de modelo">
        <option value="">Modelos…</option>
        {props.templates.map((template) => <option key={template.id} value={template.id}>{template.title}</option>)}
      </select>
    </label>
    <UserMenu {...props.account} />
  </header>
);
