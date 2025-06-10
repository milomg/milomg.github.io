import { createEffect, createSignal, onMount } from "solid-js";
import { graphlib, render as drender } from "dagre-d3-es";
import * as d3 from "d3";
import { createG } from "./graphUtils";

// https://playground.solidjs.com/anonymous/5bfda75d-0c71-4af4-ac5a-e0411dbe3c35
const slides = {
  b: ["#f99", "", "", "", ""],
  c: ["#f99", "#f99", "#f99", "", ""],
  d: ["#afa", "#f99", "", "", ""],
  e: ["#afa", "#afa", "#afa", "#f99", ""],
  f: ["#afa", "#afa", "#f99", "#f99", ""],
};

const createG1 = (slide: number, g: graphlib.Graph) => {
  function cn(l: string, c: string, shape = "rect") {
    g.setNode(l.toLowerCase(), { label: l.toUpperCase(), width: 16, height: 16, shape: shape, style: `fill:${c};stroke:black;stroke-width:1px` });
  }
  cn("a", "#ECECFF", "circle");
  cn("b", slides.b[slide] || "#ECECFF");
  cn("c", slides.c[slide] || "#ECECFF");
  cn("d", slides.d[slide] || "#ECECFF");
  cn("e", slides.e[slide] || "#ECECFF");
  cn("f", slides.f[slide] || "#ECECFF");
  function ce(l1: string, l2: string) {
    g.setEdge(l1, l2, {
      curve: d3.curveBasis,
      style: "stroke: gray; fill:none; stroke-width: 1px;",
      arrowheadStyle: "fill: gray",
    });
  }
  ce("a", "b");
  ce("a", "c");
  ce("b", "d");
  ce("c", "e");
  ce("d", "f");
  ce("e", "f");
};

export const Slideshow = () => {
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
        <button onClick={() => setSlide((c) => c + 1)} disabled={slide() >= slides.b.length - 1}>
          &gt;
        </button>
      </div>
    </div>
  );
};
