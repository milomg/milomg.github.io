import { Title } from "@solidjs/meta";
import { Globals } from "~/components/global";
import { Nav } from "~/components/nav";
import { clientOnly } from "@solidjs/start";
import { MDXDefault } from "~/components/mdx-default";
import { MDXComponents } from "mdx/types";
import { Show, createSignal, onCleanup, onMount } from "solid-js";
import MDXComponent from "~/blogs/hashmap.mdx";
import "../blog.css";
import "./hashmap.css";

const Giscus = clientOnly(() => import("~/components/giscus"));

type HashItem = {
  key: string;
};

type PositionedHashItem = HashItem & {
  x: number;
  y: number;
};

type BucketChain = {
  slot: number;
  items: HashItem[];
};

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

const mix32 = (value: number) => {
  let x = value | 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
};

class Mulberry32 {
  constructor(private state: number) {}

  next() {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  reset(seed: number) {
    this.state = seed;
  }
}

const PROBE_INDEXES: Record<ProbeMode, (home: number, step: number) => number> = {
  linear: (home, step) => (home + step) % TABLE_SIZE,
  triangular: (home, step) => (home + (step * (step + 1)) / 2) % TABLE_SIZE,
  quadratic: (home, step) => (home + step * step) % TABLE_SIZE,
  randomized: (home, step) => mix32(home ^ mix32(step ^ 0x9e3779b9)) % TABLE_SIZE,
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

const ShowMoreProbing = () => {
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

const InteractiveChain = () => {
  const slotCount = 27;
  const slotWidth = 24;
  const slotStartX = 14;
  const firstBucketY = 52;
  const cellSize = 24;
  const nodeHeight = cellSize * 2;
  const nodeGap = 14;

  const chains: BucketChain[] = [
    { slot: 1, items: [{ key: "17" }, { key: "54" }] },
    { slot: 4, items: [{ key: "2" }, { key: "9" }, { key: "15" }, { key: "31" }] },
    { slot: 11, items: [{ key: "40" }, { key: "52" }] },
    { slot: 14, items: [{ key: "1" }, { key: "6" }] },
    { slot: 21, items: [{ key: "2" }, { key: "8" }] },
    { slot: 23, items: [{ key: "4" }, { key: "7" }, { key: "16" }, { key: "18" }] },
    { slot: 26, items: [{ key: "3" }, { key: "6" }] },
  ];

  const [activeChain, setActiveChain] = createSignal(-1);

  const positionedChains = chains.map((chain) => {
    const baseX = slotStartX + chain.slot * slotWidth;

    return {
      slot: chain.slot,
      items: chain.items.map((item, index) => ({
        ...item,
        x: baseX,
        y: firstBucketY + index * (nodeHeight + nodeGap),
      })),
    };
  });

  const linkPath = (from: PositionedHashItem, to: PositionedHashItem) => {
    const startX = from.x + cellSize / 2;
    const startY = from.y + cellSize * 1.5;
    const endX = to.x + cellSize / 2;
    const endY = to.y - 2;
    return `M${startX} ${startY} L${endX} ${endY}`;
  };

  return (
    <div>
      <svg
        viewBox="0 0 700 320"
        width="100%"
        style={{
          "max-width": "760px",
          display: "block",
          margin: "1.25rem auto 0.75rem",
        }}
        aria-label="Hash table chain visualization"
      >
        <defs>
          <marker id="hmarrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="3.5" markerHeight="3.5" orient="auto-start-reverse">
            <path d="M0 0L8 4L0 8z" fill="context-stroke" />
          </marker>
        </defs>

        <rect x="12" y="16" width="650" height="24" fill="#ffffff" stroke="#222" stroke-width="2" />

        {Array.from({ length: slotCount - 1 }, (_, i) => 38 + i * slotWidth).map((x) => (
          <line x1={x} y1="16" x2={x} y2="40" stroke="#222" stroke-width="2" />
        ))}

        {positionedChains.map((chain, slot) => {
          const isActive = () => activeChain() === slot;
          const centerX = chain.items[0].x + 12;
          return (
            <g
              onMouseEnter={() => setActiveChain(slot)}
              onFocus={() => setActiveChain(slot)}
              fill={isActive() ? "#d9480f" : "#111"}
              stroke={isActive() ? "#d9480f" : "#111"}
            >
              <circle cx={centerX} cy="28" r="3" />
              <line x1={centerX} y1="31" x2={chain.items[0].x + 12} y2={chain.items[0].y - 2} stroke-width="1.7" marker-end="url(#hmarrow)" />

              {chain.items.map((item, index) => (
                <g stroke-width="2">
                  <rect x={item.x} y={item.y} width={cellSize} height={cellSize} fill={isActive() ? "#ffe9d5" : "#f0f4ff"} stroke-width="2" rx="2">
                    <title>{`${item.key}`}</title>
                  </rect>
                  <rect
                    x={item.x}
                    y={item.y + cellSize}
                    width={cellSize}
                    height={cellSize}
                    fill={isActive() ? "#fff4e6" : "#f0f4ff"}
                    stroke-width="2"
                    rx="2"
                  />
                  <text x={item.x + cellSize / 2} y={item.y + cellSize / 2} text-anchor="middle" font-size="8" fill="#111" stroke="none">
                    {item.key}
                  </text>

                  <Show when={index < chain.items.length - 1}>
                    <circle cx={item.x + cellSize / 2} cy={item.y + cellSize * 1.5} r="2" />
                    <path d={linkPath(item, chain.items[index + 1])} stroke-width="1.7" marker-end="url(#hmarrow)" />
                  </Show>
                </g>
              ))}
            </g>
          );
        })}
      </svg>

      <Show when={chains[activeChain()]}>
        {(chain) => (
          <p style={{ margin: "0 auto 1rem", "max-width": "760px", "font-size": "0.92rem", color: "#334155" }}>
            Bucket {chain().slot}:{" "}
            {chain()
              .items.map((item) => item.key)
              .join(" -> ")}
          </p>
        )}
      </Show>
    </div>
  );
};

const MDXProps: MDXComponents = {
  ...MDXDefault,
  InteractiveChain,
  ShowMoreProbing,
};

export default function Page() {
  return (
    <Globals>
      <Title>High Performance Hashmaps · milomg.dev</Title>
      <Nav />
      <div id="scroller">
        <div class="column">
          <MDXComponent components={MDXProps} />
          <Giscus />
        </div>
      </div>
    </Globals>
  );
}
