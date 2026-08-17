import { CanvasItem, AlignmentGuide } from '@/store/useCanvasStore';

interface SnapResult {
  snappedX: number;
  snappedY: number;
  guides: AlignmentGuide[];
}

interface TargetMatch {
  newPos: number;
  guidePos: number;
  label: string;
}

/**
 * Calculates snapping for a single axis (X or Y).
 */
function snapAxis(
  rawPos: number,
  size: number,
  canvasLimit: number,
  otherItems: CanvasItem[],
  axis: 'x' | 'y',
  threshold: number
): { snappedPos: number; axisGuides: AlignmentGuide[] } {
  const isX = axis === 'x';
  const guideType = isX ? 'vertical' : 'horizontal';

  interface MatchCandidate {
    snappedPos: number;
    guidePos: number;
    label: string;
    id: string;
    delta: number;
  }

  const candidates: MatchCandidate[] = [];

  // Canvas boundary & center targets
  const canvasTargets: TargetMatch[] = [
    { newPos: 0, guidePos: 0, label: isX ? 'Canvas Left' : 'Canvas Top' },
    { newPos: canvasLimit / 2 - size / 2, guidePos: canvasLimit / 2, label: isX ? 'Canvas Center' : 'Canvas Middle' },
    { newPos: canvasLimit - size, guidePos: canvasLimit, label: isX ? 'Canvas Right' : 'Canvas Bottom' },
  ];

  for (const c of canvasTargets) {
    const delta = Math.abs(rawPos - c.newPos);
    if (delta <= threshold) {
      candidates.push({
        snappedPos: c.newPos,
        guidePos: c.guidePos,
        label: c.label,
        id: `canvas-${guideType}-${c.guidePos}`,
        delta,
      });
    }
  }

  // Inter-item alignment targets
  for (const target of otherItems) {
    const tPos = isX ? target.x : target.y;
    const tSize = isX ? target.width : target.height;
    const tCenter = tPos + tSize / 2;
    const tEnd = tPos + tSize;

    const itemMatches: TargetMatch[] = [
      { newPos: tPos, guidePos: tPos, label: isX ? 'Left Align' : 'Top Align' },
      { newPos: tCenter - size / 2, guidePos: tCenter, label: isX ? 'Center Align' : 'Middle Align' },
      { newPos: tEnd - size, guidePos: tEnd, label: isX ? 'Right Align' : 'Bottom Align' },
      { newPos: tEnd, guidePos: tEnd, label: 'Edge Align' },
      { newPos: tPos - size, guidePos: tPos, label: 'Edge Align' },
    ];

    for (const match of itemMatches) {
      const delta = Math.abs(rawPos - match.newPos);
      if (delta <= threshold) {
        candidates.push({
          snappedPos: match.newPos,
          guidePos: match.guidePos,
          label: match.label,
          id: `item-${guideType}-${target.id}-${match.guidePos}`,
          delta,
        });
      }
    }
  }

  if (candidates.length === 0) {
    return { snappedPos: Math.round(rawPos), axisGuides: [] };
  }

  const minDelta = Math.min(...candidates.map((c) => c.delta));
  const bestCandidates = candidates.filter((c) => Math.abs(c.delta - minDelta) < 0.1);
  const chosen = bestCandidates[0];

  const axisGuides: AlignmentGuide[] = [];
  for (const cand of bestCandidates) {
    if (!axisGuides.some((g) => Math.abs(g.position - cand.guidePos) < 1)) {
      axisGuides.push({
        id: cand.id,
        type: guideType,
        position: cand.guidePos,
        label: cand.label,
      });
    }
  }

  return { snappedPos: Math.round(chosen.snappedPos), axisGuides };
}

export function calculateAlignmentSnapping(
  rawX: number,
  rawY: number,
  width: number,
  height: number,
  allItems: CanvasItem[],
  selectedIds: string[],
  canvasWidth: number,
  canvasHeight: number,
  threshold: number = 8
): SnapResult {
  const otherItems = allItems.filter((i) => !selectedIds.includes(i.id));

  const xSnap = snapAxis(rawX, width, canvasWidth, otherItems, 'x', threshold);
  const ySnap = snapAxis(rawY, height, canvasHeight, otherItems, 'y', threshold);

  return {
    snappedX: xSnap.snappedPos,
    snappedY: ySnap.snappedPos,
    guides: [...xSnap.axisGuides, ...ySnap.axisGuides],
  };
}
