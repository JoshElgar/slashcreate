export function parseFirstJson(text: string): unknown {
  // Fast path
  try {
    return JSON.parse(text);
  } catch (_) {
    // fallthrough
  }

  // Try to extract from ```json ... ``` blocks first
  const fenced = /```json\s*([\s\S]*?)```/i.exec(text);
  if (fenced && fenced[1]) {
    const inner = fenced[1].trim();
    try {
      return JSON.parse(inner);
    } catch (_) {
      // continue
    }
  }

  // Try any fenced block
  const anyFence = /```\s*([\s\S]*?)```/i.exec(text);
  if (anyFence && anyFence[1]) {
    const inner = anyFence[1].trim();
    try {
      return JSON.parse(inner);
    } catch (_) {
      // continue
    }
  }

  // As a last resort, find the first { ... } that parses (simple brace scanner)
  const startIndexes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "{") startIndexes.push(i);
  }
  for (const start of startIndexes) {
    let depth = 0;
    for (let j = start; j < text.length; j++) {
      const ch = text[j];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      if (depth === 0) {
        const candidate = text.slice(start, j + 1);
        try {
          return JSON.parse(candidate);
        } catch (_) {
          break; // move to next start
        }
      }
    }
  }

  throw new Error("Model output did not contain valid JSON");
}
