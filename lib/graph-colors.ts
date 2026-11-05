/**
 * 3D Scene Palette Constants
 * Per design.md §8: the 3D graph canvas intentionally keeps its dark void (#0A0C10)
 * in BOTH themes to preserve node/edge emissive contrast and depth perception.
 */

export const GRAPH_COLORS = {
  voidBackground: "#0A0C10",
  nodeBase: "#191D26",
  nodeHealthy: "#3DDC97",
  nodeWarning: "#F2B84B",
  nodeDanger: "#F0576B",
  edgeBase: "#7C9CFF",
  edgeActive: "#3DDC97",
  textLabel: "#EDEFF3",
  textMuted: "#8B92A3",
  fogColor: "#0A0C10",
} as const;

export type GraphColorKey = keyof typeof GRAPH_COLORS;

