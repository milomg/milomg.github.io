import { For, batch, createSignal } from "solid-js";

type ScanPhase = "idle" | "splat" | "compare";

type Point = {
  x: number;
  y: number;
};

type FloatingChipState = {
  value: number;
  x: number;
  y: number;
  visible: boolean;
  active: boolean;
};

const SWISS_GROUP_WIDTH = 16;
const SWISS_SPAWN_HOLD_MS = 180;
const SWISS_SPLAT_FLIGHT_MS = 620;
const SWISS_SPLAT_SETTLE_MS = 520;
const SWISS_COMPARE_FLIGHT_MS = 680;

const SWISS_TAG_GROUP: number[] = [12, 41, 87, 95, 23, 19, 87, 63, 44, 118, 12, 9, 201, 57, 87, 31];

const SWISS_QUERY_SEQUENCE: number[] = [87, 12, 63, 9, 44, 101, 201, 31];
const SWISS_LANE_INDEXES = Array.from({ length: SWISS_GROUP_WIDTH }, (_, lane) => lane);
const SWISS_ALL_LANES_SET = new Set<number>(SWISS_LANE_INDEXES);

export const SwissSplatCompare = () => {
  let gridRef: HTMLDivElement | undefined;
  let queryBadgeRef: HTMLDivElement | undefined;
  const splatLaneRefs: Array<HTMLLIElement | undefined> = Array.from({ length: SWISS_GROUP_WIDTH }, () => undefined);
  const tagLaneRefs: Array<HTMLLIElement | undefined> = Array.from({ length: SWISS_GROUP_WIDTH }, () => undefined);
  const matchLaneRefs: Array<HTMLLIElement | undefined> = Array.from({ length: SWISS_GROUP_WIDTH }, () => undefined);

  const [queryCursor, setQueryCursor] = createSignal(0);
  const [isAnimating, setIsAnimating] = createSignal(false);
  const [phase, setPhase] = createSignal<ScanPhase>("idle");
  const [activeLanes, setActiveLanes] = createSignal<Set<number>>(new Set());
  const [activeTag, setActiveTag] = createSignal<number | undefined>(undefined);
  const splatLaneSignals = SWISS_LANE_INDEXES.map(() => createSignal<number | null>(null));
  const matchMaskSignals = SWISS_LANE_INDEXES.map(() => createSignal(false));
  const floatingChipSignals = SWISS_LANE_INDEXES.map(() =>
    createSignal<FloatingChipState>({
      value: 0,
      x: 0,
      y: 0,
      visible: false,
      active: false,
    }),
  );

  const pause = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
  const nextFrame = () => new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
  const phaseLabel = () => (phase() === "idle" ? "Ready" : phase() === "splat" ? "@splat(tag)" : "tags == tag_lane");

  const splatLaneValue = (lane: number) => splatLaneSignals[lane][0]();
  const setSplatLaneValue = (lane: number, value: number | null) => splatLaneSignals[lane][1](value);
  const matchBit = (lane: number) => matchMaskSignals[lane][0]();
  const setMatchBit = (lane: number, value: boolean) => matchMaskSignals[lane][1](value);
  const chipState = (lane: number) => floatingChipSignals[lane][0]();
  const setChipState = (lane: number, state: FloatingChipState) => floatingChipSignals[lane][1](state);

  const centerForElement = (element: HTMLElement | undefined) => {
    if (!gridRef || !element) return null;
    const gridRect = gridRef.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left - gridRect.left + rect.width / 2,
      y: rect.top - gridRect.top + rect.height / 2,
    };
  };

  const centersForElements = (elements: Array<HTMLElement | undefined>): Point[] | null => {
    const centers: Point[] = [];
    for (let i = 0; i < elements.length; i += 1) {
      const point = centerForElement(elements[i]);
      if (!point) return null;
      centers.push(point);
    }
    return centers;
  };

  const setAllSplatLaneValues = (value: number | null) => {
    batch(() => {
      for (let lane = 0; lane < SWISS_GROUP_WIDTH; lane += 1) {
        setSplatLaneValue(lane, value);
      }
    });
  };

  const setMatchMaskFromTag = (tag: number | null) => {
    batch(() => {
      for (let lane = 0; lane < SWISS_GROUP_WIDTH; lane += 1) {
        setMatchBit(lane, tag !== null && SWISS_TAG_GROUP[lane] === tag);
      }
    });
  };

  const hideAllFloatingChips = () => {
    batch(() => {
      for (let lane = 0; lane < SWISS_GROUP_WIDTH; lane += 1) {
        const current = chipState(lane);
        setChipState(lane, { ...current, visible: false, active: false });
      }
    });
  };

  const abortProbe = () => {
    hideAllFloatingChips();
    setIsAnimating(false);
    setPhase("idle");
    setActiveLanes(new Set<number>());
  };

  const animateFloatingChips = async (
    value: number,
    from: Point[],
    to: Point[],
    flightMs: number,
    lanes: number[] = SWISS_LANE_INDEXES,
    spawnHoldMs = SWISS_SPAWN_HOLD_MS,
  ) => {
    if (from.length !== SWISS_GROUP_WIDTH || to.length !== SWISS_GROUP_WIDTH) return;

    hideAllFloatingChips();

    batch(() => {
      for (let i = 0; i < lanes.length; i += 1) {
        const lane = lanes[i];
        setChipState(lane, {
          value,
          x: from[lane].x,
          y: from[lane].y,
          visible: true,
          active: false,
        });
      }
    });

    await nextFrame();
    if (spawnHoldMs > 0) {
      await pause(spawnHoldMs);
    }

    batch(() => {
      for (let i = 0; i < lanes.length; i += 1) {
        const lane = lanes[i];
        setChipState(lane, {
          value,
          x: to[lane].x,
          y: to[lane].y,
          visible: true,
          active: true,
        });
      }
    });

    await pause(flightMs);
  };

  const runProbe = async () => {
    if (isAnimating()) return;
    const cursor = queryCursor();
    if (cursor >= SWISS_QUERY_SEQUENCE.length) return;

    const queryTag = SWISS_QUERY_SEQUENCE[cursor];
    setIsAnimating(true);
    setActiveTag(queryTag);
    setPhase("splat");
    setActiveLanes(new Set(SWISS_ALL_LANES_SET));
    setAllSplatLaneValues(null);
    setMatchMaskFromTag(null);

    const queryCenter = centerForElement(queryBadgeRef);
    if (!queryCenter) {
      abortProbe();
      return;
    }

    const splatLaneCenters = centersForElements(splatLaneRefs);
    const tagCenters = centersForElements(tagLaneRefs);
    if (!splatLaneCenters || !tagCenters) {
      abortProbe();
      return;
    }

    await animateFloatingChips(
      queryTag,
      Array.from({ length: SWISS_GROUP_WIDTH }, () => queryCenter),
      splatLaneCenters,
      SWISS_SPLAT_FLIGHT_MS + SWISS_SPLAT_SETTLE_MS,
    );

    hideAllFloatingChips();
    setAllSplatLaneValues(queryTag);

    setPhase("compare");
    const matchLaneCenters = centersForElements(matchLaneRefs);
    if (!matchLaneCenters) {
      abortProbe();
      return;
    }

    await animateFloatingChips(queryTag, splatLaneCenters, tagCenters, SWISS_COMPARE_FLIGHT_MS, SWISS_LANE_INDEXES, 0);

    const matchedLanes = SWISS_LANE_INDEXES.filter((lane) => SWISS_TAG_GROUP[lane] === queryTag);
    if (matchedLanes.length > 0) {
      await animateFloatingChips(queryTag, tagCenters, matchLaneCenters, SWISS_COMPARE_FLIGHT_MS, matchedLanes, 0);
    }

    setMatchMaskFromTag(queryTag);

    hideAllFloatingChips();
    setPhase("idle");
    setActiveLanes(new Set<number>());
    setQueryCursor(cursor + 1);
    setIsAnimating(false);
  };

  const reset = () => {
    setQueryCursor(0);
    setIsAnimating(false);
    setPhase("idle");
    setActiveLanes(new Set<number>());
    setActiveTag(undefined);
    setAllSplatLaneValues(null);
    setMatchMaskFromTag(null);
    hideAllFloatingChips();
  };

  const nextTag = () => {
    const cursor = queryCursor();
    if (cursor >= SWISS_QUERY_SEQUENCE.length) return null;
    return SWISS_QUERY_SEQUENCE[cursor];
  };

  return (
    <section class="widget wide" aria-label="Swiss table splat and compare demo">
      <header>
        <strong>Swiss SIMD Splat + Compare</strong>
      </header>

      <p>Phase: {phaseLabel()}</p>

      <div ref={gridRef} class="swiss-grid" aria-label="16-lane SIMD bucket compare">
        <div
          ref={queryBadgeRef}
          classList={{
            "query-chip": true,
            active: phase() !== "idle",
          }}
        >
          q={activeTag() ?? "-"}
        </div>

        <h4>Splat lane</h4>
        <ol>
          <For each={SWISS_LANE_INDEXES}>
            {(lane) => (
              <li
                ref={(el) => {
                  splatLaneRefs[lane] = el;
                }}
                classList={{
                  active: activeLanes().has(lane),
                  filled: splatLaneValue(lane) !== null,
                }}
              >
                {splatLaneValue(lane) ?? "-"}
              </li>
            )}
          </For>
        </ol>

        <h4>Bucket tags</h4>
        <ol aria-label="Tag group">
          <For each={SWISS_TAG_GROUP}>
            {(tag, lane) => (
              <li
                ref={(el) => {
                  tagLaneRefs[lane()] = el;
                }}
                classList={{
                  active: activeLanes().has(lane()),
                  match: matchBit(lane()),
                }}
              >
                {tag}
              </li>
            )}
          </For>
        </ol>

        <h4>Match bits</h4>
        <ol>
          <For each={SWISS_LANE_INDEXES}>
            {(lane) => (
              <li
                ref={(el) => {
                  matchLaneRefs[lane] = el;
                }}
                classList={{
                  active: activeLanes().has(lane),
                  match: matchBit(lane),
                }}
              >
                {matchBit(lane) ? 1 : 0}
              </li>
            )}
          </For>
        </ol>

        <For each={SWISS_LANE_INDEXES}>
          {(lane) => {
            return (
              <div
                classList={{
                  "floating-chip": true,
                  "chip-cool": true,
                  active: chipState(lane).active,
                  hidden: !chipState(lane).visible,
                }}
                style={{
                  transform: `translate(${chipState(lane).x}px, ${chipState(lane).y}px) translate(-50%, -50%)`,
                }}
              >
                {chipState(lane).value}
              </div>
            );
          }}
        </For>
      </div>

      <menu>
        <button type="button" class="button" disabled={isAnimating() || queryCursor() >= SWISS_QUERY_SEQUENCE.length} onClick={runProbe}>
          {nextTag() !== null ? `Probe Tag ${nextTag()}` : "Probe Sequence Finished"}
        </button>
        <button type="button" class="button" disabled={isAnimating()} onClick={reset}>
          Reset
        </button>
        <span class="step-counter">
          Steps: {queryCursor()} / {SWISS_QUERY_SEQUENCE.length}
        </span>
      </menu>
    </section>
  );
};
