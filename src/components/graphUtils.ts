import { graphlib, render as drender } from "dagre-d3-es";

export const createG = () => {

    const g = new graphlib.Graph().setGraph({});
  
    g.graph().rankdir = "TB";
    g.graph().ranksep = 50;
    g.graph().nodesep = 50;
  
    // Default to assigning a new object as a label for each new edge.
    g.setDefaultEdgeLabel(function () {
      return {};
    });
  
    const render = drender();

    return [g, render] as const;
}