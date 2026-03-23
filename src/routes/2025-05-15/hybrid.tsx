import * as d3 from "d3";
import { Title } from "@solidjs/meta";
import { Globals } from "~/components/global";
import { clientOnly } from "@solidjs/start";
import { MDXComponents } from "mdx/types";
import { MDXDefault } from "~/components/mdx-default";
import { graphlib } from "dagre-d3-es";
import { createEffect, createSignal, onMount } from "solid-js";
import { cancel, createG } from "~/components/graphUtils";
import MDXComponent from "~/blogs/height.mdx";
import "../blog.css";
import { Nav } from "~/components/nav";

const Giscus = clientOnly(() => import("~/components/giscus"));

export const createG1 = (g: graphlib.Graph) => {
  function c(l: string, h: number, shape = "rect") {
    g.setNode(l, { h: h, label: l.toUpperCase(), width: 16, height: 16, shape: shape, style: "fill:#ECECFF;stroke:black;stroke-width:1px" });
  }
  function ce(l1: string, l2: string) {
    g.setEdge(l1, l2, {
      curve: d3.curveBasis,
      style: "stroke: gray; fill:none; stroke-width: 1px;",
      arrowheadStyle: "fill: gray",
    });
  }
  c("a", 0, "circle");
  c("b", 1);
  c("c", 2);
  ce("a", "b");
  ce("a", "c");
  ce("b", "c");
};

export const Dagre = () => {
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
    const nodes = inner.selectAll<SVGGElement, string>("g.node");
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
        <g transform="translate(10,1)"></g>
      </svg>
    </div>
  );
};

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

    const nodes = inner.selectAll<SVGGElement, string>("g.node");
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

export const Dagre3 = () => {
  const [g, render] = createG();

  let self!: SVGSVGElement;
  onMount(() => {
    const svg = d3.select(self);
    const inner = svg.select<SVGGElement>("g");

    {
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
    }
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
    const nodes = inner.selectAll<SVGGElement, string>("g.node");
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

// https://playground.solidjs.com/anonymous/5bfda75d-0c71-4af4-ac5a-e0411dbe3c35
const slides = {
  b: ["#f99", "", "", "", ""],
  c: ["#f99", "#f99", "#f99", "", ""],
  d: ["#afa", "#f99", "", "", ""],
  e: ["#afa", "#afa", "#afa", "#f99", ""],
  f: ["#afa", "#afa", "#f99", "#f99", ""],
};

const createG2 = (slide: number, g: graphlib.Graph) => {
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

    createG2(slide(), g);

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
        <button onClick={cancel(() => setSlide((c) => c - 1))} disabled={slide() <= 0}>
          &lt;
        </button>
        <button onClick={cancel(() => setSlide((c) => c + 1))} disabled={slide() >= slides.b.length - 1}>
          &gt;
        </button>
      </div>
    </div>
  );
};

const createG3 = (slide: number, g: graphlib.Graph) => {
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

    createG3(slide(), g);

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
        <button onClick={cancel(() => setSlide((c) => c - 1))} disabled={slide() <= 0}>
          &lt;
        </button>
        <button onClick={cancel(() => setSlide((c) => c + 1))} disabled={slide() >= 7}>
          &gt;
        </button>
      </div>
    </div>
  );
};

const MDXProps: MDXComponents = {
  ...MDXDefault,
  Dagre: Dagre,
  Carousel: Slideshow,
  HeightGraph: Dagre2,
  Dynamic: Slideshow2,
  BadHeight: Dagre3,
};

export default function Page() {
  return (
    <Globals>
      <Title>Super Charging Fine-Grained Reactive Performance 2 · milomg.dev</Title>
      <Nav />
      <div id="scroller">
        <div class="column">
          <MDXComponent components={MDXProps} />
          <Giscus />
        </div>
      </div>
    </Globals>
  );
}
