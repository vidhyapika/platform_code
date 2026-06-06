import {
  getPrerequisite,
  getSubTopic,
  getTopic,
} from "../repositories/curriculumRepo";
import {
  getQuizAttempt,
  getSubTopicProgress,
  getTopicProgress,
  updateQuizAttempt,
  upsertSubTopicProgress,
  upsertTopicProgress,
} from "../repositories/progressRepo";
import {
  getQuestionFlag,
  updateQuestionFlag,
} from "../repositories/questionFlagRepo";

export async function overrideQuestionScore(params: {
  flagId: string;
  adminId: string;
  markCorrect: boolean;
}): Promise<{ score: number; total: number; passed: boolean }> {
  const flag = await getQuestionFlag(params.flagId);
  if (!flag) throw new Error("Flag not found");
  if (!flag.quizAttemptId) throw new Error("No quiz attempt linked to this flag");

  const attempt = await getQuizAttempt(flag.quizAttemptId);
  if (!attempt) throw new Error("Quiz attempt not found");
  if (attempt.studentId !== flag.studentId) throw new Error("Attempt does not match flag student");

  const answers = attempt.answers.map((a) => {
    if (a.questionId !== flag.questionId) return a;
    return {
      ...a,
      correct: params.markCorrect,
      aiReasoning: `${a.aiReasoning ? `${a.aiReasoning} ` : ""}(Score overridden by admin)`,
    };
  });

  const score = answers.filter((a) => a.correct).length;
  const total = answers.length;
  const percentage = total > 0 ? (score / total) * 100 : 100;

  let passingThreshold = 60;
  if (flag.contextType === "prereq") {
    const prereq = await getPrerequisite(flag.topicId);
    passingThreshold = prereq?.passingThreshold ?? 60;
  } else if (flag.contextType === "subtopic") {
    const st = await getSubTopic(flag.contextId);
    passingThreshold = st?.passingThreshold ?? 60;
  } else {
    const topic = await getTopic(flag.topicId);
    passingThreshold = topic?.finalTestThreshold ?? 60;
  }

  const passed = percentage >= passingThreshold;

  await updateQuizAttempt(flag.quizAttemptId, { answers, score, total, passed });

  const { studentId, topicId, contextType, contextId } = flag;

  if (contextType === "prereq") {
    const existing = await getTopicProgress(studentId, topicId);
    const prereqEverCleared =
      existing?.prereqStatus === "passed" ||
      existing?.prereqStatus === "flagged" ||
      existing?.contentUnlocked === true;
    if (passed && !prereqEverCleared) {
      await upsertTopicProgress(studentId, topicId, {
        prereqStatus: "passed",
        contentUnlocked: true,
      });
    } else if (!passed && existing?.prereqStatus !== "passed" && existing?.prereqStatus !== "flagged") {
      await upsertTopicProgress(studentId, topicId, { prereqStatus: "failed" });
    }
  } else if (contextType === "subtopic") {
    const existing = await getSubTopicProgress(studentId, contextId);
    const quizCleared =
      existing?.quizStatus === "passed" || existing?.quizStatus === "flagged";
    if (passed && !quizCleared) {
      await upsertSubTopicProgress(studentId, contextId, topicId, {
        quizStatus: "passed",
      });
    } else if (!passed && existing?.quizStatus !== "passed" && existing?.quizStatus !== "flagged") {
      await upsertSubTopicProgress(studentId, contextId, topicId, {
        quizStatus: "failed",
      });
    }
  } else if (contextType === "finaltest") {
    const existing = await getTopicProgress(studentId, topicId);
    const finalCleared =
      existing?.finalTestStatus === "passed" || existing?.finalTestStatus === "flagged";
    if (passed && !finalCleared) {
      await upsertTopicProgress(studentId, topicId, {
        finalTestStatus: "passed",
        completedAt: existing?.completedAt ?? undefined,
      });
    } else if (!passed && existing?.finalTestStatus !== "passed" && existing?.finalTestStatus !== "flagged") {
      await upsertTopicProgress(studentId, topicId, { finalTestStatus: "failed" });
    }
  }

  await updateQuestionFlag(params.flagId, {
    scoreOverridden: true,
    overriddenCorrect: params.markCorrect,
    status: "in_review",
  });

  return { score, total, passed };
}
