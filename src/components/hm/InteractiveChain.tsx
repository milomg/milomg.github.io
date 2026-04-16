import { Show, createSignal } from "solid-js";
import "./InteractiveChain.css";

type HashItem = {
  key: string;
};

type PositionedHashItem = HashItem & {
  x: number;
  y: number;
};

type BucketChain = {
  slot: number;
  items: HashItem[];
};

export const InteractiveChain = () => {
  const slotCount = 27;
  const slotWidth = 24;
  const slotStartX = 14;
  const firstBucketY = 52;
  const cellSize = 24;
  const nodeHeight = cellSize * 2;
  const nodeGap = 14;

  const chains: BucketChain[] = [
    { slot: 1, items: [{ key: "17" }, { key: "54" }] },
    { slot: 4, items: [{ key: "2" }, { key: "9" }, { key: "15" }, { key: "31" }] },
    { slot: 11, items: [{ key: "40" }, { key: "52" }] },
    { slot: 14, items: [{ key: "1" }, { key: "6" }] },
    { slot: 21, items: [{ key: "2" }, { key: "8" }] },
    { slot: 23, items: [{ key: "4" }, { key: "7" }, { key: "16" }, { key: "18" }] },
    { slot: 26, items: [{ key: "3" }, { key: "6" }] },
  ];

  const [activeChain, setActiveChain] = createSignal(-1);

  const positionedChains = chains.map((chain) => {
    const baseX = slotStartX + chain.slot * slotWidth;

    return {
      slot: chain.slot,
      items: chain.items.map((item, index) => ({
        ...item,
        x: baseX,
        y: firstBucketY + index * (nodeHeight + nodeGap),
      })),
    };
  });

  const linkPath = (from: PositionedHashItem, to: PositionedHashItem) => {
    const startX = from.x + cellSize / 2;
    const startY = from.y + cellSize * 1.5;
    const endX = to.x + cellSize / 2;
    const endY = to.y - 2;
    return `M${startX} ${startY} L${endX} ${endY}`;
  };

  return (
    <div class="hm-chain">
      <svg viewBox="0 0 700 320" width="100%" aria-label="Hash table chain visualization">
        <defs>
          <marker id="hmarrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="3.5" markerHeight="3.5" orient="auto-start-reverse">
            <path d="M0 0L8 4L0 8z" fill="context-stroke" />
          </marker>
        </defs>

        <rect x="12" y="16" width="650" height="24" fill="#ffffff" stroke="#222" stroke-width="2" />

        {Array.from({ length: slotCount - 1 }, (_, i) => 38 + i * slotWidth).map((x) => (
          <line x1={x} y1="16" x2={x} y2="40" stroke="#222" stroke-width="2" />
        ))}

        {positionedChains.map((chain, slot) => {
          const isActive = () => activeChain() === slot;
          const centerX = chain.items[0].x + 12;
          return (
            <g
              onMouseEnter={() => setActiveChain(slot)}
              onFocus={() => setActiveChain(slot)}
              fill={isActive() ? "#d9480f" : "#111"}
              stroke={isActive() ? "#d9480f" : "#111"}
            >
              <circle cx={centerX} cy="28" r="3" />
              <line x1={centerX} y1="31" x2={chain.items[0].x + 12} y2={chain.items[0].y - 2} stroke-width="1.7" marker-end="url(#hmarrow)" />

              {chain.items.map((item, index) => (
                <g stroke-width="2">
                  <rect x={item.x} y={item.y} width={cellSize} height={cellSize} fill={isActive() ? "#ffe9d5" : "#f0f4ff"} stroke-width="2" rx="2">
                    <title>{`${item.key}`}</title>
                  </rect>
                  <rect
                    x={item.x}
                    y={item.y + cellSize}
                    width={cellSize}
                    height={cellSize}
                    fill={isActive() ? "#fff4e6" : "#f0f4ff"}
                    stroke-width="2"
                    rx="2"
                  />
                  <text x={item.x + cellSize / 2} y={item.y + cellSize / 2} text-anchor="middle" font-size="8" fill="#111" stroke="none">
                    {item.key}
                  </text>

                  <Show when={index < chain.items.length - 1}>
                    <circle cx={item.x + cellSize / 2} cy={item.y + cellSize * 1.5} r="2" />
                    <path d={linkPath(item, chain.items[index + 1])} stroke-width="1.7" marker-end="url(#hmarrow)" />
                  </Show>
                </g>
              ))}
            </g>
          );
        })}
      </svg>

      <Show when={chains[activeChain()]}>
        {(chain) => (
          <p>
            Bucket {chain().slot}:{" "}
            {chain()
              .items.map((item) => item.key)
              .join(" -> ")}
          </p>
        )}
      </Show>
    </div>
  );
};
