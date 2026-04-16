import { Show, createSignal } from "solid-js";

type CuckooItem = {
  key: number;
  homeA: number;
  homeB: number;
};

type ScanPhase = "idle" | "primary" | "secondary" | "kicking";

type KickStep =
  | {
      type: "swap";
      bucketIndex: number;
      slotIndex: number;
      insertedKey: number;
      evictedKey: number;
      nextBucketIndex: number;
    }
  | {
      type: "place";
      bucketIndex: number;
      slotIndex: number;
      key: number;
    };

type KickPlan = {
  inserted: boolean;
  displaced: number;
  steps: KickStep[];
  finalBuckets: number[][];
  nextKickCounter: number;
};

type TimelineStep = {
  run: () => void | Promise<void>;
  delayMs?: number;
};

type FloatingChipState = {
  key: number;
  x: number;
  y: number;
  active: boolean;
  variant: "kick" | "insert";
};

type ProbeUiState = {
  phase: ScanPhase;
  lane: number;
};

type KickUiState = {
  bucket: number;
  slot: number;
  targetBucket: number;
};

const CUCKOO_BUCKET_COUNT = 5;
const CUCKOO_BUCKET_CAPACITY = 3;
const CUCKOO_TOTAL_KEYS = 15;
const CUCKOO_MAX_KICKS = 16;
const CUCKOO_SCAN_TICK_MS = 190;
const CUCKOO_KICK_FLIGHT_MS = 360;
const CUCKOO_BOOTSTRAP_COUNT = 6;

const CUCKOO_BOOTSTRAP_LAYOUT: CuckooItem[] = [
  { key: 401, homeA: 0, homeB: 2 },
  { key: 402, homeA: 0, homeB: 2 },
  { key: 403, homeA: 0, homeB: 3 },
  { key: 404, homeA: 1, homeB: 2 },
  { key: 405, homeA: 1, homeB: 3 },
  { key: 406, homeA: 1, homeB: 4 },
];

const CUCKOO_INSERT_SEQUENCE: CuckooItem[] = [
  { key: 1, homeA: 2, homeB: 3 },
  { key: 2, homeA: 0, homeB: 1 },
  { key: 3, homeA: 2, homeB: 4 },
  { key: 4, homeA: 3, homeB: 4 },
  { key: 5, homeA: 0, homeB: 2 },
  { key: 6, homeA: 1, homeB: 3 },
  { key: 7, homeA: 4, homeB: 2 },
  { key: 8, homeA: 0, homeB: 4 },
  { key: 9, homeA: 1, homeB: 2 },
];

const buildCuckooItems = () => {
  return CUCKOO_INSERT_SEQUENCE.slice(0, CUCKOO_TOTAL_KEYS);
};

const buildBootstrapCuckooItems = () => {
  return CUCKOO_BOOTSTRAP_LAYOUT.slice(0, CUCKOO_BOOTSTRAP_COUNT);
};

const runTimeline = async (steps: TimelineStep[]) => {
  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i];
    await step.run();
    if (step.delayMs && step.delayMs > 0) {
      await new Promise<void>((resolve) => window.setTimeout(resolve, step.delayMs));
    }
  }
};

const pickEvictionSlot = (bucket: number[], tick: number) => {
  if (bucket.length === 0) return 0;
  return tick % bucket.length;
};

const cuckooMaskForBucket = (bucket: number[]) => {
  let mask = 0;
  for (let lane = 0; lane < CUCKOO_BUCKET_CAPACITY; lane += 1) {
    if (lane < bucket.length) {
      mask |= 1 << lane;
    }
  }
  return mask;
};

const firstZeroLaneFromMask = (mask: number) => {
  const capMask = (1 << CUCKOO_BUCKET_CAPACITY) - 1;
  const emptyMask = ~mask & capMask;
  if (emptyMask === 0) return -1;

  for (let lane = 0; lane < CUCKOO_BUCKET_CAPACITY; lane += 1) {
    if (emptyMask & (1 << lane)) return lane;
  }
  return -1;
};

const tryInsertWithKicks = (tables: number[][], item: CuckooItem, itemByKey: Map<number, CuckooItem>, kickTick: () => number) => {
  const first = tables[item.homeA];
  const second = tables[item.homeB];

  if (first.length < CUCKOO_BUCKET_CAPACITY) {
    first.push(item.key);
    return { inserted: true, displaced: 0 };
  }

  if (second.length < CUCKOO_BUCKET_CAPACITY) {
    second.push(item.key);
    return { inserted: true, displaced: 0 };
  }

  let currentKey = item.key;
  let targetBucket = first.length <= second.length ? item.homeA : item.homeB;
  let displaced = 0;

  for (let kick = 0; kick < CUCKOO_MAX_KICKS; kick += 1) {
    const bucket = tables[targetBucket];
    if (bucket.length < CUCKOO_BUCKET_CAPACITY) {
      bucket.push(currentKey);
      return { inserted: true, displaced };
    }

    const evictAt = pickEvictionSlot(bucket, kickTick());
    const evictedKey = bucket[evictAt];
    bucket[evictAt] = currentKey;
    displaced += 1;

    const evictedItem = itemByKey.get(evictedKey);
    if (!evictedItem) {
      return { inserted: false, displaced };
    }

    currentKey = evictedKey;
    targetBucket = evictedItem.homeA === targetBucket ? evictedItem.homeB : evictedItem.homeA;
  }

  return { inserted: false, displaced };
};

