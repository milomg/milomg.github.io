import { graphlib } from "dagre-d3-es";
import * as d3 from "d3";
import { onMount } from "solid-js";
import { createG } from "./graphUtils";

export const createG1 = (g: graphlib.Graph) => {
  function c(l: string, h: number, shape = "rect") {
    g.setNode(l, { h: h, label: l.toUpperCase(), width: 16, height: 16, shape: shape, style: "fill:#ECECFF;stroke:black;stroke-width:1px" });
  }
  c("a", 0, "circle");
  c("b", 1);
  c("c", 2);
  c("d", 3);
  function ce(l1: string, l2: string) {
    g.setEdge(l1, l2, {
      curve: d3.curveBasis,
      style: "stroke: gray; fill:none; stroke-width: 1px;",
      arrowheadStyle: "fill: gray",
    });
  }
  ce("a", "b");
  ce("b", "c");
  ce("c", "d");
};

export const Dagre3 = () => {
  const [g, render] = createG();

  let self!: SVGSVGElement;
  onMount(() => {
    const svg = d3.select(self);
    const inner = svg.select<SVGGElement>("g");

    createG1(g);
    render(inner, g);

    {
      const parent = inner.append("defs");
      const marker = parent
        .append("marker")
        .attr("id", "arrowhead")
        .attr("viewBox", "0 0 10 10")
        .attr("refX", 9)
        .attr("refY", 5)
        .attr("markerUnits", "strokeWidth")
        .attr("markerWidth", 8)
        .attr("markerHeight", 6)
        .attr("orient", "auto");

      marker.append("path").attr("d", "M 0 0 L 10 5 L 0 10 z").style("stroke-width", 1).style("stroke-dasharray", "1,0");
    }
    const nodes = inner.selectAll("g.node");
    nodes
      .append("text")
      .attr("dx", 40 + 2 + 4)
      .attr("dy", 8)
      .text((v) => "height: " + g.node(v).h);
    nodes
      .append("path")
      .attr("d", (v) => {
        const arrow = d3.line();
        return arrow([
          [40 + 2, 0],
          [16 + 2, 0],
        ]);
      })
      .attr("stroke", "black")
      .attr("fill", "none")
      .attr("stroke-dasharray", "5, 5")
      .attr("marker-end", "url(#arrowhead)");

    const bbox = inner.node()!.getBBox();
    svg.attr("height", bbox.height + 2);
    svg.attr("width", bbox.width + 2);
  });

  return (
    <div class="center">
      <svg ref={self}>
        <g transform="translate(1,1)"></g>
      </svg>
    </div>
  );
};
