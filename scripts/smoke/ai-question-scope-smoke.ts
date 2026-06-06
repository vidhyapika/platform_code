/**
 * Unit smoke: per-student AI question visibility filter (no Firestore).
 */
import {
  isQuestionVisibleToStudent,
  type Question,
} from "../../backend/repositories/curriculumRepo";

const studentA = "student-a";
const studentB = "student-b";

const adminQ = {
  id: "1",
  contextType: "subtopic" as const,
  contextId: "st1",
  text: "Admin Q",
  type: "mcq" as const,
  order: 0,
  isAIGenerated: false,
};

const aiForA = {
  ...adminQ,
  id: "2",
  text: "AI for A",
  isAIGenerated: true,
  generatedForStudentId: studentA,
};

const aiForB = {
  ...adminQ,
  id: "3",
  text: "AI for B",
  isAIGenerated: true,
  generatedForStudentId: studentB,
};

const legacyOrphanAi = {
  ...adminQ,
  id: "4",
  text: "Legacy global AI",
  isAIGenerated: true,
};

const cases: Question[] = [adminQ, aiForA, aiForB, legacyOrphanAi];

const visibleToA = cases.filter((q) => isQuestionVisibleToStudent(q, studentA));
const visibleToB = cases.filter((q) => isQuestionVisibleToStudent(q, studentB));

if (visibleToA.length !== 2 || !visibleToA.find((q) => q.id === "1") || !visibleToA.find((q) => q.id === "2")) {
  throw new Error(`Student A should see admin + own AI only, got ids: ${visibleToA.map((q) => q.id).join(",")}`);
}

if (visibleToB.length !== 2 || !visibleToB.find((q) => q.id === "1") || !visibleToB.find((q) => q.id === "3")) {
  throw new Error(`Student B should see admin + own AI only, got ids: ${visibleToB.map((q) => q.id).join(",")}`);
}

if (visibleToA.some((q) => q.id === "3") || visibleToB.some((q) => q.id === "2")) {
  throw new Error("Cross-student AI leakage detected");
}

if (visibleToA.some((q) => q.id === "4") || visibleToB.some((q) => q.id === "4")) {
  throw new Error("Legacy orphan AI should be hidden from all students");
}

console.log("ai-question-scope-smoke: OK");
