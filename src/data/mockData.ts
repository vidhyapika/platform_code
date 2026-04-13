import { 
  Calculator, Microscope, BookOpen, CheckCircle2, Download, 
  MessageSquare, GraduationCap, BrainCircuit, Library, Users,
  Video, PenTool, Globe, Zap, Target, Star, Crown, Award, MapPin
} from 'lucide-react';
import { 
  Course, DashboardCourse, Assignment, DashboardAssignment, 
  ScheduleEvent, DashboardSchedule, Activity, QuickLink, Badge,
  StudentCurriculumProgress, StudentTopicProgress, StudentSubTopicProgress,
  AISession
} from '../types';
import { INITIAL_CURRICULUM_DATA } from './adminMockData';

// ── YouTube URL → embed URL ────────────────────────────────────────────────
function toEmbed(url?: string): string | undefined {
  if (!url) return undefined;
  const m = url.match(/(?:youtu\.be\/|[?&]v=|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : undefined;
}

// ── Mock AI Sessions ───────────────────────────────────────────────────────
const MOCK_AI_SESSIONS_TOPIC1: AISession[] = [
  {
    id: 'ai-s1',
    topicId: 'top-1',
    kind: 'prerequisite',
    date: '2026-03-08',
    resolved: true,
    messages: [
      { id: 'm1', role: 'tutor', content: "Let's review Basic Arithmetic Operations. You missed questions about order of operations and fractions. Here's what you need to know...", timestamp: '2026-03-08T09:00:00' },
      { id: 'm2', role: 'student', content: 'I think I understand PEMDAS now', timestamp: '2026-03-08T09:05:00' },
      { id: 'm3', role: 'tutor', content: 'Great! Remember: Parentheses → Exponents → Multiplication/Division (left to right) → Addition/Subtraction. Now try the new quiz!', timestamp: '2026-03-08T09:06:00' },
    ],
    generatedQuiz: [
      { id: 'ai-q1', text: 'Evaluate: 12 ÷ 4 + 3 × 2', type: 'mcq', options: ['9', '3', '12', '6'], correctAnswer: '9', explanation: '12÷4=3, 3×2=6, 3+6=9.', difficulty: 'Easy' },
    ],
  },
];

const MOCK_AI_SESSIONS_TOPIC2: AISession[] = [
  {
    id: 'ai-s2',
    topicId: 'top-2',
    subtopicId: 'sub-2',
    kind: 'subtopic',
    date: '2026-03-22',
    resolved: false,
    messages: [
      { id: 'm4', role: 'tutor', content: "You struggled with isolating the variable when the equation has multiplication. Let me explain the division property of equality...", timestamp: '2026-03-22T14:00:00' },
      { id: 'm5', role: 'student', content: 'So I divide both sides by the coefficient?', timestamp: '2026-03-22T14:03:00' },
      { id: 'm6', role: 'tutor', content: 'Exactly! Always do the same operation on both sides to keep the equation balanced. Ready for a targeted practice quiz?', timestamp: '2026-03-22T14:04:00' },
    ],
  },
];

// ── Build StudentCurriculumProgress from the admin curriculum data ─────────
function buildStudentCurriculum(): StudentCurriculumProgress {
  const std  = INITIAL_CURRICULUM_DATA[0];          // Grade 9
  const cls  = std?.classes[0];                     // Section A
  if (!cls) return { standard: '', className: '', overallProgress: 0, completedTopics: 0, totalTopics: 0, topics: [] };

  const topics: StudentTopicProgress[] = cls.curriculum
    .slice()
    .sort((a, b) => a.sequence - b.sequence)
    .map((topic, idx): StudentTopicProgress => {
      // Mock progress: varied stages so all student states are visible in the UI
      // idx 0 = completed · idx 1 = in-progress (past prereqs) · idx 2 = in-progress (at prereqs)
      // idx 3 = in-progress (no prereqs, watching video) · idx 4-5 = not-started
      const isCompleted  = idx === 0;
      const isInProgress = idx >= 1 && idx <= 3;
      const progress     = isCompleted ? 100 : idx === 1 ? 65 : idx === 2 ? 15 : idx === 3 ? 35 : 0;
      const status       = isCompleted ? 'completed' : isInProgress ? 'in-progress' : 'not-started';

      const subTopics: StudentSubTopicProgress[] = topic.subTopics.map((sub, sIdx): StudentSubTopicProgress => {
        // idx 1: first sub done, second in-progress
        // idx 2: no subs done yet (stuck at prereqs)
        // idx 3: first sub in-progress (no prereqs, watching videos)
        const subCompleted  = isCompleted || (idx === 1 && sIdx === 0);
        const subInProgress = (idx === 1 && sIdx === 1) || (idx === 3 && sIdx === 0);
        const quizTotal = sub.quizzes?.length ?? 0;
        return {
          id:           sub.id,
          title:        sub.title,
          status:       subCompleted ? 'completed' : subInProgress ? 'in-progress' : 'not-started',
          videoUrl:     toEmbed(sub.videoUrl),
          videoWatched: subCompleted,
          quizzes:      sub.quizzes,
          quizScore:    subCompleted && quizTotal > 0
            ? {
                score: quizTotal,
                total: quizTotal,
                date: '2026-03-15',
                pastAnswers: Object.fromEntries((sub.quizzes ?? []).map(q => [q.id, q.correctAnswer])),
                attempts: [
                  { score: Math.max(1, quizTotal - 2), total: quizTotal, date: '2026-03-10' },
                  { score: Math.max(1, quizTotal - 1), total: quizTotal, date: '2026-03-12' },
                  { score: quizTotal,                  total: quizTotal, date: '2026-03-15' },
                ],
              }
            : undefined,
        };
      });

      const preEvalTotal  = topic.preEvaluationQuiz?.length  ?? 0;
      const postEvalTotal = topic.postEvaluationQuiz?.length ?? 0;

      // Build prereq scores with attempt history
      const prerequisiteScores = isCompleted
        ? (topic.prerequisites ?? []).map((p, pi) => ({
            id: p.id, title: p.title,
            score: p.questions?.length ?? 3,
            total: p.questions?.length ?? 3,
            date: '2026-03-10',
            attempts: [
              { score: Math.max(1, (p.questions?.length ?? 3) - 1), total: p.questions?.length ?? 3, date: '2026-03-08' },
              { score: p.questions?.length ?? 3,                    total: p.questions?.length ?? 3, date: '2026-03-10' },
            ],
          }))
        // idx 2 has NOT passed any prereqs yet → empty array so CoursePlayer starts at prereq phase
        : isInProgress && idx !== 2
          ? (topic.prerequisites ?? []).map((p, pi) => ({
              id: p.id, title: p.title,
              score: Math.max(1, (p.questions?.length ?? 3) - 1),
              total: p.questions?.length ?? 3,
              date: '2026-03-20',
              attempts: [
                { score: Math.max(1, (p.questions?.length ?? 3) - 2), total: p.questions?.length ?? 3, date: '2026-03-18' },
                { score: Math.max(1, (p.questions?.length ?? 3) - 1), total: p.questions?.length ?? 3, date: '2026-03-20' },
              ],
            }))
          : [];

      return {
        id:    topic.id,
        title: topic.title,
        status,
        progress,
        prerequisites:      topic.prerequisites,
        prerequisiteScores,
        preEvaluationQuiz:  topic.preEvaluationQuiz,
        preEvaluationScore: (isCompleted || isInProgress) && preEvalTotal > 0
          ? {
              score: preEvalTotal,
              total: preEvalTotal,
              date:  '2026-03-11',
              pastAnswers: Object.fromEntries((topic.preEvaluationQuiz ?? []).map(q => [q.id, q.correctAnswer])),
              attempts: [
                { score: Math.max(1, preEvalTotal - 1), total: preEvalTotal, date: '2026-03-09' },
                { score: preEvalTotal,                  total: preEvalTotal, date: '2026-03-11' },
              ],
            }
          : undefined,
        postEvaluationQuiz:  topic.postEvaluationQuiz,
        postEvaluationScore: isCompleted && postEvalTotal > 0
          ? {
              score: postEvalTotal,
              total: postEvalTotal,
              date:  '2026-03-16',
              pastAnswers: Object.fromEntries((topic.postEvaluationQuiz ?? []).map(q => [q.id, q.correctAnswer])),
              attempts: [
                { score: Math.max(1, postEvalTotal - 1), total: postEvalTotal, date: '2026-03-14' },
                { score: postEvalTotal,                  total: postEvalTotal, date: '2026-03-16' },
              ],
            }
          : undefined,
        finalTestQuiz:  topic.finalTestQuiz,
        finalTestScore: isCompleted && (topic.finalTestQuiz?.length ?? 0) > 0
          ? {
              score: topic.finalTestQuiz!.length,
              total: topic.finalTestQuiz!.length,
              date:  '2026-03-17',
              attempts: [
                { score: Math.max(1, topic.finalTestQuiz!.length - 1), total: topic.finalTestQuiz!.length, date: '2026-03-16' },
                { score: topic.finalTestQuiz!.length,                  total: topic.finalTestQuiz!.length, date: '2026-03-17' },
              ],
            }
          : undefined,
        subtopicsCompleted: isCompleted ? topic.subTopics.length : idx === 1 ? 1 : 0,
        totalSubtopics:     topic.subTopics.length,
        subTopics,
        aiSessions:    idx === 0 ? MOCK_AI_SESSIONS_TOPIC1 : idx === 1 ? MOCK_AI_SESSIONS_TOPIC2 : [],
        aiSessionCount: idx === 0 ? 1 : idx === 1 ? 1 : 0,
      };
    });

  const completedTopics = topics.filter(t => t.status === 'completed').length;
  const overallProgress  = topics.length > 0
    ? Math.round(topics.reduce((acc, t) => acc + t.progress, 0) / topics.length)
    : 0;

  return { standard: std.name, className: cls.name, overallProgress, completedTopics, totalTopics: topics.length, topics, aiSessionCount: 2, lastAISession: '2026-03-22' };
}

export const MOCK_STUDENT_CURRICULUM: StudentCurriculumProgress = buildStudentCurriculum();

export const MOCK_COURSES: Course[] = [];

export const MOCK_DASHBOARD_COURSES: DashboardCourse[] = [];

export const MOCK_ASSIGNMENTS: Assignment[] = [
  { id: 2, title: 'Practice: Linear Equations', subject: 'Mathematics', dueDate: 'Tomorrow, 5:00 PM', status: 'pending', progress: 0 },
  { id: 4, title: 'Quiz: Algebraic Expressions', subject: 'Mathematics', dueDate: 'Completed', status: 'completed', progress: 100, score: '1/1' }
];

export const MOCK_DASHBOARD_ASSIGNMENTS: DashboardAssignment[] = [
  { id: 2, title: 'Linear Equations Quiz', subject: 'Mathematics - Grade 9', due: 'Due Tomorrow', isUrgent: false },
  { id: 3, title: 'Essay: The Great Gatsby', subject: 'English - Lit Studies', due: 'Due Friday', isUrgent: false },
];

export const MOCK_SCHEDULE: ScheduleEvent[] = [
  { id: 1, time: '09:00 AM', duration: '45 min', title: 'Mathematics: Algebra II', type: 'Live Class', instructor: 'Dr. Sarah Jenkins', location: 'Virtual Room A', color: 'bg-[#0084B4]', bgColor: 'bg-[#E1F0F5]', icon: Video },
  { id: 2, time: '11:00 AM', duration: '1 hour', title: 'Science Lab: Biology', type: 'Workshop', instructor: 'Prof. Michael Chen', location: 'Science Lab 3', color: 'bg-[#7CB342]', bgColor: 'bg-[#EAF5E1]', icon: Users },
  { id: 3, time: '02:30 PM', duration: '45 min', title: 'English Literature Discussion', type: 'Study Group', instructor: 'Peer Led', location: 'Library Study Room', color: 'bg-[#8B5CF6]', bgColor: 'bg-[#F3E8FF]', icon: MapPin }
];

export const MOCK_DASHBOARD_SCHEDULE: DashboardSchedule[] = [
  { id: 1, title: 'Science Live Class', teacher: 'Dr. Sarah Jenkins', time: '10:00 AM', type: 'live', icon: Video },
  { id: 2, title: 'Math Workshop', teacher: 'Problem Solving Lab', time: '01:30 PM', type: 'workshop', icon: PenTool },
];

export const MOCK_ACTIVITIES: Activity[] = [
  { id: 1, title: 'Quiz Completed: Algebra Foundations', time: '2 hours ago', meta: 'Score: 94%', icon: CheckCircle2, color: 'text-[#0084B4]', bgColor: 'bg-[#E1F0F5]' },
  { id: 2, title: 'Downloaded Study Material', time: 'Yesterday', meta: 'Science: Mitosis PDF', icon: Download, color: 'text-[#7CB342]', bgColor: 'bg-[#EAF5E1]' },
  { id: 3, title: 'Posted in Discussion Forum', time: '2 days ago', meta: 'Shakespearean Sonnets', icon: MessageSquare, color: 'text-[#8B5CF6]', bgColor: 'bg-[#F3E8FF]' },
];

export const MOCK_QUICK_LINKS: QuickLink[] = [
  { id: 1, title: 'Scholarships', icon: GraduationCap, color: 'text-[#0084B4]' },
  { id: 2, title: 'Mental Math', icon: BrainCircuit, color: 'text-[#7CB342]' },
  { id: 3, title: 'E-Library', icon: Library, color: 'text-[#8B5CF6]' },
  { id: 4, title: 'Tutor Help', icon: Users, color: 'text-[#F43F5E]' },
];

export const MOCK_BADGES: Badge[] = [
  { id: 1, title: 'Fast Learner', description: 'Completed 5 modules in one day', icon: Zap, color: 'text-yellow-500', bgColor: 'bg-yellow-100', unlocked: true },
  { id: 2, title: 'Perfect Score', description: 'Got 100% on a major test', icon: Target, color: 'text-green-500', bgColor: 'bg-green-100', unlocked: true },
  { id: 3, title: 'Consistent', description: '7 day study streak', icon: Star, color: 'text-blue-500', bgColor: 'bg-blue-100', unlocked: true },
  { id: 4, title: 'Subject Master', description: 'Complete all Math modules', icon: Crown, color: 'text-purple-500', bgColor: 'bg-purple-100', unlocked: false },
  { id: 5, title: 'Helpful Peer', description: 'Answer 10 questions in forums', icon: Award, color: 'text-orange-500', bgColor: 'bg-orange-100', unlocked: false },
];
