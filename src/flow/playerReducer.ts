export type PlayerStatus = "idle" | "playing" | "paused" | "done";

export type PlayerState = {
  status: PlayerStatus;
  stepIndex: number;
  totalSteps: number;
};

export type PlayerAction =
  | { type: "load"; totalSteps: number }
  | { type: "play" }
  | { type: "pause" }
  | { type: "stop" }
  | { type: "next" }
  | { type: "prev" }
  | { type: "stepFinished" };

export const initialPlayerState: PlayerState = { status: "idle", stepIndex: 0, totalSteps: 0 };

const advance = (state: PlayerState, keepPlaying: boolean): PlayerState => {
  const isLast = state.stepIndex >= state.totalSteps - 1;
  if (isLast) return { ...state, status: "done" };
  return { ...state, stepIndex: state.stepIndex + 1, status: keepPlaying ? "playing" : state.status };
};

const play = (state: PlayerState): PlayerState => {
  if (state.totalSteps === 0) return state;
  if (state.status === "idle" || state.status === "done") {
    return { ...state, status: "playing", stepIndex: 0 };
  }
  return { ...state, status: "playing" };
};

/**
 * Transições do modo play: idle → playing ⇄ paused → done.
 * @example playerReducer({ status: "idle", stepIndex: 0, totalSteps: 3 }, { type: "play" }).status // "playing"
 */
export const playerReducer = (state: PlayerState, action: PlayerAction): PlayerState => {
  switch (action.type) {
    case "load":
      return { status: "idle", stepIndex: 0, totalSteps: action.totalSteps };
    case "play":
      return play(state);
    case "pause":
      return state.status === "playing" ? { ...state, status: "paused" } : state;
    case "stop":
      return { ...state, status: "idle", stepIndex: 0 };
    case "next":
      return advance(state, false);
    case "prev":
      return { ...state, stepIndex: Math.max(0, state.stepIndex - 1) };
    case "stepFinished":
      return state.status === "playing" ? advance(state, true) : state;
  }
};
