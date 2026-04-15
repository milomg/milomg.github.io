import { For, createMemo, createSignal, type Accessor } from "solid-js";
import "./RobinHoodPslInsert.css";

type InsertionStep = {
  home: number;
  homeBits: boolean[];
  slotHomes: (number | null)[];
  psl: (number | null)[];
  highlightIndex?: number;
  highlightType?: "home" | "insert" | "block";
};

type AnimationState = "idle" | "playing" | "paused";

const BITS_PER_BLOCK = 4;
const CAPACITY = 32;
const TOTAL_SLOTS = CAPACITY;
const NUM_BLOCKS = Math.ceil(TOTAL_SLOTS / BITS_PER_BLOCK);
const SLOT_INDEXES = Array.from({ length: TOTAL_SLOTS }, (_, i) => i);
const BLOCK_INDEXES = Array.from({ length: NUM_BLOCKS }, (_, i) => i);

const RH_INSERT_HOMES: number[] = [2, 2, 2, 5, 6, 6, 5, 18, 18, 22, 22, 27, 30, 31];

const createInsertionSequence = (): InsertionStep[] => {
  const steps: InsertionStep[] = [];
  const homeBits: boolean[] = Array(TOTAL_SLOTS).fill(false);
  const slotHomes: (number | null)[] = Array(TOTAL_SLOTS).fill(null);
  const psl: (number | null)[] = Array(TOTAL_SLOTS).fill(null);

  steps.push({
    home: 0,
    homeBits: [...homeBits],
    slotHomes: [...slotHomes],
    psl: [...psl],
  });

  for (const home of RH_INSERT_HOMES) {
    steps.push({
      home,
      homeBits: [...homeBits],
      slotHomes: [...slotHomes],
      psl: [...psl],
      highlightIndex: home,
      highlightType: "home",
    });

    homeBits[home] = true;

    let incomingHome = home;
    let incomingPsl = 0;
    let placed = false;

    for (let pos = home; pos < TOTAL_SLOTS; pos += 1) {
      if (slotHomes[pos] === null) {
        slotHomes[pos] = incomingHome;
        psl[pos] = incomingPsl;
        placed = true;

        steps.push({
          home,
          homeBits: [...homeBits],
          slotHomes: [...slotHomes],
          psl: [...psl],
          highlightIndex: pos,
          highlightType: "insert",
        });
        break;
      }

      const residentPsl = psl[pos] ?? 0;
      if (residentPsl < incomingPsl) {
        const displacedHome = slotHomes[pos] ?? incomingHome;
        const displacedPsl = residentPsl;

        slotHomes[pos] = incomingHome;
        psl[pos] = incomingPsl;

        incomingHome = displacedHome;
        incomingPsl = displacedPsl + 1;
      } else {
        incomingPsl += 1;
      }
    }

    if (!placed) {
      steps.push({
        home,
        homeBits: [...homeBits],
        slotHomes: [...slotHomes],
        psl: [...psl],
        highlightIndex: TOTAL_SLOTS - 1,
        highlightType: "block",
      });
    }
  }

  return steps;
};

const createBooleanCells = (length: number) => {
  return Array.from({ length }, () => createSignal(false));
};

const createNullableNumberCells = (length: number) => {
  return Array.from({ length }, () => createSignal<number | null>(null));
};

const createRhAnimationState = (steps: InsertionStep[]) => {
  const homeCells = createBooleanCells(TOTAL_SLOTS);
  const pslCells = createNullableNumberCells(TOTAL_SLOTS);
  const slotHomeCells = createNullableNumberCells(TOTAL_SLOTS);
  const [baseHomeHighlights, setBaseHomeHighlights] = createSignal<number[]>([]);
  const [basePslHighlights, setBasePslHighlights] = createSignal<number[]>([]);

  const syncToStep = (stepIndex: number) => {
    const frame = steps[stepIndex] ?? steps[0];

    for (let i = 0; i < TOTAL_SLOTS; i += 1) {
      homeCells[i][1](frame.homeBits[i]);
      pslCells[i][1](frame.psl[i]);
      slotHomeCells[i][1](frame.slotHomes[i]);
    }

    setBaseHomeHighlights([frame.home]);
    setBasePslHighlights(frame.highlightIndex === undefined ? [] : [frame.highlightIndex]);
  };

  return {
    homeBits: homeCells.map(([get]) => get),
    pslValues: pslCells.map(([get]) => get),
    slotHomes: slotHomeCells.map(([get]) => get),
    baseHomeHighlights,
    basePslHighlights,
    syncToStep,
  };
};

const HomeBitsRow = (props: { bits: Accessor<boolean>[]; highlightSet: Accessor<Set<number>>; onHoverBit: (index: number | null) => void }) => {
  return (
    <div class="bit-blocks">
      <For each={BLOCK_INDEXES}>
        {(block) => {
          const blockStart = block * BITS_PER_BLOCK;
          const blockBits = Array.from({ length: BITS_PER_BLOCK }, (_, i) => blockStart + i).filter((i) => i < TOTAL_SLOTS);

          return (
            <div class="bit-row">
              <For each={blockBits}>
                {(absoluteIdx) => {
                  const isSet = () => props.bits[absoluteIdx]();
                  const isHighlight = () => props.highlightSet().has(absoluteIdx);

                  return (
                    <div
                      class={`bit ${isSet() ? "set" : "clear"} ${isHighlight() ? "highlight" : ""}`}
                      title={`Homes[${absoluteIdx}] = ${isSet() ? 1 : 0}`}
                      onMouseEnter={() => props.onHoverBit(absoluteIdx)}
                      onMouseLeave={() => props.onHoverBit(null)}
                    >
                      {isSet() ? "1" : "0"}
                    </div>
                  );
                }}
              </For>
            </div>
          );
        }}
      </For>
    </div>
  );
};

