import * as Plot from "@observablehq/plot";
import { For, createEffect, createSignal } from "solid-js";

type ConfigRow = {
  benchmark: string;
  map: string;
  working_set: number;
  ns_per_op: number;
};

type LoadRow = {
  benchmark: string;
  map: string;
  load_factor: number;
  ns_per_op: number;
};

const CONFIG_DATA: ConfigRow[] = [
  // working_set = 256
  { benchmark: "delete_churn", map: "std", working_set: 256, ns_per_op: 270 },
  { benchmark: "delete_churn", map: "arrayhashmap", working_set: 256, ns_per_op: 36 },
  { benchmark: "delete_churn", map: "qf_tree", working_set: 256, ns_per_op: 68 },
  { benchmark: "delete_churn", map: "qf_block", working_set: 256, ns_per_op: 88 },
  { benchmark: "delete_churn", map: "boost_flat", working_set: 256, ns_per_op: 47 },
  { benchmark: "delete_churn", map: "cuckoo", working_set: 256, ns_per_op: 18 },
  { benchmark: "alternate_reuse", map: "std", working_set: 256, ns_per_op: 16 },
  { benchmark: "alternate_reuse", map: "arrayhashmap", working_set: 256, ns_per_op: 23 },
  { benchmark: "alternate_reuse", map: "qf_tree", working_set: 256, ns_per_op: 40 },
  { benchmark: "alternate_reuse", map: "qf_block", working_set: 256, ns_per_op: 49 },
  { benchmark: "alternate_reuse", map: "boost_flat", working_set: 256, ns_per_op: 23 },
  { benchmark: "alternate_reuse", map: "cuckoo", working_set: 256, ns_per_op: 16 },
  { benchmark: "insert_light", map: "std", working_set: 256, ns_per_op: 16 },
  { benchmark: "insert_light", map: "arrayhashmap", working_set: 256, ns_per_op: 13 },
  { benchmark: "insert_light", map: "qf_tree", working_set: 256, ns_per_op: 22 },
  { benchmark: "insert_light", map: "qf_block", working_set: 256, ns_per_op: 20 },
  { benchmark: "insert_light", map: "boost_flat", working_set: 256, ns_per_op: 25 },
  { benchmark: "insert_light", map: "cuckoo", working_set: 256, ns_per_op: 10 },
  { benchmark: "insert_nearfull", map: "std", working_set: 256, ns_per_op: 41 },
  { benchmark: "insert_nearfull", map: "arrayhashmap", working_set: 256, ns_per_op: 40 },
  { benchmark: "insert_nearfull", map: "qf_tree", working_set: 256, ns_per_op: 107 },
  { benchmark: "insert_nearfull", map: "qf_block", working_set: 256, ns_per_op: 117 },
  { benchmark: "insert_nearfull", map: "boost_flat", working_set: 256, ns_per_op: 52 },
  { benchmark: "insert_nearfull", map: "cuckoo", working_set: 256, ns_per_op: 30 },

  // working_set = 2048
  { benchmark: "delete_churn", map: "std", working_set: 2048, ns_per_op: 81 },
  { benchmark: "delete_churn", map: "arrayhashmap", working_set: 2048, ns_per_op: 36 },
  { benchmark: "delete_churn", map: "qf_tree", working_set: 2048, ns_per_op: 78 },
  { benchmark: "delete_churn", map: "qf_block", working_set: 2048, ns_per_op: 114 },
  { benchmark: "delete_churn", map: "boost_flat", working_set: 2048, ns_per_op: 51 },
  { benchmark: "delete_churn", map: "cuckoo", working_set: 2048, ns_per_op: 18 },
  { benchmark: "alternate_reuse", map: "std", working_set: 2048, ns_per_op: 18 },
  { benchmark: "alternate_reuse", map: "arrayhashmap", working_set: 2048, ns_per_op: 23 },
  { benchmark: "alternate_reuse", map: "qf_tree", working_set: 2048, ns_per_op: 53 },
  { benchmark: "alternate_reuse", map: "qf_block", working_set: 2048, ns_per_op: 94 },
  { benchmark: "alternate_reuse", map: "boost_flat", working_set: 2048, ns_per_op: 27 },
  { benchmark: "alternate_reuse", map: "cuckoo", working_set: 2048, ns_per_op: 16 },
  { benchmark: "insert_light", map: "std", working_set: 2048, ns_per_op: 13 },
  { benchmark: "insert_light", map: "arrayhashmap", working_set: 2048, ns_per_op: 15 },
  { benchmark: "insert_light", map: "qf_tree", working_set: 2048, ns_per_op: 25 },
  { benchmark: "insert_light", map: "qf_block", working_set: 2048, ns_per_op: 26 },
  { benchmark: "insert_light", map: "boost_flat", working_set: 2048, ns_per_op: 29 },
  { benchmark: "insert_light", map: "cuckoo", working_set: 2048, ns_per_op: 11 },
  { benchmark: "insert_nearfull", map: "std", working_set: 2048, ns_per_op: 38 },
  { benchmark: "insert_nearfull", map: "arrayhashmap", working_set: 2048, ns_per_op: 40 },
  { benchmark: "insert_nearfull", map: "qf_tree", working_set: 2048, ns_per_op: 109 },
  { benchmark: "insert_nearfull", map: "qf_block", working_set: 2048, ns_per_op: 102 },
  { benchmark: "insert_nearfull", map: "boost_flat", working_set: 2048, ns_per_op: 58 },
  { benchmark: "insert_nearfull", map: "cuckoo", working_set: 2048, ns_per_op: 30 },

  // working_set = 4096
  { benchmark: "delete_churn", map: "std", working_set: 4096, ns_per_op: 81 },
  { benchmark: "delete_churn", map: "arrayhashmap", working_set: 4096, ns_per_op: 47 },
  { benchmark: "delete_churn", map: "qf_tree", working_set: 4096, ns_per_op: 80 },
  { benchmark: "delete_churn", map: "qf_block", working_set: 4096, ns_per_op: 142 },
  { benchmark: "delete_churn", map: "boost_flat", working_set: 4096, ns_per_op: 49 },
  { benchmark: "delete_churn", map: "cuckoo", working_set: 4096, ns_per_op: 18 },
  { benchmark: "alternate_reuse", map: "std", working_set: 4096, ns_per_op: 18 },
  { benchmark: "alternate_reuse", map: "arrayhashmap", working_set: 4096, ns_per_op: 23 },
  { benchmark: "alternate_reuse", map: "qf_tree", working_set: 4096, ns_per_op: 58 },
  { benchmark: "alternate_reuse", map: "qf_block", working_set: 4096, ns_per_op: 131 },
  { benchmark: "alternate_reuse", map: "boost_flat", working_set: 4096, ns_per_op: 28 },
  { benchmark: "alternate_reuse", map: "cuckoo", working_set: 4096, ns_per_op: 16 },
  { benchmark: "insert_light", map: "std", working_set: 4096, ns_per_op: 15 },
  { benchmark: "insert_light", map: "arrayhashmap", working_set: 4096, ns_per_op: 18 },
  { benchmark: "insert_light", map: "qf_tree", working_set: 4096, ns_per_op: 27 },
  { benchmark: "insert_light", map: "qf_block", working_set: 4096, ns_per_op: 25 },
  { benchmark: "insert_light", map: "boost_flat", working_set: 4096, ns_per_op: 30 },
  { benchmark: "insert_light", map: "cuckoo", working_set: 4096, ns_per_op: 11 },
  { benchmark: "insert_nearfull", map: "std", working_set: 4096, ns_per_op: 42 },
  { benchmark: "insert_nearfull", map: "arrayhashmap", working_set: 4096, ns_per_op: 46 },
  { benchmark: "insert_nearfull", map: "qf_tree", working_set: 4096, ns_per_op: 115 },
  { benchmark: "insert_nearfull", map: "qf_block", working_set: 4096, ns_per_op: 100 },
  { benchmark: "insert_nearfull", map: "boost_flat", working_set: 4096, ns_per_op: 53 },
  { benchmark: "insert_nearfull", map: "cuckoo", working_set: 4096, ns_per_op: 30 },
];

