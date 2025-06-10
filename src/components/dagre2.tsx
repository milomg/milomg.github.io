import * as d3 from "d3";
import { createSignal, onMount } from "solid-js";
import { createG } from "./graphUtils";
import { createG1 } from "./dagre";

export const Dagre2 = () => {
  const [slide, setSlide] = createSignal(0);

  const [g, render] = createG();

  let self!: SVGSVGElement;
  onMount(() => {
    const svg = d3.select(self);
    const inner = svg.select<SVGGElement>("g");

    createG1(g);

    render(inner, g);

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
      <h1>queue: [{slide() == 0 ? "A" : slide() == 1 ? "B, C" : slide() == 2 ? "C" : ""}]</h1>
      <svg ref={self}>
        <g transform="translate(10,1)"></g>
      </svg>
      <div>
        <button onClick={() => setSlide((c) => c - 1)} disabled={slide() <= 0}>
          &lt;
        </button>
        <button onClick={() => setSlide((c) => c + 1)} disabled={slide() >= 3}>
          &gt;
        </button>
      </div>
    </div>
  );
};
