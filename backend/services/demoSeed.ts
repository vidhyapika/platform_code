import { getDb } from "../firebase/admin";
import { hashPassword, createAccessToken } from "./auth";
import { upsertUser, getUserByEmail } from "../repositories/userRepo";
import {
  createStandard,
  createClass,
  createTopic,
  createSubTopic,
  createPrerequisite,
  createQuestionsInBatch,
  syncStudentEnrollments,
  listTopics,
  listSubTopics,
  listPrerequisites,
  listQuestions,
} from "../repositories/curriculumRepo";
import { upsertTopicProgress, upsertSubTopicProgress, saveQuizAttempt } from "../repositories/progressRepo";
import {
  createDirectThreadWithMessage,
  createGroupThread,
} from "../repositories/messageRepo";

const DEMO_KEY = "demo:v1";

export type DemoBootstrapResult = {
  adminEmail: string;
  adminPassword: string;
  studentEmail: string;
  studentPassword: string;
  parentEmail: string;
  parentPassword: string;
  adminId: string;
  studentId: string;
  parentId: string;
  standardId: string;
  classId: string;
  topicIds: string[];
};

export type DemoMeta = {
  demoKey: string;
  createdAt?: string;
  standardId: string;
  classId: string;
  topicIds: string[];
  adminEmail: string;
  adminId: string;
  studentEmail: string;
  studentId: string;
  parentEmail: string;
  parentId: string;
};

export async function getDemoMeta(): Promise<DemoMeta | null> {
  const snap = await getDb().collection("demoMeta").doc(DEMO_KEY).get();
  return snap.exists ? (snap.data() as DemoMeta) : null;
}

export async function ensureDemoMetaUpToDate(): Promise<DemoMeta> {
  const db = getDb();
  const meta = await getDemoMeta();
  if (!meta) {
    // Bootstrap creates meta on first run.
    await bootstrapDemoData();
    const again = await getDemoMeta();
    if (!again) throw new Error("demoMeta missing after bootstrap");
    return again;
  }

  // Backfill ids for older demoMeta versions (safe no-op if already present)
  const [admin, student, parent] = await Promise.all([
    getUserByEmail(meta.adminEmail),
    getUserByEmail(meta.studentEmail),
    getUserByEmail(meta.parentEmail),
  ]);
  const patch: Partial<DemoMeta> = {};
  if (!meta.adminId && admin) patch.adminId = admin.id;
  if (!meta.studentId && student) patch.studentId = student.id;
  if (!meta.parentId && parent) patch.parentId = parent.id;
  if (Object.keys(patch).length > 0) {
    await db.collection("demoMeta").doc(DEMO_KEY).update(patch);
    return { ...meta, ...patch } as DemoMeta;
  }
  return meta;
}

function requireDemoAllowed() {
  const allowed =
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_DEMO_ENDPOINTS === "true";
  if (!allowed) {
    return Response.json(
      { error: "Demo endpoints are disabled in production." },
      { status: 403 }
    );
  }
  return null;
}