const LOAD_DATA: LoadRow[] = [
  // load factor 4/8 = 0.5
  { benchmark: "lookup_hit", map: "std", load_factor: 0.5, ns_per_op: 6 },
  { benchmark: "lookup_hit", map: "arrayhashmap", load_factor: 0.5, ns_per_op: 17 },
  { benchmark: "lookup_hit", map: "qf_tree", load_factor: 0.5, ns_per_op: 22 },
  { benchmark: "lookup_hit", map: "qf_block", load_factor: 0.5, ns_per_op: 15 },
  { benchmark: "lookup_hit", map: "boost_flat", load_factor: 0.5, ns_per_op: 20 },
  { benchmark: "lookup_hit", map: "cuckoo", load_factor: 0.5, ns_per_op: 3 },
  { benchmark: "lookup_miss", map: "std", load_factor: 0.5, ns_per_op: 10 },
  { benchmark: "lookup_miss", map: "arrayhashmap", load_factor: 0.5, ns_per_op: 15 },
  { benchmark: "lookup_miss", map: "qf_tree", load_factor: 0.5, ns_per_op: 11 },
  { benchmark: "lookup_miss", map: "qf_block", load_factor: 0.5, ns_per_op: 17 },
  { benchmark: "lookup_miss", map: "boost_flat", load_factor: 0.5, ns_per_op: 4 },
  { benchmark: "lookup_miss", map: "cuckoo", load_factor: 0.5, ns_per_op: 3 },
  { benchmark: "insert_load", map: "std", load_factor: 0.5, ns_per_op: 11 },
  { benchmark: "insert_load", map: "arrayhashmap", load_factor: 0.5, ns_per_op: 13 },
  { benchmark: "insert_load", map: "qf_tree", load_factor: 0.5, ns_per_op: 18 },
  { benchmark: "insert_load", map: "qf_block", load_factor: 0.5, ns_per_op: 18 },
  { benchmark: "insert_load", map: "boost_flat", load_factor: 0.5, ns_per_op: 22 },
  { benchmark: "insert_load", map: "cuckoo", load_factor: 0.5, ns_per_op: 6 },

  // load factor 5/8 = 0.625
  { benchmark: "lookup_hit", map: "std", load_factor: 0.625, ns_per_op: 7 },
  { benchmark: "lookup_hit", map: "arrayhashmap", load_factor: 0.625, ns_per_op: 14 },
  { benchmark: "lookup_hit", map: "qf_tree", load_factor: 0.625, ns_per_op: 29 },
  { benchmark: "lookup_hit", map: "qf_block", load_factor: 0.625, ns_per_op: 22 },
  { benchmark: "lookup_hit", map: "boost_flat", load_factor: 0.625, ns_per_op: 22 },
  { benchmark: "lookup_hit", map: "cuckoo", load_factor: 0.625, ns_per_op: 3 },
  { benchmark: "lookup_miss", map: "std", load_factor: 0.625, ns_per_op: 12 },
  { benchmark: "lookup_miss", map: "arrayhashmap", load_factor: 0.625, ns_per_op: 10 },
  { benchmark: "lookup_miss", map: "qf_tree", load_factor: 0.625, ns_per_op: 16 },
  { benchmark: "lookup_miss", map: "qf_block", load_factor: 0.625, ns_per_op: 20 },
  { benchmark: "lookup_miss", map: "boost_flat", load_factor: 0.625, ns_per_op: 5 },
  { benchmark: "lookup_miss", map: "cuckoo", load_factor: 0.625, ns_per_op: 4 },
  { benchmark: "insert_load", map: "std", load_factor: 0.625, ns_per_op: 12 },
  { benchmark: "insert_load", map: "arrayhashmap", load_factor: 0.625, ns_per_op: 11 },
  { benchmark: "insert_load", map: "qf_tree", load_factor: 0.625, ns_per_op: 21 },
  { benchmark: "insert_load", map: "qf_block", load_factor: 0.625, ns_per_op: 23 },
  { benchmark: "insert_load", map: "boost_flat", load_factor: 0.625, ns_per_op: 21 },
  { benchmark: "insert_load", map: "cuckoo", load_factor: 0.625, ns_per_op: 6 },

  // load factor 6/8 = 0.75
  { benchmark: "lookup_hit", map: "std", load_factor: 0.75, ns_per_op: 9 },
  { benchmark: "lookup_hit", map: "arrayhashmap", load_factor: 0.75, ns_per_op: 16 },
  { benchmark: "lookup_hit", map: "qf_tree", load_factor: 0.75, ns_per_op: 44 },
  { benchmark: "lookup_hit", map: "qf_block", load_factor: 0.75, ns_per_op: 29 },
  { benchmark: "lookup_hit", map: "boost_flat", load_factor: 0.75, ns_per_op: 23 },
  { benchmark: "lookup_hit", map: "cuckoo", load_factor: 0.75, ns_per_op: 3 },
  { benchmark: "lookup_miss", map: "std", load_factor: 0.75, ns_per_op: 15 },
  { benchmark: "lookup_miss", map: "arrayhashmap", load_factor: 0.75, ns_per_op: 12 },
  { benchmark: "lookup_miss", map: "qf_tree", load_factor: 0.75, ns_per_op: 26 },
  { benchmark: "lookup_miss", map: "qf_block", load_factor: 0.75, ns_per_op: 25 },
  { benchmark: "lookup_miss", map: "boost_flat", load_factor: 0.75, ns_per_op: 6 },
  { benchmark: "lookup_miss", map: "cuckoo", load_factor: 0.75, ns_per_op: 4 },
  { benchmark: "insert_load", map: "std", load_factor: 0.75, ns_per_op: 14 },
  { benchmark: "insert_load", map: "arrayhashmap", load_factor: 0.75, ns_per_op: 12 },
  { benchmark: "insert_load", map: "qf_tree", load_factor: 0.75, ns_per_op: 28 },
  { benchmark: "insert_load", map: "qf_block", load_factor: 0.75, ns_per_op: 27 },
  { benchmark: "insert_load", map: "boost_flat", load_factor: 0.75, ns_per_op: 23 },
  { benchmark: "insert_load", map: "cuckoo", load_factor: 0.75, ns_per_op: 7 },

  // load factor 7/8 = 0.875
  { benchmark: "lookup_hit", map: "std", load_factor: 0.875, ns_per_op: 5 },
  { benchmark: "lookup_hit", map: "arrayhashmap", load_factor: 0.875, ns_per_op: 17 },
  { benchmark: "lookup_hit", map: "qf_tree", load_factor: 0.875, ns_per_op: 19 },
  { benchmark: "lookup_hit", map: "qf_block", load_factor: 0.875, ns_per_op: 13 },
  { benchmark: "lookup_hit", map: "boost_flat", load_factor: 0.875, ns_per_op: 20 },
  { benchmark: "lookup_hit", map: "cuckoo", load_factor: 0.875, ns_per_op: 4 },
  { benchmark: "lookup_miss", map: "std", load_factor: 0.875, ns_per_op: 9 },
  { benchmark: "lookup_miss", map: "arrayhashmap", load_factor: 0.875, ns_per_op: 14 },
  { benchmark: "lookup_miss", map: "qf_tree", load_factor: 0.875, ns_per_op: 9 },
  { benchmark: "lookup_miss", map: "qf_block", load_factor: 0.875, ns_per_op: 14 },
  { benchmark: "lookup_miss", map: "boost_flat", load_factor: 0.875, ns_per_op: 4 },
  { benchmark: "lookup_miss", map: "cuckoo", load_factor: 0.875, ns_per_op: 5 },
  { benchmark: "insert_load", map: "std", load_factor: 0.875, ns_per_op: 10 },
  { benchmark: "insert_load", map: "arrayhashmap", load_factor: 0.875, ns_per_op: 13 },
  { benchmark: "insert_load", map: "qf_tree", load_factor: 0.875, ns_per_op: 56 },
  { benchmark: "insert_load", map: "qf_block", load_factor: 0.875, ns_per_op: 53 },
  { benchmark: "insert_load", map: "boost_flat", load_factor: 0.875, ns_per_op: 24 },
  { benchmark: "insert_load", map: "cuckoo", load_factor: 0.875, ns_per_op: 8 },
];

