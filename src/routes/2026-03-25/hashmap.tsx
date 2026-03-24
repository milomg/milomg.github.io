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

type ProbeMode = "linear" | "quadratic";

type ProbeFrame = {
  slots: boolean[];
  probes: number[];
  message: string;
  inserted: number;
};

const TABLE_SIZE = 1200;
const INSERT_COUNT = 1000;
const AUTO_PAUSE_INSERTION = 900;
const PROBE_TABLE_COLS = 40;
const PROBE_TABLE_ROWS = 30;
const PROBE_CELL_SIZE = 14;
const PROBE_CELL_GAP = 3;
const PROBE_SLOT_INDEXES = Array.from({ length: TABLE_SIZE }, (_, i) => i);

let probeObserver: IntersectionObserver | null = null;
const visibleProbeSections = new Set<Element>();
const [probesRunning, setProbesRunning] = createSignal(false);

const createEmptyProbeFrame = (): ProbeFrame => ({
  slots: Array(TABLE_SIZE).fill(false),
  probes: [],
  message: "Empty table",
  inserted: 0,
});

const createProbeSimulator = (mode: ProbeMode) => {
  let slots: boolean[] = Array(TABLE_SIZE).fill(false);
  let rngState = 0x6d2b79f5;
  let inserted = 0;
  let currentFrame: ProbeFrame = createEmptyProbeFrame();

  const nextRandom = () => {
    // Mulberry32 PRNG: tiny, deterministic, and good enough for visualization patterns.
    rngState = (rngState + 0x6d2b79f5) | 0;
    let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const buildNextInsertionFrame = (): ProbeFrame => {
    const visited: number[] = [];
    const home = Math.floor(nextRandom() * TABLE_SIZE);

    for (let i = 0; i < TABLE_SIZE; i += 1) {
      const next = mode === "linear" ? (home + i) % TABLE_SIZE : (home + i * i) % TABLE_SIZE;

      visited.push(next);
      if (!slots[next]) {
        slots[next] = true;
        inserted += 1;
        return {
          slots: slots,
          probes: visited,
          message: `${mode === "linear" ? "Linear" : "Quadratic"}: inserted ${inserted} / ${INSERT_COUNT}`,
          inserted,
        };
      }
    }

    return {
      slots: slots,
      probes: [],
      message: `${mode === "linear" ? "Linear" : "Quadratic"}: inserted ${inserted} / ${INSERT_COUNT}`,
      inserted,
    };
  };

  return {
    remaining() {
      return INSERT_COUNT - inserted;
    },
    current() {
      return currentFrame;
    },
    reset() {
      slots = Array(TABLE_SIZE).fill(false);
      rngState = 0x6d2b79f5;
      inserted = 0;
      currentFrame = createEmptyProbeFrame();
    },
    advance() {
      if (this.remaining() === 0) {
        throw new Error("No more insertions remaining");
      }
      currentFrame = buildNextInsertionFrame();
    },
  };
};

const ProbeAnimation = (props: { mode: ProbeMode; title: string }) => {
  const simulator = createProbeSimulator(props.mode);
  const [frameMessage, setFrameMessage] = createSignal("");
  const [manuallyPaused, setManuallyPaused] = createSignal(false);
  let sectionRef: HTMLDivElement | undefined;

  const startObserving = (el: Element) => {
    if (!probeObserver) {
      probeObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              visibleProbeSections.add(entry.target);
            } else {
              visibleProbeSections.delete(entry.target);
            }
          }

          setProbesRunning(visibleProbeSections.size > 0);
        },
        { threshold: 0.15 },
      );
    }

    probeObserver.observe(el);
  };

  const palette = [
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
  const slots = PROBE_SLOT_INDEXES.map(() => {
    const [get, set] = createSignal<(typeof palette)[number] | undefined>(undefined);
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
        slots[i].set(palette[0]);
      } else {
        slots[i].set(palette[((chainPosition - 1) % (palette.length - 1)) + 1]);
      }
    }

    for (let i = 0; i < nextFrame.probes.length; i += 1) {
      probes[nextFrame.probes[i]].set(true);
    }

    const chainLength = chainCount === 0 ? 0 : filledCount / chainCount;
    setFrameMessage(`${nextFrame.message} -  avg chain length ${chainLength.toFixed(2)}`);
  };

  onMount(() => {
    if (sectionRef) startObserving(sectionRef);

    const id = window.setInterval(() => {
      if (!probesRunning() || manuallyPaused()) return;

      if (simulator.current().inserted >= AUTO_PAUSE_INSERTION) {
        setManuallyPaused(true);
        return;
      }

      const next = simulator.remaining();
      if (next === 0) {
        simulator.reset();
      } else {
        simulator.advance();
      }
      const nextFrame = simulator.current();
      applyFrameToSignals(nextFrame);

      if (nextFrame.inserted >= AUTO_PAUSE_INSERTION) {
        setManuallyPaused(true);
      }
    }, 20);

    onCleanup(() => {
      window.clearInterval(id);

      if (sectionRef) {
        visibleProbeSections.delete(sectionRef);
        probeObserver?.unobserve(sectionRef);
      }

      setProbesRunning(visibleProbeSections.size > 0);
    });
  });

  const gridWidth = PROBE_TABLE_COLS * PROBE_CELL_SIZE + (PROBE_TABLE_COLS - 1) * PROBE_CELL_GAP;
  const gridHeight = PROBE_TABLE_ROWS * PROBE_CELL_SIZE + (PROBE_TABLE_ROWS - 1) * PROBE_CELL_GAP;

  return (
    <div ref={sectionRef} class="widget">
      <header>
        <strong>{props.title}</strong>
        <menu>
          <button type="button" onClick={() => setManuallyPaused((value) => !value)} class="button">
            {manuallyPaused() ? "Play" : "Pause"}
          </button>
          <button
            type="button"
            onClick={() => {
              simulator.reset();
              const resetFrame = simulator.current();
              applyFrameToSignals(resetFrame);
              setManuallyPaused(false);
            }}
            class="button"
          >
            Reset
          </button>
        </menu>
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
              fill={slots[slot].get() ?? "#e2e8f0"}
              stroke={probes[slot].get() ? "#0f172a" : "#cbd5e1"}
              stroke-width={probes[slot].get() ? "1.5" : "1"}
            />
          );
        })}
      </svg>

      <p>{frameMessage()}</p>
    </div>
  );
};

const LinearProbing = () => <ProbeAnimation mode="linear" title="Linear Probing" />;

const QuadraticProbing = () => <ProbeAnimation mode="quadratic" title="Quadratic Probing" />;

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
  LinearProbing,
  QuadraticProbing,
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
