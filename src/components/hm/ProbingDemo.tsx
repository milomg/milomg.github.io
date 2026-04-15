import { Show, createSignal, onCleanup, onMount } from "solid-js";
import { Mulberry32, mix32 } from "./hash-utils";
import "./ProbingDemo.css";

type ProbeMode = "linear" | "triangular" | "quadratic" | "randomized";

type ProbeFrame = {
  slots: boolean[];
  probes: number[];
  message: string;
  inserted: number;
};

const PROBE_MODE_LABELS: Record<ProbeMode, string> = {
  linear: "Linear",
  triangular: "Triangular",
  quadratic: "Quadratic",
  randomized: "Randomized",
};

const TABLE_SIZE = 1200;
const INSERT_COUNT = 1000;
const PROBE_LOOP_STEPS = 900;
const PROBE_TICK_MS = 20;
const PROBE_TABLE_COLS = 40;
const PROBE_TABLE_ROWS = 30;
const PROBE_CELL_SIZE = 14;
const PROBE_CELL_GAP = 3;
const PROBE_SLOT_INDEXES = Array.from({ length: TABLE_SIZE }, (_, i) => i);
const PROBE_PALETTE = [
  "#ef4444",
  "#f97316",
  "#f2be10",
  "#eab308",
  "#86bc2f",
  "#22c55e",
  "#14b98f",
  "#06b6d4",
  "#21a0e9",
  "#3b82f6",
  "#636fec",
  "#8b5cf6",
] as const;

const PROBE_INDEXES: Record<ProbeMode, (home: number, step: number) => number> = {
  linear: (home, step) => (home + step) % TABLE_SIZE,
  triangular: (home, step) => (home + (step * (step + 1)) / 2) % TABLE_SIZE,
  quadratic: (home, step) => (home + step * step) % TABLE_SIZE,
  randomized: (home, step) => mix32(home ^ mix32(step ^ 0x9e3779b9)) % TABLE_SIZE,
};

const createEmptyProbeFrame = (): ProbeFrame => ({
  slots: Array(TABLE_SIZE).fill(false),
  probes: [],
  message: "Empty table",
  inserted: 0,
});

const createProbeSimulator = (mode: ProbeMode) => {
  const rngSeed = 0x6d2b79f5;
  let slots: boolean[] = Array(TABLE_SIZE).fill(false);
  const rng = new Mulberry32(rngSeed);
  let inserted = 0;
  let currentFrame: ProbeFrame = createEmptyProbeFrame();
  const modeLabel = PROBE_MODE_LABELS[mode];
  const getIndex = PROBE_INDEXES[mode];

  const buildNextInsertionFrame = (): ProbeFrame => {
    const visited: number[] = [];
    const home = Math.floor(rng.next() * TABLE_SIZE);

    for (let i = 0; i < TABLE_SIZE; i += 1) {
      const next = getIndex(home, i);

      visited.push(next);
      if (!slots[next]) {
        slots[next] = true;
        inserted += 1;
        return {
          slots: slots,
          probes: visited,
          message: `${modeLabel}: inserted ${inserted} / ${INSERT_COUNT}`,
          inserted,
        };
      }
    }

    return {
      slots: slots,
      probes: [],
      message: `${modeLabel}: inserted ${inserted} / ${INSERT_COUNT}`,
      inserted,
    };
  };

  return {
    current() {
      return currentFrame;
    },
    reset() {
      slots = Array(TABLE_SIZE).fill(false);
      rng.reset(rngSeed);
      inserted = 0;
      currentFrame = createEmptyProbeFrame();
    },
    advance() {
      currentFrame = buildNextInsertionFrame();
    },
  };
};

const createProbeAnimationState = (mode: ProbeMode) => {
  const simulator = createProbeSimulator(mode);
  const [frameMessage, setFrameMessage] = createSignal("");
  let appliedStep = -1;
  const slots = PROBE_SLOT_INDEXES.map(() => {
    const [get, set] = createSignal<(typeof PROBE_PALETTE)[number] | undefined>(undefined);
    return { get, set };
  });
  const probes = PROBE_SLOT_INDEXES.map(() => {
    const [get, set] = createSignal(false);
    return { get, set };
  });

  const applyFrameToSignals = (nextFrame: ProbeFrame) => {
    const cells = nextFrame.slots;
    let chainPosition = 0;
    let chainCount = 0;
    let filledCount = 0;

    for (let i = 0; i < cells.length; i += 1) {
      probes[i].set(false);

      if (!cells[i]) {
        slots[i].set(undefined);
        continue;
      }

      filledCount += 1;
      if (i === 0 || !cells[i - 1]) {
        chainPosition = 0;
        chainCount += 1;
      } else {
        chainPosition += 1;
      }

      if (chainPosition === 0) {
        slots[i].set(PROBE_PALETTE[0]);
      } else {
        slots[i].set(PROBE_PALETTE[((chainPosition - 1) % (PROBE_PALETTE.length - 1)) + 1]);
      }
    }

    for (let i = 0; i < nextFrame.probes.length; i += 1) {
      probes[nextFrame.probes[i]].set(true);
    }

    const chainLength = chainCount === 0 ? 0 : filledCount / chainCount;
    setFrameMessage(`${nextFrame.message} -  avg chain length ${chainLength.toFixed(2)}`);
  };

  const syncToLoopStep = (nextStep: number) => {
    if (appliedStep === nextStep) return;

    while (appliedStep < nextStep) {
      simulator.advance();
      appliedStep += 1;
    }

    applyFrameToSignals(simulator.current());
  };

  const reset = () => {
    simulator.reset();
    appliedStep = 0;
    applyFrameToSignals(simulator.current());
  };

  return {
    slots,
    probes,
    frameMessage,
    syncToLoopStep,
    reset,
  };
};