export async function bootstrapDemoData(): Promise<DemoBootstrapResult> {
  // Users (idempotent)
  const adminEmail = "admin@demo.com";
  const adminPassword = "admin123";
  const studentEmail = "student@demo.com";
  const studentPassword = "password123";
  const parentEmail = "parent@demo.com";
  const parentPassword = "password123";

  const existingStudent = await getUserByEmail(studentEmail);
  const existingAdmin = await getUserByEmail(adminEmail);
  const existingParent = await getUserByEmail(parentEmail);

  const studentId =
    existingStudent?.id ??
    (await upsertUser({
      email: studentEmail,
      name: "Arjun (Demo Student)",
      role: "student",
      passwordHash: await hashPassword(studentPassword),
      mustResetPassword: false,
      parentName: "Mr. Sharma (Demo Parent)",
      parentEmail,
      phone: "+91 98765 43210",
    }));

  const parentId =
    existingParent?.id ??
    (await upsertUser({
      email: parentEmail,
      name: "Mr. Sharma (Demo Parent)",
      role: "parent",
      passwordHash: await hashPassword(parentPassword),
      mustResetPassword: false,
      parentId: studentId,
    }));

  const adminId =
    existingAdmin?.id ??
    (await upsertUser({
      email: adminEmail,
      name: "Admin (Demo)",
      role: "admin",
      passwordHash: await hashPassword(adminPassword),
      mustResetPassword: false,
    }));

  // Curriculum (idempotent via demoKey marker)
  const db = getDb();
  const demoMetaSnap = await db.collection("demoMeta").doc(DEMO_KEY).get();
  if (demoMetaSnap.exists) {
    const data = demoMetaSnap.data() as any;
    return {
      adminEmail,
      adminPassword,
      studentEmail,
      studentPassword,
      parentEmail,
      parentPassword,
      adminId: data.adminId ?? adminId,
      studentId: data.studentId ?? studentId,
      parentId: data.parentId ?? parentId,
      standardId: data.standardId,
      classId: data.classId,
      topicIds: data.topicIds ?? [],
    };
  }

  const standardId = await createStandard({
    name: "Standard 8 (Demo)",
    description: "Demo curriculum for walkthrough.",
    order: 8,
  });

  const classId = await createClass({
    standardId,
    name: "Section A (Demo)",
    passingThreshold: 60,
  });

  // Enroll demo student into the class
  await syncStudentEnrollments(studentId, [classId]);

  // Topics
  const topicIds: string[] = [];
  for (const [i, name] of [
    "Algebra Basics",
    "Linear Equations",
    "Polynomials",
  ].entries()) {
    const tid = await createTopic({
      classId,
      name: `${name} (Demo)`,
      description: "Demo topic with prereq, modules, and final test.",
      order: i,
      finalTestThreshold: 60,
    });
    topicIds.push(tid);

    // One prerequisite per topic
    const prereqId = await createPrerequisite(tid, {
      name: "Prerequisite Check",
      description: "Quick check to unlock the topic.",
      passingThreshold: 60,
      maxAIAttempts: 3,
    });

    // 4 prereq questions (varied types)
    await createQuestionsInBatch([
      {
        contextType: "prereq",
        contextId: prereqId,
        text: "2 + 2 = ?",
        type: "mcq",
        options: ["3", "4", "5", "6"],
        correctAnswer: "4",
        order: 0,
        isAIGenerated: false,
      },
      {
        contextType: "prereq",
        contextId: prereqId,
        text: "True/False: 10 is an even number.",
        type: "true_false",
        correctAnswer: "true",
        order: 1,
        isAIGenerated: false,
      },
      {
        contextType: "prereq",
        contextId: prereqId,
        text: "Explain in one sentence what a variable represents.",
        type: "text",
        correctAnswer: "A symbol that can take different values.",
        order: 2,
        isAIGenerated: false,
      },
      {
        contextType: "prereq",
        contextId: prereqId,
        text: "Upload a photo of your handwritten work (demo).",
        type: "image_upload",
        correctAnswer: "Any clear solution is acceptable.",
        order: 3,
        isAIGenerated: false,
      },
    ]);

    // Subtopics (2 per topic)
    const sub1 = await createSubTopic({
      topicId: tid,
      name: "Concept Video",
      order: 0,
      youtubeUrl: "https://youtu.be/dQw4w9WgXcQ",
      passingThreshold: 60,
    });
    const sub2 = await createSubTopic({
      topicId: tid,
      name: "Practice Quiz",
      order: 1,
      passingThreshold: 60,
    });

    await createQuestionsInBatch([
      {
        contextType: "subtopic",
        contextId: sub1,
        text: "After watching, which statement is correct?",
        type: "mcq",
        options: ["A", "B", "C", "D"],
        correctAnswer: "A",
        order: 0,
        isAIGenerated: false,
      },
      {
        contextType: "subtopic",
        contextId: sub2,
        text: "Solve: x + 5 = 12. What is x?",
        type: "mcq",
        options: ["5", "6", "7", "8"],
        correctAnswer: "7",
        order: 0,
        isAIGenerated: false,
      },
      {
        contextType: "subtopic",
        contextId: sub2,
        text: "True/False: If x = 7, then x + 5 = 12.",
        type: "true_false",
        correctAnswer: "true",
        order: 1,
        isAIGenerated: false,
      },
    ]);

    // Final test questions (2)
    await createQuestionsInBatch([
      {
        contextType: "finaltest",
        contextId: tid,
        text: "Final: What is 3x when x=4?",
        type: "mcq",
        options: ["7", "10", "12", "14"],
        correctAnswer: "12",
        order: 0,
        isAIGenerated: false,
      },
      {
        contextType: "finaltest",
        contextId: tid,
        text: "Final: Briefly describe how you would check your answer.",
        type: "text",
        correctAnswer: "Substitute back into the original equation/expression.",
        order: 1,
        isAIGenerated: false,
      },
    ]);
  }

  // Seed some progress + attempts so UI shows “in-progress / completed / unlocked”
  // Topic 0: prereq passed, first subtopic passed, second failed once, final not done
  const t0 = topicIds[0]!;
  const prereq0 = (await listPrerequisites(t0))[0]!;
  const subs0 = await listSubTopics(t0);
  const subQuiz0 = subs0[1]!;
  const subVideo0 = subs0[0]!;

  await upsertTopicProgress(studentId, t0, {
    prereqStatus: "passed",
    prereqAttemptCount: 1,
    contentUnlocked: true,
  });
  await upsertSubTopicProgress(studentId, subVideo0.id, t0, {
    quizStatus: "passed",
    quizAttemptCount: 1,
    videoWatched: true,
    completedAt: new Date() as any,
  });
  await upsertSubTopicProgress(studentId, subQuiz0.id, t0, {
    quizStatus: "failed",
    quizAttemptCount: 1,
  });

  // Add attempt records (optional but helps history views)
  const prereqQs0 = await listQuestions("prereq", prereq0.id);
  if (prereqQs0.length > 0) {
    await saveQuizAttempt({
      studentId,
      contextType: "prereq",
      contextId: prereq0.id,
      answers: prereqQs0.slice(0, 2).map((q) => ({
        questionId: q.id,
        answer: "demo",
        correct: true,
      })),
      score: 2,
      total: 2,
      passed: true,
      aiGenerated: false,
    });
  }

  // Topic 1: prereq failed once (locked content), so roadmap shows prereq badge
  const t1 = topicIds[1]!;
  const prereq1 = (await listPrerequisites(t1))[0]!;
  await upsertTopicProgress(studentId, t1, {
    prereqStatus: "failed",
    prereqAttemptCount: 1,
    contentUnlocked: false,
  });
  const prereqQs1 = await listQuestions("prereq", prereq1.id);
  if (prereqQs1.length > 0) {
    await saveQuizAttempt({
      studentId,
      contextType: "prereq",
      contextId: prereq1.id,
      answers: prereqQs1.slice(0, 1).map((q) => ({
        questionId: q.id,
        answer: "demo",
        correct: false,
      })),
      score: 0,
      total: 1,
      passed: false,
      aiGenerated: false,
    });
  }

  // Topic 2: completed (final test passed)
  const t2 = topicIds[2]!;
  await upsertTopicProgress(studentId, t2, {
    prereqStatus: "passed",
    prereqAttemptCount: 1,
    contentUnlocked: true,
    finalTestStatus: "passed",
    finalTestAttemptCount: 1,
    completedAt: new Date() as any,
  });

  await createDirectThreadWithMessage({
    studentId,
    createdBy: adminId,
    body: "Welcome to the Vidhyapika demo! Reply here if you have questions.",
    senderId: adminId,
    senderRole: "admin",
  });

  await createGroupThread({
    audience: { type: "class", classId },
    title: "Demo class announcement",
    createdBy: adminId,
    initialBody: "This group thread is for everyone in your demo class. Students can reply here.",
    senderId: adminId,
    senderRole: "admin",
  });

  await db.collection("demoMeta").doc(DEMO_KEY).set({
    demoKey: DEMO_KEY,
    createdAt: new Date().toISOString(),
    standardId,
    classId,
    topicIds,
    studentEmail,
    studentId,
    adminEmail,
    adminId,
    parentEmail,
    parentId,
  } satisfies DemoMeta);

  // Ensure topic order exists in class for roadmap
  await listTopics(classId);

  return {
    adminEmail,
    adminPassword,
    studentEmail,
    studentPassword,
    parentEmail,
    parentPassword,
    adminId,
    studentId,
    parentId,
    standardId,
    classId,
    topicIds,
  };
}

export async function createDemoSession(role: "admin" | "student") {
  const deny = requireDemoAllowed();
  if (deny) return { deny };

  const demo = await bootstrapDemoData();

  const email = role === "admin" ? demo.adminEmail : demo.studentEmail;
  const user = await getUserByEmail(email);
  if (!user) {
    return {
      deny: Response.json({ error: "Demo user not found" }, { status: 500 }),
    };
  }

  const token = await createAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  return {
    deny: null,
    token,
    user: { email: user.email, name: user.name, role: user.role },
    demo,
  };
}

