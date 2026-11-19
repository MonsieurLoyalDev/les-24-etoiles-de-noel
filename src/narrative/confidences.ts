import type { FlowDefinition } from "./flow";

/** Knowing a document exists never grants access to its body. */
export function visibleConfidences(
  definition: FlowDefinition | undefined,
  objectives: readonly string[],
) {
  return (definition?.confidences ?? [])
    .filter((v) => objectives.includes(v.requires))
    .map((v) => ({
      id: v.id,
      author: v.author,
      status:
        v.privateAfter && objectives.includes(v.privateAfter)
          ? ("private" as const)
          : v.status,
      ...(v.status === "shared" ? { text: v.text! } : {}),
    }));
}
