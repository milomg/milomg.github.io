import { graphlib, render as drender } from "dagre-d3-es";

export const createG = () => {
  const g = new graphlib.Graph().setGraph({});

  g.graph().rankdir = "TB";
  g.graph().ranksep = 50;
  g.graph().nodesep = 50;

  const render = drender();

  return [g, render] as const;
};

export function cancel(fn: () => void) {
  return (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };
}
