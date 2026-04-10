import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, PlayCircle, HelpCircle, CheckCircle2, Circle, 
  ChevronDown, ChevronUp, Menu, X, Award, Target, BookOpen
} from 'lucide-react';
import { MOCK_STUDENT_CURRICULUM } from '../data/mockData';
import { Question, StudentSubTopicProgress } from '../types';
import { InlineQuiz } from '../components/InlineQuiz';

export function CoursePlayer() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({
    [MOCK_STUDENT_CURRICULUM.topics[0]?.id]: true
  });
  
  // State for the currently active item
  const [activeItem, setActiveItem] = useState<{
    topicId: string;
    subTopicId?: string;
    type: 'video' | 'quiz' | 'pre-evaluation' | 'section-end';
    data: any;
  } | null>(null);

  // Initialize active item on load
  useEffect(() => {
    const firstTopic = MOCK_STUDENT_CURRICULUM.topics[0];
    if (firstTopic && firstTopic.subTopics && firstTopic.subTopics.length > 0) {
      const firstSub = firstTopic.subTopics[0];
      if (firstSub.videoUrl) {
        setActiveItem({
          topicId: firstTopic.id,
          subTopicId: firstSub.id,
          type: 'video',
          data: firstSub
        });
      }
    }
  }, []);

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  const handleSubtopicClick = (topicId: string, sub: StudentSubTopicProgress) => {
    if (sub.videoUrl) {
      setActiveItem({ topicId, subTopicId: sub.id, type: 'video', data: sub });
    } else if (sub.quizzes && sub.quizzes.length > 0) {
      setActiveItem({ topicId, subTopicId: sub.id, type: 'quiz', data: sub });
    }
  };

  const renderContent = () => {
    if (!activeItem) return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center text-slate-500">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-bold text-slate-700">Select an item from the curriculum to start learning</h2>
        </div>
      </div>
    );

    if (activeItem.type === 'video') {
      const sub = activeItem.data as StudentSubTopicProgress;
      return (
        <div className="flex-1 flex flex-col bg-black">
          <div className="w-full max-w-[1600px] mx-auto flex-1 flex flex-col justify-center p-4">
            <div className="relative w-full pt-[56.25%] bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800">
              <iframe
                src={sub.videoUrl}
                className="absolute top-0 left-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="mt-6 text-white">
              <h2 className="text-2xl font-bold">{sub.title}</h2>
              <p className="text-slate-400 mt-2">Watch the video to understand the core concepts of this subtopic.</p>
            </div>
          </div>
        </div>
      );
    }

    if (activeItem.type === 'quiz' || activeItem.type === 'pre-evaluation') {
      const questions = activeItem.type === 'quiz' 
        ? (activeItem.data as StudentSubTopicProgress).quizzes 
        : activeItem.data.questions;
      
      const title = activeItem.type === 'quiz' 
        ? `${(activeItem.data as StudentSubTopicProgress).title} - Quiz`
        : 'Pre-evaluation Quiz';

      return (
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8">
          <div className="w-full max-w-[1600px] mx-auto">
            <InlineQuiz 
              title={title}
              questions={questions || []}
              initialAnswers={activeItem.type === 'quiz' ? (activeItem.data as StudentSubTopicProgress).quizScore?.pastAnswers : activeItem.data.score?.pastAnswers}
              isReviewMode={activeItem.type === 'quiz' ? !!(activeItem.data as StudentSubTopicProgress).quizScore : !!activeItem.data.score}
              onSubmit={(score, total) => {
                console.log(`Quiz submitted: ${score}/${total}`);
              }}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/courses')}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-300 hover:text-white flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline font-medium text-sm">Back to Dashboard</span>
          </button>
          <div className="h-6 w-px bg-slate-700 hidden sm:block"></div>
          <h1 className="font-bold text-lg hidden md:block">
            {MOCK_STUDENT_CURRICULUM.standard} - {MOCK_STUDENT_CURRICULUM.className} Curriculum
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Progress</div>
              <div className="text-sm font-bold">{MOCK_STUDENT_CURRICULUM.overallProgress}% Completed</div>
            </div>
            <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${MOCK_STUDENT_CURRICULUM.overallProgress}%` }}
              ></div>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors lg:hidden"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Main Player Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Content Area */}
        {renderContent()}

        {/* Curriculum Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div 
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="absolute lg:relative right-0 top-0 bottom-0 w-80 lg:w-96 bg-white border-l border-slate-200 flex flex-col shadow-2xl lg:shadow-none z-10"
            >
              <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0">
                <h2 className="font-bold text-slate-900">Course Content</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {MOCK_STUDENT_CURRICULUM.topics.map((topic, index) => (
                  <div key={topic.id} className="border-b border-slate-100 last:border-0">
                    {/* Topic Header */}
                    <button 
                      onClick={() => toggleTopic(topic.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex-1 pr-4">
                        <div className="text-xs font-bold text-slate-500 mb-1">Section {index + 1}</div>
                        <h3 className="font-bold text-slate-900 text-sm leading-tight">{topic.title}</h3>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                          <span>{topic.subtopicsCompleted}/{topic.totalSubtopics} | {topic.progress}%</span>
                        </div>
                      </div>
                      <div className="text-slate-400 shrink-0">
                        {expandedTopics[topic.id] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </button>

                    {/* Topic Content (Subtopics) */}
                    <AnimatePresence>
                      {expandedTopics[topic.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden bg-white"
                        >
                          {/* Pre-evaluation */}
                          {topic.preEvaluationQuiz && (
                            <button 
                              onClick={() => setActiveItem({ topicId: topic.id, type: 'pre-evaluation', data: { questions: topic.preEvaluationQuiz, score: topic.preEvaluationScore } })}
                              className={`w-full flex items-start gap-3 p-3 pl-4 hover:bg-slate-50 transition-colors text-left border-l-2 ${
                                activeItem?.type === 'pre-evaluation' && activeItem?.topicId === topic.id 
                                  ? 'border-blue-500 bg-blue-50/50' 
                                  : 'border-transparent'
                              }`}
                            >
                              <div className="mt-0.5 text-orange-500 shrink-0">
                                <Target className="w-4 h-4" />
                              </div>
                              <div>
                                <div className={`text-sm font-medium ${
                                  activeItem?.type === 'pre-evaluation' && activeItem?.topicId === topic.id ? 'text-blue-700 font-bold' : 'text-slate-700'
                                }`}>
                                  Pre-evaluation Quiz
                                </div>
                                {topic.preEvaluationScore && (
                                  <div className="text-xs text-slate-500 mt-0.5">Score: {topic.preEvaluationScore.score}/{topic.preEvaluationScore.total}</div>
                                )}
                              </div>
                            </button>
                          )}

                          {/* Subtopics */}
                          {topic.subTopics?.map(sub => (
                            <div key={sub.id}>
                              {/* Video Item */}
                              {sub.videoUrl && (
                                <button 
                                  onClick={() => handleSubtopicClick(topic.id, sub)}
                                  className={`w-full flex items-start gap-3 p-3 pl-4 hover:bg-slate-50 transition-colors text-left border-l-2 ${
                                    activeItem?.subTopicId === sub.id && activeItem?.type === 'video'
                                      ? 'border-blue-500 bg-blue-50/50' 
                                      : 'border-transparent'
                                  }`}
                                >
                                  <div className={`mt-0.5 shrink-0 ${sub.videoWatched ? 'text-green-500' : 'text-slate-400'}`}>
                                    {sub.videoWatched ? <CheckCircle2 className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                                  </div>
                                  <div className={`text-sm font-medium ${
                                    activeItem?.subTopicId === sub.id && activeItem?.type === 'video' ? 'text-blue-700 font-bold' : 'text-slate-700'
                                  }`}>
                                    {sub.title}
                                  </div>
                                </button>
                              )}

                              {/* Quiz Item */}
                              {sub.quizzes && sub.quizzes.length > 0 && (
                                <button 
                                  onClick={() => setActiveItem({ topicId: topic.id, subTopicId: sub.id, type: 'quiz', data: sub })}
                                  className={`w-full flex items-start gap-3 p-3 pl-4 hover:bg-slate-50 transition-colors text-left border-l-2 ${
                                    activeItem?.subTopicId === sub.id && activeItem?.type === 'quiz'
                                      ? 'border-blue-500 bg-blue-50/50' 
                                      : 'border-transparent'
                                  }`}
                                >
                                  <div className={`mt-0.5 shrink-0 ${sub.quizScore ? 'text-green-500' : 'text-slate-400'}`}>
                                    {sub.quizScore ? <CheckCircle2 className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
                                  </div>
                                  <div>
                                    <div className={`text-sm font-medium ${
                                      activeItem?.subTopicId === sub.id && activeItem?.type === 'quiz' ? 'text-blue-700 font-bold' : 'text-slate-700'
                                    }`}>
                                      Quiz: {sub.title}
                                    </div>
                                    {sub.quizScore && (
                                      <div className="text-xs text-slate-500 mt-0.5">Score: {sub.quizScore.score}/{sub.quizScore.total}</div>
                                    )}
                                  </div>
                                </button>
                              )}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
