'use client';
import { Architecture } from '@/lib/types';

export function NetworkPreview({ architecture }: { architecture: Architecture }) {
  const { inputs, actions, hiddenLayers, neuronsPerLayer } = architecture;
  
  const numInputs = Math.max(1, inputs.length);
  const numOutputs = Math.max(1, actions.length);
  
  // Visual limits
  const maxVisualNodes = 12;
  const drawInputs = Math.min(numInputs, maxVisualNodes);
  const drawHidden = Math.min(neuronsPerLayer, maxVisualNodes);
  const drawOutputs = Math.min(numOutputs, maxVisualNodes);

  const layers = [
    { type: 'input', count: drawInputs, hasMore: numInputs > maxVisualNodes, color: 'fill-rose-500' },
    ...Array.from({ length: hiddenLayers }).map((_, i) => ({ type: 'hidden', count: drawHidden, hasMore: neuronsPerLayer > maxVisualNodes, color: 'fill-zinc-500' })),
    { type: 'output', count: drawOutputs, hasMore: numOutputs > maxVisualNodes, color: 'fill-blue-500' }
  ];

  const width = 600;
  const height = 500;
  const paddingX = 50;
  const paddingY = 40;
  const availableWidth = width - paddingX * 2;
  const layerSpacing = availableWidth / Math.max(1, (layers.length - 1));

  const getNodeCoords = (layerIndex: number, nodeIndex: number, totalNodes: number) => {
    const x = paddingX + layerIndex * layerSpacing;
    const yTotalSpacing = height - paddingY * 2;
    const ySpace = totalNodes > 1 ? yTotalSpacing / (totalNodes - 1) : 0;
    const y = totalNodes > 1 
      ? paddingY + nodeIndex * ySpace 
      : height / 2;
    return { x, y };
  };

  const lines = [];
  const nodes = [];

  // Generate lines
  for (let i = 0; i < layers.length - 1; i++) {
    const currentLayer = layers[i];
    const nextLayer = layers[i+1];
    
    // Sparsify lines if there are too many to keep visual clean
    const skipStepCurrent = Math.max(1, Math.floor(currentLayer.count / 8));
    const skipStepNext = Math.max(1, Math.floor(nextLayer.count / 8));

    for (let c = 0; c < currentLayer.count; c += skipStepCurrent) {
      for (let n = 0; n < nextLayer.count; n += skipStepNext) {
        const p1 = getNodeCoords(i, c, currentLayer.count);
        const p2 = getNodeCoords(i + 1, n, nextLayer.count);
        lines.push(
          <line
            key={`l-${i}-${c}-${n}`}
            x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            className="stroke-zinc-800/80"
            strokeWidth={1}
          />
        );
      }
    }
  }

  // Generate nodes
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    for (let j = 0; j < layer.count; j++) {
      const p = getNodeCoords(i, j, layer.count);
      nodes.push(
        <circle
          key={`n-${i}-${j}`}
          cx={p.x} cy={p.y} r={6}
          className={`${layer.color} stroke-zinc-950 stroke-2`}
        />
      );
    }
    if (layer.hasMore) {
       const pLast = getNodeCoords(i, layer.count - 1, layer.count);
       nodes.push(
         <text x={pLast.x} y={pLast.y + 20} className="fill-zinc-500 text-[10px]" textAnchor="middle" key={`m-${i}`}>
           +{layer.type === 'hidden' ? neuronsPerLayer - layer.count : layer.type === 'input' ? numInputs - layer.count : numOutputs - layer.count}..
         </text>
       );
    }
  }

  return (
    <div className="w-full h-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {lines}
        {nodes}
        <text x={paddingX} y={20} className="fill-zinc-400 text-xs font-mono" textAnchor="middle">IN ({numInputs})</text>
        <text x={width - paddingX} y={20} className="fill-zinc-400 text-xs font-mono" textAnchor="middle">OUT ({numOutputs})</text>
      </svg>
    </div>
  );
}