const PslRow = (props: { pslValues: Accessor<number | null>[]; highlightSet: Accessor<Set<number>>; rangeSet: Accessor<Set<number>> }) => {
  return (
    <div class="bit-blocks">
      <For each={BLOCK_INDEXES}>
        {(block) => {
          const blockStart = block * BITS_PER_BLOCK;
          const blockIndexes = Array.from({ length: BITS_PER_BLOCK }, (_, i) => blockStart + i).filter((i) => i < TOTAL_SLOTS);

          return (
            <div class="bit-row">
              <For each={blockIndexes}>
                {(absoluteIdx) => {
                  const value = () => props.pslValues[absoluteIdx]();
                  const isHighlight = () => props.highlightSet().has(absoluteIdx);
                  const inRange = () => props.rangeSet().has(absoluteIdx);

                  return (
                    <div
                      class={`bit psl ${value() === null ? "clear" : "set"} ${inRange() ? "range" : ""} ${isHighlight() ? "highlight" : ""}`}
                      title={`PSL[${absoluteIdx}] = ${value() ?? "-"}`}
                    >
                      {value() ?? "-"}
                    </div>
                  );
                }}
              </For>
            </div>
          );
        }}
      </For>
    </div>
  );
};

export const RobinHoodPslInsert = () => {
  const steps = createInsertionSequence();
  const rhState = createRhAnimationState(steps);
  rhState.syncToStep(0);

  const [currentStep, setCurrentStep] = createSignal(0);
  const [animationState, setAnimationState] = createSignal<AnimationState>("idle");
  const [hoveredHomeBit, setHoveredHomeBit] = createSignal<number | null>(null);

  const jumpToStep = (index: number) => {
    const clamped = Math.max(0, Math.min(index, steps.length - 1));
    setCurrentStep(clamped);
    rhState.syncToStep(clamped);
  };

  const playAnimation = async () => {
    setAnimationState("playing");
    for (let i = currentStep(); i < steps.length; i += 1) {
      if (animationState() !== "playing") break;
      jumpToStep(i);
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    if (animationState() === "playing") {
      setAnimationState("idle");
    }
  };

  const togglePlayPause = () => {
    if (animationState() === "playing") {
      setAnimationState("paused");
      return;
    }

    void playAnimation();
  };

  const reset = () => {
    setAnimationState("idle");
    jumpToStep(0);
  };

  const nextStep = () => {
    if (animationState() === "playing") return;
    jumpToStep(currentStep() + 1);
  };

  const prevStep = () => {
    if (animationState() === "playing") return;
    jumpToStep(currentStep() - 1);
  };

  const hoveredRunBounds = createMemo(() => {
    const home = hoveredHomeBit();
    if (home === null) return null;

    const slotHomes = SLOT_INDEXES.map((i) => rhState.slotHomes[i]());
    let runStart = -1;
    let runEnd = -1;

    for (let i = 0; i < slotHomes.length; i += 1) {
      if (slotHomes[i] !== home) continue;
      if (runStart === -1) runStart = i;
      runEnd = i;
    }

    if (runStart === -1) return null;
    return { runStart, runEnd };
  });

  const homeHighlightSet = createMemo(() => {
    const merged = new Set<number>(rhState.baseHomeHighlights());
    const hovered = hoveredHomeBit();
    if (hovered !== null) merged.add(hovered);
    return merged;
  });

  const pslHighlightSet = createMemo(() => {
    const merged = new Set<number>(rhState.basePslHighlights());
    const bounds = hoveredRunBounds();
    if (bounds) merged.add(bounds.runEnd);
    return merged;
  });

  const pslRangeSet = createMemo(() => {
    const bounds = hoveredRunBounds();
    const range = new Set<number>();
    if (!bounds) return range;

    for (let i = bounds.runStart; i <= bounds.runEnd; i += 1) {
      range.add(i);
    }
    return range;
  });

  return (
    <section class="widget insert-bits rh-psl" aria-label="Robin Hood PSL insertion demo">
      <header>
        <strong>Robin Hood PSL Inserts</strong>
      </header>

      <div class="visualization">
        <div class="bit-block-labels">
          <For each={BLOCK_INDEXES}>{() => <div class="block-label-cell" />}</For>
        </div>

        <HomeBitsRow bits={rhState.homeBits} highlightSet={homeHighlightSet} onHoverBit={setHoveredHomeBit} />
        <PslRow pslValues={rhState.pslValues} highlightSet={pslHighlightSet} rangeSet={pslRangeSet} />
      </div>

      <menu>
        <button type="button" class="button" onClick={reset} disabled={animationState() === "playing"}>
          ⏮ Reset
        </button>
        <button type="button" class="button" onClick={prevStep} disabled={currentStep() === 0 || animationState() === "playing"}>
          ⏪ Previous
        </button>
        <button type="button" class="button" onClick={togglePlayPause}>
          {animationState() === "playing" ? "⏸ Pause" : "▶ Play"}
        </button>
        <button type="button" class="button" onClick={nextStep} disabled={currentStep() === steps.length - 1 || animationState() === "playing"}>
          ⏩ Next
        </button>
        <span class="step-counter">
          Step {currentStep() + 1} / {steps.length}
        </span>
      </menu>
    </section>
  );
};