const ProbeAnimation = (props: { title: string; state: ReturnType<typeof createProbeAnimationState> }) => {
  const gridWidth = PROBE_TABLE_COLS * PROBE_CELL_SIZE + (PROBE_TABLE_COLS - 1) * PROBE_CELL_GAP;
  const gridHeight = PROBE_TABLE_ROWS * PROBE_CELL_SIZE + (PROBE_TABLE_ROWS - 1) * PROBE_CELL_GAP;

  return (
    <div class="widget">
      <header>
        <strong>{props.title}</strong>
      </header>

      <svg viewBox={`0 0 ${gridWidth + 24} ${gridHeight + 24}`} width="100%" aria-label={`${props.title} animation`}>
        {PROBE_SLOT_INDEXES.map((slot) => {
          const col = slot % PROBE_TABLE_COLS;
          const row = Math.floor(slot / PROBE_TABLE_COLS);
          const x = 12 + col * (PROBE_CELL_SIZE + PROBE_CELL_GAP);
          const y = 12 + row * (PROBE_CELL_SIZE + PROBE_CELL_GAP);

          return (
            <rect
              x={x}
              y={y}
              width={PROBE_CELL_SIZE}
              height={PROBE_CELL_SIZE}
              rx="2"
              fill={props.state.slots[slot].get() ?? "#e2e8f0"}
              stroke={props.state.probes[slot].get() ? "#0f172a" : "#cbd5e1"}
              stroke-width={props.state.probes[slot].get() ? "1.5" : "1"}
            />
          );
        })}
      </svg>

      <p>{props.state.frameMessage()}</p>
    </div>
  );
};

export const ProbingDemo = () => {
  let probeObserver: IntersectionObserver | null = null;
  const [probesRunning, setProbesRunning] = createSignal(false);
  const [expanded, setExpanded] = createSignal(false);
  const [playbackState, setPlaybackState] = createSignal<"playing" | "paused" | "ended">("playing");
  const probeStates = {
    linear: createProbeAnimationState("linear"),
    triangular: createProbeAnimationState("triangular"),
    quadratic: createProbeAnimationState("quadratic"),
    randomized: createProbeAnimationState("randomized"),
  };
  let currentFrameStep = 0;

  const observeProbes = (el: HTMLDivElement) => {
    if (!probeObserver) {
      probeObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            setProbesRunning(entry.isIntersecting);
          }
        },
        { threshold: 0.15 },
      );
    }
    probeObserver.observe(el);
  };

  const syncVisibleStates = () => {
    probeStates.linear.syncToLoopStep(currentFrameStep);
    probeStates.triangular.syncToLoopStep(currentFrameStep);

    if (expanded()) {
      probeStates.quadratic.syncToLoopStep(currentFrameStep);
      probeStates.randomized.syncToLoopStep(currentFrameStep);
    }
  };

  const resetAllStates = () => {
    currentFrameStep = 0;
    probeStates.linear.reset();
    probeStates.triangular.reset();
    probeStates.quadratic.reset();
    probeStates.randomized.reset();
  };

  onMount(() => {
    syncVisibleStates();

    const id = window.setInterval(() => {
      if (playbackState() === "playing" && probesRunning()) {
        if (currentFrameStep >= PROBE_LOOP_STEPS) {
          setPlaybackState("ended");
          return;
        }

        currentFrameStep += 1;
        syncVisibleStates();
      }
    }, PROBE_TICK_MS);

    onCleanup(() => {
      window.clearInterval(id);
      probeObserver?.disconnect();
    });
  });

  const handleReset = () => {
    resetAllStates();
    syncVisibleStates();
    setPlaybackState("playing");
  };

  const handleTogglePlayState = () => {
    const transition = { playing: "paused", paused: "playing", ended: "ended" } as const;
    setPlaybackState((value) => transition[value]);
  };

  const handleToggleExpanded = () => {
    setExpanded((value) => {
      const next = !value;
      if (next) {
        probeStates.quadratic.syncToLoopStep(currentFrameStep);
        probeStates.randomized.syncToLoopStep(currentFrameStep);
      }
      return next;
    });
  };

  return (
    <div ref={observeProbes} class="probes">
      <ul>
        <li>
          <ProbeAnimation title="Linear Probing" state={probeStates.linear} />
        </li>
        <li>
          <ProbeAnimation title="Triangular Probing" state={probeStates.triangular} />
        </li>

        <Show when={expanded()}>
          <li>
            <ProbeAnimation title="Quadratic Probing" state={probeStates.quadratic} />
          </li>
          <li>
            <ProbeAnimation title="Randomized Probing" state={probeStates.randomized} />
          </li>
        </Show>
      </ul>

      <menu>
        <button type="button" class="button" disabled={playbackState() === "ended"} onClick={handleTogglePlayState}>
          {{ playing: "Pause", paused: "Play", ended: "Ended" }[playbackState()]}
        </button>
        <button type="button" class="button" onClick={handleReset}>
          Reset
        </button>
        <button type="button" class="button" onClick={handleToggleExpanded}>
          {expanded() ? "Hide" : "Show More"}
        </button>
      </menu>
    </div>
  );
};
