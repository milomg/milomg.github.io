import { For, createMemo, createSignal, type Accessor } from "solid-js";
import "./RSQFInsert.css";

type InsertionStep = {
  home: number;
  homes: boolean[];
  ends: boolean[];
  offsets: number[];
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

const QF_INSERT_HOMES: number[] = [2, 2, 2, 5, 6, 6, 5, 18, 18, 22, 22, 27, 30, 31];

const computeIntrusionOffsets = (slotHomes: (number | null)[]) => {
  const offsets: number[] = Array(NUM_BLOCKS).fill(0);

  for (let block = 0; block < NUM_BLOCKS; block += 1) {
    const blockStart = block * BITS_PER_BLOCK;
    const blockEnd = Math.min(blockStart + BITS_PER_BLOCK, TOTAL_SLOTS);

    let intrusions = 0;
    for (let i = blockStart; i < blockEnd; i += 1) {
      const home = slotHomes[i];
      if (home === null) continue;
      if (home < blockStart) intrusions += 1;
    }

    offsets[block] = intrusions;
  }

  return offsets;
};

const createInsertionSequence = (): InsertionStep[] => {
  const steps: InsertionStep[] = [];

  let slotHomes: (number | null)[] = Array(TOTAL_SLOTS).fill(null);
  let homes: boolean[] = Array(TOTAL_SLOTS).fill(false);
  let ends: boolean[] = Array(TOTAL_SLOTS).fill(false);

  steps.push({
    home: 0,
    homes: [...homes],
    ends: [...ends],
    offsets: computeIntrusionOffsets(slotHomes),
  });

  for (const home of QF_INSERT_HOMES) {
    steps.push({
      home,
      homes: [...homes],
      ends: [...ends],
      offsets: computeIntrusionOffsets(slotHomes),
      highlightIndex: home,
      highlightType: "home",
    });

    if (slotHomes[home] === null) {
      slotHomes[home] = home;
      homes[home] = true;
      ends[home] = true;

      steps.push({
        home,
        homes: [...homes],
        ends: [...ends],
        offsets: computeIntrusionOffsets(slotHomes),
        highlightIndex: home,
        highlightType: "insert",
      });
      continue;
    }

    let runEnd = home;
    while (runEnd < TOTAL_SLOTS - 1 && slotHomes[runEnd + 1] !== null && ends[runEnd] === false) {
      runEnd += 1;
    }

    const insertPos = runEnd + 1;
    if (insertPos >= TOTAL_SLOTS) {
      steps.push({
        home,
        homes: [...homes],
        ends: [...ends],
        offsets: computeIntrusionOffsets(slotHomes),
        highlightIndex: runEnd,
        highlightType: "block",
      });
      continue;
    }

    let emptySlot = insertPos;
    while (emptySlot < TOTAL_SLOTS && slotHomes[emptySlot] !== null) emptySlot += 1;

    if (emptySlot >= TOTAL_SLOTS) {
      steps.push({
        home,
        homes: [...homes],
        ends: [...ends],
        offsets: computeIntrusionOffsets(slotHomes),
        highlightIndex: insertPos,
        highlightType: "block",
      });
      continue;
    }

    if (emptySlot > insertPos) {
      for (let i = emptySlot; i > insertPos; i -= 1) {
        slotHomes[i] = slotHomes[i - 1];
        ends[i] = ends[i - 1];
      }
      ends[insertPos] = false;
    }

    slotHomes[insertPos] = home;
    ends[runEnd] = false;
    ends[insertPos] = true;

    steps.push({
      home,
      homes: [...homes],
      ends: [...ends],
      offsets: computeIntrusionOffsets(slotHomes),
      highlightIndex: insertPos,
      highlightType: "insert",
    });
  }

  return steps;
};

const rankBits = (bits: boolean[], indexExclusive: number) => {
  const stop = Math.min(indexExclusive, bits.length);
  let total = 0;
  for (let i = 0; i < stop; i += 1) {
    if (bits[i]) total += 1;
  }
  return total;
};

const selectBits = (bits: boolean[], rankZeroBased: number): number | null => {
  if (rankZeroBased < 0) return null;
  let seen = 0;
  for (let i = 0; i < bits.length; i += 1) {
    if (!bits[i]) continue;
    if (seen === rankZeroBased) return i;
    seen += 1;
  }
  return null;
};

const runEndForBucket = (bucket: number, homes: boolean[], ends: boolean[], offsets: number[]) => {
  if (bucket < 0) return 0;

  const rankInclusive = rankBits(homes, bucket + 1);
  if (rankInclusive === 0) {
    const bucketBlock = Math.floor(bucket / BITS_PER_BLOCK);
    const bucketIntra = bucket % BITS_PER_BLOCK;
    const blockOffset = offsets[bucketBlock] ?? 0;
    if (blockOffset <= bucketIntra) return bucket;
    return bucketBlock * BITS_PER_BLOCK + blockOffset - 1;
  }

  return selectBits(ends, rankInclusive - 1) ?? bucket;
};

const findRunStartForHome = (home: number, homes: boolean[], ends: boolean[], offsets: number[]) => {
  if (!homes[home]) return null;
  if (home === 0) return 0;

  const blockIndex = Math.floor(home / BITS_PER_BLOCK);
  const blockStart = blockIndex * BITS_PER_BLOCK;
  const shiftedStart = blockStart + (offsets[blockIndex] ?? 0);
  const runStart = runEndForBucket(home - 1, homes, ends, offsets) + 1;
  return Math.max(runStart, shiftedStart, home);
};

const createBooleanCells = (length: number) => {
  return Array.from({ length }, () => createSignal(false));
};

const createNumberCells = (length: number) => {
  return Array.from({ length }, () => createSignal(0));
};

const createQfAnimationState = (steps: InsertionStep[]) => {
  const homesCells = createBooleanCells(TOTAL_SLOTS);
  const endsCells = createBooleanCells(TOTAL_SLOTS);
  const offsetCells = createNumberCells(NUM_BLOCKS);
  const [baseHomeHighlights, setBaseHomeHighlights] = createSignal<number[]>([]);
  const [baseRunEndHighlights, setBaseRunEndHighlights] = createSignal<number[]>([]);

  const syncToStep = (stepIndex: number) => {
    const frame = steps[stepIndex] ?? steps[0];

    for (let i = 0; i < TOTAL_SLOTS; i += 1) {
      homesCells[i][1](frame.homes[i]);
      endsCells[i][1](frame.ends[i]);
    }

    for (let i = 0; i < NUM_BLOCKS; i += 1) {
      offsetCells[i][1](frame.offsets[i] ?? 0);
    }

    setBaseHomeHighlights([frame.home]);
    setBaseRunEndHighlights(frame.highlightIndex === undefined ? [] : [frame.highlightIndex]);
  };

  const snapshotHomes = () => SLOT_INDEXES.map((i) => homesCells[i][0]());
  const snapshotEnds = () => SLOT_INDEXES.map((i) => endsCells[i][0]());
  const snapshotOffsets = () => BLOCK_INDEXES.map((i) => offsetCells[i][0]());

  const homeBits = homesCells.map(([get]) => get);
  const endBits = endsCells.map(([get]) => get);
  const offsets = offsetCells.map(([get]) => get);

  return {
    homeBits,
    endBits,
    offsets,
    baseHomeHighlights,
    baseRunEndHighlights,
    syncToStep,
    snapshotHomes,
    snapshotEnds,
    snapshotOffsets,
  };
};

const BlockLabelsRow = (props: { offsets: Accessor<number>[] }) => {
  return (
    <div class="bit-block-labels">
      <For each={BLOCK_INDEXES}>
        {(block) => <div class="block-label-cell block-offset-badge">ofs {props.offsets[block]()}</div>}
      </For>
    </div>
  );
};

type BitRowProps = {
  label: string;
  bits: Accessor<boolean>[];
  highlightSet: Accessor<Set<number>>;
  rangeSet: Accessor<Set<number>>;
  hoverEnabled?: boolean;
  onHoverBit?: (index: number | null) => void;
};

const BitRow = (props: BitRowProps) => {
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
                  const inRange = () => props.rangeSet().has(absoluteIdx);

                  return (
                    <div
                      class={`bit ${isSet() ? "set" : "clear"} ${inRange() ? "range" : ""} ${isHighlight() ? "highlight" : ""}`}
                      title={`${props.label}[${absoluteIdx}] = ${isSet() ? 1 : 0}`}
                      onMouseEnter={() => {
                        if (props.hoverEnabled) props.onHoverBit?.(absoluteIdx);
                      }}
                      onMouseLeave={() => {
                        if (props.hoverEnabled) props.onHoverBit?.(null);
                      }}
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

export const RSQFInsert = () => {
  const steps = createInsertionSequence();
  const qfState = createQfAnimationState(steps);
  qfState.syncToStep(0);

  const [currentStep, setCurrentStep] = createSignal(0);
  const [animationState, setAnimationState] = createSignal<AnimationState>("idle");
  const [hoveredHomeBit, setHoveredHomeBit] = createSignal<number | null>(null);

  const jumpToStep = (index: number) => {
    const clamped = Math.max(0, Math.min(index, steps.length - 1));
    setCurrentStep(clamped);
    qfState.syncToStep(clamped);
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

    const homes = qfState.snapshotHomes();
    const ends = qfState.snapshotEnds();
    const offsets = qfState.snapshotOffsets();

    if (home < 0 || home >= homes.length) return null;

    const runStart = findRunStartForHome(home, homes, ends, offsets);
    if (runStart === null) return null;

    const runEnd = runEndForBucket(home, homes, ends, offsets);
    if (runEnd < 0 || runEnd >= ends.length) return null;
    if (runStart > runEnd) return null;

    return { runStart, runEnd };
  });

  const homeHighlightSet = createMemo(() => {
    const merged = new Set<number>(qfState.baseHomeHighlights());
    const hovered = hoveredHomeBit();
    if (hovered !== null) merged.add(hovered);
    return merged;
  });

  const runEndHighlightSet = createMemo(() => {
    const merged = new Set<number>(qfState.baseRunEndHighlights());
    const bounds = hoveredRunBounds();
    if (bounds) merged.add(bounds.runEnd);
    return merged;
  });

  const runRangeSet = createMemo(() => {
    const bounds = hoveredRunBounds();
    const range = new Set<number>();
    if (!bounds) return range;

    for (let i = bounds.runStart; i <= bounds.runEnd; i += 1) {
      range.add(i);
    }
    return range;
  });

  return (
    <section class="widget wide insert-bits rsqf-insert" aria-label="RSQF insertion demo">
      <header>
        <strong>RSQF Inserts</strong>
      </header>

      <div class="visualization">
        <BlockLabelsRow offsets={qfState.offsets} />
        <BitRow
          label="Homes"
          bits={qfState.homeBits}
          highlightSet={homeHighlightSet}
          rangeSet={() => new Set<number>()}
          hoverEnabled
          onHoverBit={setHoveredHomeBit}
        />
        <BitRow label="Run Ends" bits={qfState.endBits} highlightSet={runEndHighlightSet} rangeSet={runRangeSet} />
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