const MAPS = ["std", "arrayhashmap", "qf_tree", "qf_block", "boost_flat", "cuckoo"];
const MAP_COLORS = ["#82aaff", "#c3e88d", "#f78c6c", "#ff5370", "#c792ea", "#ffcb6b"];

const BENCHMARK_LABELS: Record<string, string> = {
  delete_churn: "Delete Churn",
  alternate_reuse: "Alternate Reuse",
  insert_light: "Insert (light load)",
  insert_nearfull: "Insert (near full)",
  lookup_hit: "Lookup Hit",
  lookup_miss: "Lookup Miss",
  insert_load: "Insert (by load)",
};

const plotStyle = {
  background: "transparent",
  color: "var(--text-color)",
  fontSize: "12px",
  fontFamily: "inherit",
} as const;

export const HashmapConfigBenchmarks = () => {
  let ref: HTMLDivElement | undefined;
  const [workingSet, setWorkingSet] = createSignal<256 | 2048 | 4096>(256);

  createEffect(() => {
    if (!ref) return;
    while (ref.firstChild) ref.removeChild(ref.firstChild);

    const data = CONFIG_DATA.filter((d) => d.working_set === workingSet()).map((d) => ({
      ...d,
      benchmark: BENCHMARK_LABELS[d.benchmark] ?? d.benchmark,
    }));

    const plot = Plot.plot({
      marginLeft: 50,
      marginBottom: 60,
      fx: { label: null, padding: 0.1 },
      x: {
        label: null,
        tickRotate: -35,
        tickSize: 0,
      },
      y: { label: "ns / op", grid: true, zero: true },
      color: {
        domain: MAPS,
        range: MAP_COLORS,
        legend: true,
      },
      style: plotStyle,
      marks: [
        Plot.barY(data, {
          x: "map",
          y: "ns_per_op",
          fill: "map",
          fx: "benchmark",
          sort: { x: "y", reverse: false },
        }),
        Plot.ruleY([0]),
      ],
    });
    ref.append(plot);
  });

  return (
    <div class="widget wide">
      <header>
        <strong>Config Benchmarks</strong>
        <menu>
          <For each={[256, 2048, 4096] as const}>
            {(ws) => (
              <button class="button" disabled={workingSet() === ws} onClick={() => setWorkingSet(ws)}>
                {ws}B working set
              </button>
            )}
          </For>
        </menu>
      </header>
      <div ref={ref} />
    </div>
  );
};