const buildKickPlan = (tables: number[][], item: CuckooItem, itemByKey: Map<number, CuckooItem>, startingKickCounter: number) => {
  let currentKey = item.key;
  let targetBucket = tables[item.homeA].length <= tables[item.homeB].length ? item.homeA : item.homeB;
  let displaced = 0;
  let localKickCounter = startingKickCounter;
  const steps: KickStep[] = [];

  for (let kick = 0; kick < CUCKOO_MAX_KICKS; kick += 1) {
    const bucket = tables[targetBucket];
    if (bucket.length < CUCKOO_BUCKET_CAPACITY) {
      steps.push({
        type: "place",
        bucketIndex: targetBucket,
        slotIndex: bucket.length,
        key: currentKey,
      });
      bucket.push(currentKey);
      return {
        inserted: true,
        displaced,
        steps,
        finalBuckets: tables,
        nextKickCounter: localKickCounter,
      } satisfies KickPlan;
    }

    localKickCounter += 1;
    const evictAt = pickEvictionSlot(bucket, localKickCounter);
    const evictedKey = bucket[evictAt];
    bucket[evictAt] = currentKey;
    displaced += 1;

    const evictedItem = itemByKey.get(evictedKey);
    if (!evictedItem) {
      return {
        inserted: false,
        displaced,
        steps,
        finalBuckets: tables,
        nextKickCounter: localKickCounter,
      } satisfies KickPlan;
    }

    const nextBucketIndex = evictedItem.homeA === targetBucket ? evictedItem.homeB : evictedItem.homeA;
    steps.push({
      type: "swap",
      bucketIndex: targetBucket,
      slotIndex: evictAt,
      insertedKey: currentKey,
      evictedKey,
      nextBucketIndex,
    });

    currentKey = evictedKey;
    targetBucket = nextBucketIndex;
  }

  return {
    inserted: false,
    displaced,
    steps,
    finalBuckets: tables,
    nextKickCounter: localKickCounter,
  } satisfies KickPlan;
};

