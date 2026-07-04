import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));

const requiredDocs = [
  "README.md",
  "AGENT_GUIDE.md",
  "PRODUCT_SPEC.md",
  "ARCHITECTURE.md",
  "TIME_MODEL.md",
  "EVENT_MODEL.md",
  "RENDERING_STRATEGY.md",
  "EMBEDDING_API.md",
  "ROADMAP.md",
  "TASKS.md",
  "PROJECT_STATUS.md",
  "CURRENT_TASK.md",
  "SESSION_HANDOFF.md",
  "DECISIONS.md",
  "TEST_STRATEGY.md",
  "TEST_STATUS.md",
  "KNOWN_ISSUES.md",
  "CHANGELOG.md",
  "ACCESSIBILITY.md",
  "RISKS.md",
  "OPEN_QUESTIONS.md"
];

const readDoc = (name) => readFileSync(join(root, "docs", name), "utf8");

const activeTaskFrom = (content) => {
  const section = content.match(/## משימה פעילה\s+([\s\S]*?)(?:\n## |\n# |$)/);
  const source = section?.[1] ?? content;
  const task = source.match(/T\d{3}:[^\n]+/);
  if (task) {
    return task[0].trim();
  }

  if (source.includes("אין משימה פעילה")) {
    return "אין משימה פעילה";
  }

  return undefined;
};

const failures = [];

for (const doc of requiredDocs) {
  try {
    const content = readDoc(doc);
    if (content.trim().length === 0) {
      failures.push(`${doc} is empty`);
    }
  } catch (error) {
    failures.push(`${doc} is missing`);
  }
}

const activeTasks = {
  "PROJECT_STATUS.md": activeTaskFrom(readDoc("PROJECT_STATUS.md")),
  "CURRENT_TASK.md": activeTaskFrom(readDoc("CURRENT_TASK.md")),
  "TASKS.md": activeTaskFrom(readDoc("TASKS.md"))
};

const uniqueActiveTasks = new Set(Object.values(activeTasks));
if (uniqueActiveTasks.size !== 1 || uniqueActiveTasks.has(undefined)) {
  failures.push(`Active task mismatch: ${JSON.stringify(activeTasks)}`);
}

const agentGuide = readDoc("AGENT_GUIDE.md");
if (!agentGuide.includes("פרוטוקול פתיחת סשן")) {
  failures.push("AGENT_GUIDE.md is missing session start protocol");
}

if (!agentGuide.includes("פרוטוקול סיום סשן")) {
  failures.push("AGENT_GUIDE.md is missing session end protocol");
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Documentation gate passed for ${requiredDocs.length} docs.`);