export const HashmapLoadBenchmarks = () => {
  let ref: HTMLDivElement | undefined;
  const [benchmark, setBenchmark] = createSignal("lookup_hit");

  createEffect(() => {
    if (!ref) return;
    while (ref.firstChild) ref.removeChild(ref.firstChild);

    const bm = benchmark();
    const data = LOAD_DATA.filter((d) => d.benchmark === bm);

    const plot = Plot.plot({
      marginLeft: 50,
      marginBottom: 50,
      x: {
        label: "Load factor",
        tickFormat: (d: number) => `${(d * 8).toFixed(0)}/8`,
        ticks: [0.5, 0.625, 0.75, 0.875],
      },
      y: { label: "ns / op", grid: true, zero: true },
      color: {
        domain: MAPS,
        range: MAP_COLORS,
        legend: true,
      },
      style: plotStyle,
      marks: [
        Plot.line(data, {
          x: "load_factor",
          y: "ns_per_op",
          stroke: "map",
          strokeWidth: 2,
          marker: "circle",
        }),
        Plot.ruleY([0]),
      ],
    });
    ref.append(plot);
  });

  return (
    <div class="widget wide">
      <header>
        <strong>Load Factor Benchmarks</strong>
        <menu>
          <For each={["lookup_hit", "lookup_miss", "insert_load"]}>
            {(bm) => (
              <button class="button" disabled={benchmark() === bm} onClick={() => setBenchmark(bm)}>
                {BENCHMARK_LABELS[bm]}
              </button>
            )}
          </For>
        </menu>
      </header>
      <div ref={ref} />
    </div>
  );
};
