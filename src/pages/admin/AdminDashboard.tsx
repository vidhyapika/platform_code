import React, { useMemo } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { motion } from 'motion/react';
import { Users, BookOpen, TrendingUp, FileQuestion, Layers, ClipboardList, Video, CheckCircle2, GraduationCap, Brain, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  MOCK_STANDARDS, MOCK_CLASSES, INITIAL_STUDENTS, INITIAL_CURRICULUM_DATA
} from '../../data/adminMockData';
import { ClassHeatmap } from '../../components/ClassHeatmap';

export function AdminDashboard() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const stats = useMemo(() => {
    const totalStudents = INITIAL_STUDENTS.length;
    const totalStandards = MOCK_STANDARDS.length;
    const totalSections = MOCK_CLASSES.length;

    let totalTopics = 0;
    let totalSubTopics = 0;
    let totalQuizQuestions = 0;
    let videoCoverage = 0;
    let totalSubtopicCount = 0;

    for (const std of INITIAL_CURRICULUM_DATA) {
      for (const cls of std.classes) {
        totalTopics += cls.curriculum.length;
        for (const topic of cls.curriculum) {
          totalQuizQuestions += (topic.preEvaluationQuiz?.length ?? 0);
          totalQuizQuestions += (topic.postEvaluationQuiz?.length ?? 0);
          for (const sub of topic.subTopics) {
            totalSubTopics++;
            totalSubtopicCount++;
            totalQuizQuestions += (sub.quizzes?.length ?? 0);
            if (sub.videoUrl) videoCoverage++;
          }
        }
      }
    }

    const videoCoveragePct = totalSubtopicCount > 0
      ? Math.round((videoCoverage / totalSubtopicCount) * 100)
      : 0;

    const totalAiSessions = INITIAL_STUDENTS.reduce((acc, s) => acc + (s.aiSessionCount ?? 0), 0);
    const strugglingStudents = INITIAL_STUDENTS.filter(s => s.learningStatus === 'struggling').length;

    return { totalStudents, totalStandards, totalSections, totalTopics, totalSubTopics, totalQuizQuestions, videoCoveragePct, totalAiSessions, strugglingStudents };
  }, []);

  const enrollmentRows = useMemo(() => {
    return MOCK_STANDARDS.flatMap(std => {
      const sections = MOCK_CLASSES.filter(c => c.standardId === std.id);
      return sections.map(sec => {
        const count = INITIAL_STUDENTS.filter(s => s.standardId === std.id && s.classId === sec.id).length;
        const topicsForSection = INITIAL_CURRICULUM_DATA
          .find(s => s.id === std.id)
          ?.classes.find(c => c.id === sec.id)
          ?.curriculum.length ?? 0;
        return { standard: std.name, section: sec.name, students: count, topics: topicsForSection };
      });
    });
  }, []);

  const curriculumRows = useMemo(() => {
    const rows: { standard: string; topic: string; subtopics: number; questions: number; hasVideo: boolean }[] = [];
    for (const std of INITIAL_CURRICULUM_DATA) {
      for (const cls of std.classes) {
        for (const topic of cls.curriculum) {
          const questions =
            (topic.preEvaluationQuiz?.length ?? 0) +
            (topic.postEvaluationQuiz?.length ?? 0) +
            topic.subTopics.reduce((a, s) => a + (s.quizzes?.length ?? 0), 0);
          const hasVideo = topic.subTopics.some(s => !!s.videoUrl);
          rows.push({ standard: std.name, topic: topic.title, subtopics: topic.subTopics.length, questions, hasVideo });
        }
      }
    }
    return rows;
  }, []);

  const recentStudents = useMemo(() => {
    return [...INITIAL_STUDENTS]
      .sort((a, b) => new Date(b.joinedAt ?? '').getTime() - new Date(a.joinedAt ?? '').getTime())
      .slice(0, 5)
      .map(s => ({
        ...s,
        standardName: MOCK_STANDARDS.find(st => st.id === s.standardId)?.name ?? '',
        sectionName: MOCK_CLASSES.find(c => c.id === s.classId)?.name ?? '',
      }));
  }, []);

  const atRiskStudents = useMemo(() => {
    return INITIAL_STUDENTS.filter(s => s.learningStatus === 'struggling').map(s => ({
      ...s,
      standardName: MOCK_STANDARDS.find(st => st.id === s.standardId)?.name ?? '',
      sectionName: MOCK_CLASSES.find(c => c.id === s.classId)?.name ?? '',
    }));
  }, []);

  const heatmapSections = useMemo(() => {
    return MOCK_CLASSES.map(cls => ({
      id: cls.id,
      name: cls.name,
      standardId: cls.standardId,
      standardName: MOCK_STANDARDS.find(s => s.id === cls.standardId)?.name ?? '',
    }));
  }, []);

  const heatmapTopics = useMemo(() => {
    const topicMap = new Map<string, { id: string; title: string; topicIdx: number }>();
    for (const std of INITIAL_CURRICULUM_DATA) {
      for (const cls of std.classes) {
        cls.curriculum.forEach((topic, idx) => {
          if (!topicMap.has(topic.id)) {
            topicMap.set(topic.id, { id: topic.id, title: topic.title, topicIdx: idx });
          }
        });
      }
    }
    return Array.from(topicMap.values());
  }, []);

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      sub: `Across ${stats.totalStandards} standards`,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      title: 'Standards & Sections',
      value: `${stats.totalStandards} / ${stats.totalSections}`,
      sub: `${stats.totalSections} active sections`,
      icon: Layers,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
    },
    {
      title: 'Curriculum Topics',
      value: stats.totalTopics,
      sub: `${stats.totalSubTopics} sub-topics total`,
      icon: BookOpen,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      title: 'Quiz Questions',
      value: stats.totalQuizQuestions,
      sub: `${stats.videoCoveragePct}% video coverage`,
      icon: FileQuestion,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-100',
    },
    {
      title: 'AI Sessions',
      value: stats.totalAiSessions,
      sub: `${stats.strugglingStudents} students need help`,
      icon: Brain,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
    },
  ];

  return (
    <AdminLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full max-w-[1600px] mx-auto space-y-6 p-4 sm:p-6 lg:p-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Platform Overview</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Live snapshot of students, curriculum, and content.</p>
          </div>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {statCards.map((card, i) => (
            <motion.div key={i} variants={itemVariants} className={`bg-white p-5 rounded-2xl border ${card.border} shadow-sm`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.bg}`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{card.title}</p>
              <p className="text-3xl font-extrabold text-slate-900 mb-1">{card.value}</p>
              <p className="text-xs font-medium text-slate-400">{card.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* At-Risk Students Alert */}
        {atRiskStudents.length > 0 && (
          <motion.div variants={itemVariants} className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-amber-900">Students Needing Attention</h2>
                <p className="text-xs text-amber-600">{atRiskStudents.length} student{atRiskStudents.length !== 1 ? 's are' : ' is'} struggling and may need additional support</p>
              </div>
              <button onClick={() => navigate('/admin/students')} className="ml-auto text-xs font-bold text-amber-700 hover:text-amber-900 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors">
                View All →
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {atRiskStudents.map(s => (
                <div key={s.id} className="bg-white border border-amber-100 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-extrabold text-sm shrink-0">
                    {s.studentName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{s.studentName}</p>
                    <p className="text-xs text-slate-500">{s.standardName} · {s.sectionName}</p>
                  </div>
                  {(s.aiSessionCount ?? 0) > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-indigo-50 rounded-lg shrink-0">
                      <Brain className="w-3 h-3 text-indigo-600" />
                      <span className="text-[10px] font-extrabold text-indigo-700">{s.aiSessionCount}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Class Progress Heatmap */}
        <motion.div variants={itemVariants}>
          <ClassHeatmap
            sections={heatmapSections}
            topics={heatmapTopics}
            students={INITIAL_STUDENTS}
          />
        </motion.div>

        {/* Middle: Enrollment + Curriculum */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Enrollment Breakdown */}
          <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Enrollment by Section</h2>
              </div>
              <button onClick={() => navigate('/admin/students')} className="text-xs font-bold text-blue-600 hover:text-blue-700">
                Manage →
              </button>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-5">Standard</th>
                  <th className="py-3 px-5">Section</th>
                  <th className="py-3 px-5 text-center">Students</th>
                  <th className="py-3 px-5 text-center">Topics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enrollmentRows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-5">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-bold">{row.standard}</span>
                    </td>
                    <td className="py-3 px-5 text-sm font-semibold text-slate-700">{row.section}</td>
                    <td className="py-3 px-5 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 text-sm font-extrabold">{row.students}</span>
                    </td>
                    <td className="py-3 px-5 text-center">
                      {row.topics > 0 ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-xs font-bold">{row.topics}</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td colSpan={2} className="py-3 px-5 text-xs font-extrabold text-slate-600 uppercase tracking-wider">Total</td>
                  <td className="py-3 px-5 text-center text-sm font-extrabold text-slate-900">{stats.totalStudents}</td>
                  <td className="py-3 px-5 text-center text-sm font-extrabold text-slate-900">{stats.totalTopics}</td>
                </tr>
              </tfoot>
            </table>
          </motion.div>

          {/* Curriculum Topic Breakdown */}
          <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">Curriculum Topics</h2>
              </div>
              <button onClick={() => navigate('/admin/curriculum')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                Manage →
              </button>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-5">Topic</th>
                  <th className="py-3 px-5 text-center">Sub-topics</th>
                  <th className="py-3 px-5 text-center">Questions</th>
                  <th className="py-3 px-5 text-center">Video</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {curriculumRows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-5">
                      <p className="text-sm font-bold text-slate-900">{row.topic}</p>
                      <p className="text-xs text-slate-400 font-medium">{row.standard}</p>
                    </td>
                    <td className="py-3 px-5 text-center">
                      <span className="text-sm font-bold text-slate-700">{row.subtopics}</span>
                    </td>
                    <td className="py-3 px-5 text-center">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${row.questions > 0 ? 'bg-orange-50 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                        {row.questions > 0 ? row.questions : '—'}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-center">
                      {row.hasVideo ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 inline" />
                      ) : (
                        <Video className="w-4 h-4 text-slate-300 inline" />
                      )}
                    </td>
                  </tr>
                ))}
                {curriculumRows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-400 text-sm">No topics in curriculum yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </motion.div>
        </div>

        {/* Recent Students */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <h2 className="text-base font-bold text-slate-900">Recently Added Students</h2>
            </div>
            <button onClick={() => navigate('/admin/students')} className="text-xs font-bold text-blue-600 hover:text-blue-700">
              View All →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-5">Student</th>
                  <th className="py-3 px-5">Standard</th>
                  <th className="py-3 px-5">Section</th>
                  <th className="py-3 px-5">Email</th>
                  <th className="py-3 px-5 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-extrabold shrink-0">
                          {s.studentName.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-slate-900">{s.studentName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-bold">{s.standardName}</span>
                    </td>
                    <td className="py-3 px-5 text-sm text-slate-600 font-medium">{s.sectionName}</td>
                    <td className="py-3 px-5 text-sm text-slate-500">{s.studentEmail}</td>
                    <td className="py-3 px-5 text-right text-xs text-slate-400 font-semibold">{s.joinedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </AdminLayout>
  );
}
