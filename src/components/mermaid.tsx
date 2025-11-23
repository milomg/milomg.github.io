import { onMount } from "solid-js";
import { createG } from "./graphUtils";
import * as d3 from "d3";

type NodeOpts = { label?: string; shape?: string; class?: string };
export const Mermaid = (props: {
  data: {
    edges: Array<string[]>;
    nodes: [string, NodeOpts][];
  };
}) => {
  const [g, render] = createG();

  function c(node: string, nodeOpts: NodeOpts) {
    let color = "#ECECFF";
    if (nodeOpts.class == "red") {
      color = "#f99";
    } else if (nodeOpts.class == "green") {
      color = "#afa";
    }
    g.setNode(node, {
      label: nodeOpts.label ?? node,
      shape: nodeOpts.shape ?? "rect",
      style: `fill:${color};stroke:black;stroke-width:1px`,
    });
  }

  function ce(l1: string, l2: string, label: string | undefined) {
    g.setEdge(l1, l2, {
      label,
      labelStyle: "background-color: rgba(232, 232, 232, 0.8);text-align:center",
      labelType: "html",
      curve: d3.curveBasis,
      style: "stroke: gray; fill:none; stroke-width: 1px;",
      arrowheadStyle: "fill: gray",
      labeloffset: 0,
      labelpos: "center", //anything but l or r
    });
  }

  let self!: SVGSVGElement;
  onMount(() => {
    const svg = d3.select(self);

    for (const node of props.data.nodes) {
      c(node[0], node[1]);
    }
    for (const edge of props.data.edges) {
      ce(edge[0], edge[1], edge[2]);
    }

    render(svg, g);

    const output = svg.select<SVGGElement>(".output");
    output.attr("transform", "translate(1,1)");
    const bbox = output.node()!.getBBox();
    svg.attr("height", bbox.height + 2);
    svg.attr("width", bbox.width + 2);
  });

  return (
    <div class="center">
      <svg ref={self}></svg>
    </div>
  );
};
