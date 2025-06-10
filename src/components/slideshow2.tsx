import { createEffect, createSignal, onMount } from "solid-js";
import { graphlib, render as drender } from "dagre-d3-es";
import * as d3 from "d3";
import { createG } from "./graphUtils";

const createG1 = (slide: number, g: graphlib.Graph) => {
  function cn(l: string, create: boolean, shape = "rect") {
    if (create)
      g.setNode(l.toLowerCase(), {
        label: l.toUpperCase(),
        width: 16,
        height: 16,
        shape: shape,
        style: `fill:#ECECFF;stroke:black;stroke-width:1px`,
      });
    else {
      g.removeNode(l.toLowerCase());
    }
  }
  cn("a", true, "circle");
  cn("b", slide > 0);
  cn("c", slide > 2);
  cn("d", slide > 4);

  function ce(l1: string, l2: string, create: boolean) {
    if (create)
      g.setEdge(l1, l2, {
        curve: d3.curveBasis,
        style: "stroke: gray; fill:none; stroke-width: 1px;",
        arrowheadStyle: "fill: gray",
      });
    else g.removeEdge(l1, l2, undefined);
  }

  ce("a", "b", slide > 1);
  ce("a", "c", slide > 3);
  ce("b", "d", slide > 5);
  ce("c", "d", slide > 6);
};

export const Slideshow2 = () => {
  const [slide, setSlide] = createSignal(0);

  const [g, render] = createG();

  let self!: SVGSVGElement;
  createEffect(() => {
    const svg = d3.select(self);
    const inner = svg.select("g");

    createG1(slide(), g);

    render(inner, g);

    svg.attr("height", g.graph().height + 40);
    svg.attr("width", g.graph().width + 2);
  });

  return (
    <div class="center">
      <svg ref={self}>
        <g transform="translate(1,1)"></g>
      </svg>
      <div>
        <button onClick={() => setSlide((c) => c - 1)} disabled={slide() <= 0}>
          &lt;
        </button>
        <button onClick={() => setSlide((c) => c + 1)} disabled={slide() >= 7}>
          &gt;
        </button>
      </div>
    </div>
  );
};