export const CuckooInsert = () => {
  const items = buildCuckooItems();
  const bootstrapItems = buildBootstrapCuckooItems();
  const itemByKey = new Map([...bootstrapItems, ...items].map((item) => [item.key, item]));
  let kickCounter = 0;
  let scanToken = 0;
  const totalKeys = CUCKOO_TOTAL_KEYS;
  const cloneBuckets = (source: number[][]) => source.map((bucket) => [...bucket]);
  let gridRef: HTMLDivElement | undefined;
  const slotRefs: Array<Array<HTMLLIElement | undefined>> = Array.from({ length: CUCKOO_BUCKET_COUNT }, () =>
    Array.from({ length: CUCKOO_BUCKET_CAPACITY }, () => undefined),
  );
  const bucketTitleRefs: Array<HTMLHeadingElement | undefined> = Array.from({ length: CUCKOO_BUCKET_COUNT }, () => undefined);

  const createEmptyBuckets = () => Array.from({ length: CUCKOO_BUCKET_COUNT }, () => [] as number[]);
  const createSeededBuckets = () => {
    const seeded = createEmptyBuckets();
    let localKickTick = 0;

    for (let i = 0; i < bootstrapItems.length; i += 1) {
      tryInsertWithKicks(seeded, bootstrapItems[i], itemByKey, () => {
        localKickTick += 1;
        return localKickTick;
      });
    }

    return seeded;
  };

  const initialBuckets = createSeededBuckets();
  const [buckets, setBuckets] = createSignal<number[][]>(cloneBuckets(initialBuckets));
  const [keyCursor, setKeyCursor] = createSignal(0);
  const [probeUi, setProbeUi] = createSignal<ProbeUiState>({ phase: "idle", lane: -1 });
  const [activeItem, setActiveItem] = createSignal<CuckooItem | undefined>(undefined);
  const [kickUi, setKickUi] = createSignal<KickUiState>({ bucket: -1, slot: -1, targetBucket: -1 });
  const [isAnimating, setIsAnimating] = createSignal(false);
  const [floatingChip, setFloatingChip] = createSignal<FloatingChipState | undefined>(undefined);

  const pauseScan = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
  const nextFrame = () => new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));

  const centerForElement = (element: HTMLElement | undefined) => {
    if (!gridRef || !element) return null;
    const gridRect = gridRef.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left - gridRect.left + rect.width / 2,
      y: rect.top - gridRect.top + rect.height / 2,
    };
  };

  const slotCenter = (bucketIndex: number, slotIndex: number) => centerForElement(slotRefs[bucketIndex]?.[slotIndex]);
  const bucketTitleCenter = (bucketIndex: number) => centerForElement(bucketTitleRefs[bucketIndex]);

  const animateFloatingKey = async (
    key: number,
    from: { x: number; y: number } | null,
    to: { x: number; y: number } | null,
    token: number,
    variant: "kick" | "insert",
  ) => {
    if (!from || !to) return;

    await runTimeline([
      {
        run: async () => {
          if (token !== scanToken) return;
          setFloatingChip({ key, x: from.x, y: from.y, active: false, variant });
          await nextFrame();
        },
      },
      {
        run: async () => {
          if (token !== scanToken) return;
          setFloatingChip({ key, x: to.x, y: to.y, active: true, variant });
          await nextFrame();
        },
        delayMs: CUCKOO_KICK_FLIGHT_MS,
      },
      {
        run: () => {
          if (token !== scanToken) return;
          setFloatingChip(undefined);
        },
      },
    ]);
  };

  const animateInitialInsert = async (item: CuckooItem, bucketIndex: number, slotIndex: number, token: number) => {
    await nextFrame();
    await animateFloatingKey(item.key, bucketTitleCenter(bucketIndex), slotCenter(bucketIndex, slotIndex), token, "insert");
  };

  const runBitmapProbe = async (phase: Extract<ScanPhase, "primary" | "secondary">, mask: number, token: number) => {
    setProbeUi({ phase, lane: -1 });
    await pauseScan(CUCKOO_SCAN_TICK_MS);
    if (token !== scanToken) return -1;

    const lane = firstZeroLaneFromMask(mask);
    setProbeUi((value) => ({ ...value, lane }));
    await pauseScan(CUCKOO_SCAN_TICK_MS);
    if (token !== scanToken) return -1;

    return lane;
  };

  const animateKickPlan = async (steps: KickStep[], workingBuckets: number[][], token: number) => {
    for (let i = 0; i < steps.length; i += 1) {
      const step = steps[i];
      if (token !== scanToken) return;

      setProbeUi({ phase: "kicking", lane: -1 });

      if (step.type === "swap") {
        setKickUi({ bucket: step.bucketIndex, slot: step.slotIndex, targetBucket: step.nextBucketIndex });
        workingBuckets[step.bucketIndex][step.slotIndex] = step.insertedKey;
        setBuckets(cloneBuckets(workingBuckets));
        await nextFrame();
        await animateFloatingKey(
          step.evictedKey,
          slotCenter(step.bucketIndex, step.slotIndex),
          bucketTitleCenter(step.nextBucketIndex),
          token,
          "kick",
        );
      } else {
        setKickUi({ bucket: step.bucketIndex, slot: step.slotIndex, targetBucket: -1 });
        await nextFrame();
        await animateFloatingKey(step.key, bucketTitleCenter(step.bucketIndex), slotCenter(step.bucketIndex, step.slotIndex), token, "kick");
        workingBuckets[step.bucketIndex].push(step.key);
        setBuckets(cloneBuckets(workingBuckets));
      }

      await pauseScan(Math.floor(CUCKOO_SCAN_TICK_MS * 0.4));
    }
  };

  const insertNextKey = async () => {
    if (isAnimating()) return;
    const cursor = keyCursor();
    if (cursor >= totalKeys) return;

    const token = scanToken + 1;
    scanToken = token;
    setIsAnimating(true);

    const item = items[cursor];
    const nextBuckets = buckets().map((bucket) => [...bucket]);
    const primaryMask = cuckooMaskForBucket(nextBuckets[item.homeA]);
    const secondaryMask = cuckooMaskForBucket(nextBuckets[item.homeB]);

    setActiveItem(item);

    const primaryLane = await runBitmapProbe("primary", primaryMask, token);
    if (token !== scanToken) return;

    if (primaryLane >= 0) {
      await animateInitialInsert(item, item.homeA, primaryLane, token);
      if (token !== scanToken) return;
      nextBuckets[item.homeA].push(item.key);
    } else {
      const secondaryLane = await runBitmapProbe("secondary", secondaryMask, token);
      if (token !== scanToken) return;

      if (secondaryLane >= 0) {
        await animateInitialInsert(item, item.homeB, secondaryLane, token);
        if (token !== scanToken) return;
        nextBuckets[item.homeB].push(item.key);
      } else {
        setProbeUi({ phase: "kicking", lane: -1 });
        setKickUi({ bucket: -1, slot: -1, targetBucket: -1 });
        await pauseScan(CUCKOO_SCAN_TICK_MS);
        if (token !== scanToken) return;

        const kickPlan = buildKickPlan(cloneBuckets(nextBuckets), item, itemByKey, kickCounter);
        kickCounter = kickPlan.nextKickCounter;
        await animateKickPlan(kickPlan.steps, nextBuckets, token);
        if (token !== scanToken) return;

        setBuckets(cloneBuckets(kickPlan.finalBuckets));
      }
    }

    setBuckets(nextBuckets);
    setKeyCursor(cursor + 1);

    setProbeUi({ phase: "idle", lane: -1 });
    setKickUi({ bucket: -1, slot: -1, targetBucket: -1 });
    setFloatingChip(undefined);
    setIsAnimating(false);
  };

  const reset = () => {
    scanToken += 1;
    kickCounter = 0;
    setBuckets(cloneBuckets(initialBuckets));
    setKeyCursor(0);
    setProbeUi({ phase: "idle", lane: -1 });
    setKickUi({ bucket: -1, slot: -1, targetBucket: -1 });
    setActiveItem(undefined);
    setFloatingChip(undefined);
    setIsAnimating(false);
  };

  const nextKey = () => {
    const cursor = keyCursor();
    if (cursor >= totalKeys) return null;
    return items[cursor];
  };

  return (
    <section class="widget wide cuckoo" aria-label="Cuckoo insertion demo">
      <header>
        <strong>Cuckoo Inserts</strong>
      </header>

      <div ref={gridRef} class="cuckoo-grid" role="list" aria-label="Cuckoo buckets">
        {buckets().map((bucket, bucketIndex) => (
          <article
            classList={{
              candidate: activeItem() ? bucketIndex === activeItem()!.homeA || bucketIndex === activeItem()!.homeB : false,
              activeProbe:
                (probeUi().phase === "primary" && activeItem() && bucketIndex === activeItem()!.homeA) ||
                (probeUi().phase === "secondary" && activeItem() && bucketIndex === activeItem()!.homeB),
              activeKick: probeUi().phase === "kicking" && bucketIndex === kickUi().bucket,
              kickTarget: probeUi().phase === "kicking" && bucketIndex === kickUi().targetBucket,
            }}
            role="listitem"
          >
            <h4
              ref={(el) => {
                bucketTitleRefs[bucketIndex] = el;
              }}
            >
              B{bucketIndex}
            </h4>
            <ol>
              {Array.from({ length: CUCKOO_BUCKET_CAPACITY }, (_, slotIndex) => (
                <li
                  ref={(el) => {
                    slotRefs[bucketIndex][slotIndex] = el;
                  }}
                  classList={{
                    filled: slotIndex < bucket.length,
                    kickSlot: probeUi().phase === "kicking" && bucketIndex === kickUi().bucket && slotIndex === kickUi().slot,
                  }}
                >
                  {bucket[slotIndex] ?? "-"}
                </li>
              ))}
            </ol>

            <ol class="bitmap" aria-label={`Bucket ${bucketIndex} occupancy bitmap`}>
              {Array.from({ length: CUCKOO_BUCKET_CAPACITY }, (_, lane) => {
                const occupancyMask = cuckooMaskForBucket(bucket);
                const occupied = (occupancyMask & (1 << lane)) !== 0;
                const active =
                  (probeUi().phase === "primary" && activeItem() && bucketIndex === activeItem()!.homeA) ||
                  (probeUi().phase === "secondary" && activeItem() && bucketIndex === activeItem()!.homeB);
                return (
                  <li
                    classList={{
                      filled: occupied,
                      match: active && lane === probeUi().lane,
                    }}
                  >
                    {occupied ? "1" : "0"}
                  </li>
                );
              })}
            </ol>
          </article>
        ))}

        <Show when={floatingChip()}>
          {(chip) => (
            <div
              classList={{
                "floating-chip": true,
                active: chip().active,
                "chip-cool": chip().variant === "insert",
              }}
              style={{
                transform: `translate(${chip().x}px, ${chip().y}px) translate(-50%, -50%)`,
              }}
            >
              {chip().key}
            </div>
          )}
        </Show>
      </div>

      <menu>
        <button type="button" class="button" disabled={isAnimating() || keyCursor() >= totalKeys} onClick={insertNextKey}>
          {nextKey() ? `Insert Key ${nextKey()!.key}` : "All Keys Inserted"}
        </button>
        <button type="button" class="button" disabled={isAnimating()} onClick={reset}>
          Reset
        </button>
        <span class="step-counter">
          Progress: {CUCKOO_BOOTSTRAP_COUNT + keyCursor()} / {totalKeys} keys
        </span>
      </menu>
    </section>
  );
};
