import React, { useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Modal } from '../../components/ui/Modal';
import { CurriculumImportModal } from '../../components/CurriculumImportModal';
import { LevelImportPanel } from '../../components/LevelImportPanel';
import { ThresholdSlider } from '../../components/ui/ThresholdSlider';
import { 
  Plus, Edit2, Trash2, ChevronRight, 
  BookOpen, Layers, ListTree, AlertTriangle, Calculator,
  Video, HelpCircle, FileText, ArrowLeft, PlayCircle, CheckCircle2,
  Network, ClipboardCheck, X, BarChart2, Upload, Trophy, Sparkles
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Question, Prerequisite, SubTopic, Topic, CurriculumClass as Class, Standard,
  INITIAL_CURRICULUM_DATA
} from '../../data/adminMockData';

type ViewLevel = 'standards' | 'classes' | 'topics' | 'subtopics';

const INITIAL_DATA: Standard[] = INITIAL_CURRICULUM_DATA;

const getYoutubeEmbedUrl = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
};

// --- Mock Analytics Generator ---
const generateMockAnalytics = (questions: Question[]) => {
  const totalStudents = Math.floor(Math.random() * 100) + 50; // 50 to 150
  
  const questionStats = questions.map((q, index) => {
    const correct = Math.floor(totalStudents * (Math.random() * 0.4 + 0.4)); // 40% to 80% correct
    const incorrect = totalStudents - correct;
    return {
      questionId: q.id,
      name: `Q${index + 1}`,
      text: q.text,
      correct,
      incorrect,
      successRate: Math.round((correct / totalStudents) * 100)
    };
  });

  const averageScore = Math.round(questionStats.reduce((acc, curr) => acc + curr.successRate, 0) / (questions.length || 1));

  return {
    totalStudents,
    averageScore,
    questionStats
  };
};

export function AdminCurriculum() {
  const [data, setData] = useState<Standard[]>(INITIAL_DATA);
  const [showImport, setShowImport] = useState(false);
  
  // Navigation State
  const [view, setView] = useState<ViewLevel>('standards');
  const [selection, setSelection] = useState({
    standardId: '',
    classId: '',
    topicId: '',
    subtopicId: ''
  });
  const [activeTab, setActiveTab] = useState<'video' | 'quiz' | 'quiz-analytics' | 'preeval-analytics' | 'posteval-analytics'>('video');

  // Modal State
  const [modal, setModal] = useState<{ isOpen: boolean; type: string; payload: any }>({
    isOpen: false, type: '', payload: null
  });
  const [formData, setFormData] = useState<any>({});

  // --- Navigation Helpers ---
  const navigateTo = (level: ViewLevel, ids: Partial<typeof selection> = {}) => {
    setSelection(prev => ({ ...prev, ...ids }));
    setView(level);
    if (level === 'subtopics') setActiveTab('video' as any);
  };

  const currentStandard = data.find(s => s.id === selection.standardId);
  const currentClass = currentStandard?.classes.find(c => c.id === selection.classId);
  const currentTopic = currentClass?.curriculum.find(t => t.id === selection.topicId);
  const currentSubtopic = currentTopic?.subTopics.find(s => s.id === selection.subtopicId);

  // --- Modal Helpers ---
  const openModal = (type: string, payload: any = null) => {
    setModal({ isOpen: true, type, payload });
    if (type.startsWith('edit-')) {
      setFormData({ 
        ...payload,
        optionsArray: payload.options && Array.isArray(payload.options) ? [...payload.options] : ['', '', '', '']
      });
    } else if (type === 'add-topic') {
      setFormData({ sequence: (currentClass?.curriculum.length || 0) + 1 });
    } else if (type === 'add-quiz' || type === 'add-preeval-quiz' || type === 'add-finaltest-quiz') {
      setFormData({ type: 'mcq', optionsArray: ['', '', '', ''] });
    } else {
      setFormData({});
    }
  };

  const closeModal = () => setModal({ isOpen: false, type: '', payload: null });

  // --- CRUD Operations ---
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newData = [...data];
    const { type, payload } = modal;

    if (type === 'add-standard') {
      newData.push({ id: Date.now().toString(), name: formData.name, classes: [] });
    } else if (type === 'edit-standard') {
      const std = newData.find(s => s.id === payload.id);
      if (std) std.name = formData.name;
    } else if (type === 'add-class') {
      const std = newData.find(s => s.id === selection.standardId);
      if (std) std.classes.push({ id: Date.now().toString(), name: formData.name, curriculum: [] });
    } else if (type === 'edit-class') {
      const std = newData.find(s => s.id === selection.standardId);
      const cls = std?.classes.find(c => c.id === payload.id);
      if (cls) cls.name = formData.name;
    } else if (type === 'add-topic') {
      const std = newData.find(s => s.id === selection.standardId);
      const cls = std?.classes.find(c => c.id === selection.classId);
      if (cls) cls.curriculum.push({ id: Date.now().toString(), title: formData.title, sequence: parseInt(formData.sequence) || 1, subTopics: [] });
    } else if (type === 'edit-topic') {
      const std = newData.find(s => s.id === selection.standardId);
      const cls = std?.classes.find(c => c.id === selection.classId);
      const topic = cls?.curriculum.find(t => t.id === payload.id);
      if (topic) { topic.title = formData.title; topic.sequence = parseInt(formData.sequence) || 1; }
    } else if (type === 'add-subtopic') {
      const std = newData.find(s => s.id === selection.standardId);
      const cls = std?.classes.find(c => c.id === selection.classId);
      const topic = cls?.curriculum.find(t => t.id === selection.topicId);
      if (topic) topic.subTopics.push({ id: Date.now().toString(), title: formData.title, videoUrl: '', quizzes: [] });
    } else if (type === 'edit-subtopic') {
      const std = newData.find(s => s.id === selection.standardId);
      const cls = std?.classes.find(c => c.id === selection.classId);
      const topic = cls?.curriculum.find(t => t.id === selection.topicId);
      const sub = topic?.subTopics.find(s => s.id === payload.id);
      if (sub) sub.title = formData.title;
    } else if (type === 'edit-video') {
      const std = newData.find(s => s.id === selection.standardId);
      const cls = std?.classes.find(c => c.id === selection.classId);
      const topic = cls?.curriculum.find(t => t.id === selection.topicId);
      const sub = topic?.subTopics.find(s => s.id === selection.subtopicId);
      if (sub) sub.videoUrl = formData.videoUrl;
    } else if (type === 'add-quiz') {
      const std = newData.find(s => s.id === selection.standardId);
      const cls = std?.classes.find(c => c.id === selection.classId);
      const topic = cls?.curriculum.find(t => t.id === selection.topicId);
      const sub = topic?.subTopics.find(s => s.id === selection.subtopicId);
      if (sub) {
        if (!sub.quizzes) sub.quizzes = [];
        sub.quizzes.push({
          id: Date.now().toString(),
          text: formData.text,
          type: formData.type || 'mcq',
          options: formData.type === 'mcq' ? (formData.optionsArray || []).filter((o: string) => o.trim() !== '') : formData.type === 'boolean' ? ['True', 'False'] : [],
          correctAnswer: formData.correctAnswer,
          explanation: formData.explanation || '',
          difficulty: formData.difficulty || 'Medium'
        });
      }
    } else if (type === 'edit-quiz') {
      const std = newData.find(s => s.id === selection.standardId);
      const cls = std?.classes.find(c => c.id === selection.classId);
      const topic = cls?.curriculum.find(t => t.id === selection.topicId);
      const sub = topic?.subTopics.find(s => s.id === selection.subtopicId);
      const quiz = sub?.quizzes?.find(q => q.id === payload.id);
      if (quiz) {
        quiz.text = formData.text;
        quiz.type = formData.type;
        quiz.options = formData.type === 'mcq' ? (formData.optionsArray || []).filter((o: string) => o.trim() !== '') : formData.type === 'boolean' ? ['True', 'False'] : [];
        quiz.correctAnswer = formData.correctAnswer;
        quiz.explanation = formData.explanation;
        quiz.difficulty = formData.difficulty;
      }
    } else if (type === 'add-prerequisite') {
      const std = newData.find(s => s.id === selection.standardId);
      const cls = std?.classes.find(c => c.id === selection.classId);
      const topic = cls?.curriculum.find(t => t.id === selection.topicId);
      if (topic) {
        if (!topic.prerequisites) topic.prerequisites = [];
        topic.prerequisites.push({
          id: Date.now().toString(),
          title: formData.title,
          category: formData.category || 'Minor'
        });
      }
    } else if (type === 'add-finaltest-quiz') {
      const std = newData.find(s => s.id === selection.standardId);
      const cls = std?.classes.find(c => c.id === selection.classId);
      const topic = cls?.curriculum.find(t => t.id === selection.topicId);
      if (topic) {
        if (!topic.finalTestQuiz) topic.finalTestQuiz = [];
        topic.finalTestQuiz.push({
          id: Date.now().toString(),
          text: formData.text,
          type: formData.type || 'mcq',
          options: formData.type === 'mcq' ? (formData.optionsArray || []).filter((o: string) => o.trim() !== '') : formData.type === 'boolean' ? ['True', 'False'] : [],
          correctAnswer: formData.correctAnswer,
          explanation: formData.explanation || '',
          difficulty: formData.difficulty || 'Medium'
        });
      }
    } else if (type === 'edit-finaltest-quiz') {
      const std = newData.find(s => s.id === selection.standardId);
      const cls = std?.classes.find(c => c.id === selection.classId);
      const topic = cls?.curriculum.find(t => t.id === selection.topicId);
      const quiz = topic?.finalTestQuiz?.find(q => q.id === payload.id);
      if (quiz) {
        quiz.text = formData.text;
        quiz.type = formData.type;
        quiz.options = formData.type === 'mcq' ? (formData.optionsArray || []).filter((o: string) => o.trim() !== '') : formData.type === 'boolean' ? ['True', 'False'] : [];
        quiz.correctAnswer = formData.correctAnswer;
        quiz.explanation = formData.explanation;
        quiz.difficulty = formData.difficulty;
      }
    } else if (type === 'edit-prerequisite') {
      const std = newData.find(s => s.id === selection.standardId);
      const cls = std?.classes.find(c => c.id === selection.classId);
      const topic = cls?.curriculum.find(t => t.id === selection.topicId);
      const req = topic?.prerequisites?.find(p => p.id === payload.id);
      if (req) {
        req.title = formData.title;
        req.category = formData.category;
      }
    } else if (type === 'add-preeval-quiz') {
      const std = newData.find(s => s.id === selection.standardId);
      const cls = std?.classes.find(c => c.id === selection.classId);
      const topic = cls?.curriculum.find(t => t.id === selection.topicId);
      if (topic) {
        if (!topic.preEvaluationQuiz) topic.preEvaluationQuiz = [];
        topic.preEvaluationQuiz.push({
          id: Date.now().toString(),
          text: formData.text,
          type: formData.type || 'mcq',
          options: formData.type === 'mcq' ? (formData.optionsArray || []).filter((o: string) => o.trim() !== '') : formData.type === 'boolean' ? ['True', 'False'] : [],
          correctAnswer: formData.correctAnswer,
          explanation: formData.explanation || '',
          difficulty: formData.difficulty || 'Medium'
        });
      }
    } else if (type === 'edit-preeval-quiz') {
      const std = newData.find(s => s.id === selection.standardId);
      const cls = std?.classes.find(c => c.id === selection.classId);
      const topic = cls?.curriculum.find(t => t.id === selection.topicId);
      const quiz = topic?.preEvaluationQuiz?.find(q => q.id === payload.id);
      if (quiz) {
        quiz.text = formData.text;
        quiz.type = formData.type;
        quiz.options = formData.type === 'mcq' ? (formData.optionsArray || []).filter((o: string) => o.trim() !== '') : formData.type === 'boolean' ? ['True', 'False'] : [];
        quiz.correctAnswer = formData.correctAnswer;
        quiz.explanation = formData.explanation;
        quiz.difficulty = formData.difficulty;
      }
    } else if (type === 'add-posteval-quiz') {
      const std = newData.find(s => s.id === selection.standardId);
      const cls = std?.classes.find(c => c.id === selection.classId);
      const topic = cls?.curriculum.find(t => t.id === selection.topicId);
      if (topic) {
        if (!topic.postEvaluationQuiz) topic.postEvaluationQuiz = [];
        topic.postEvaluationQuiz.push({
          id: Date.now().toString(),
          text: formData.text,
          type: formData.type || 'mcq',
          options: formData.type === 'mcq' ? (formData.optionsArray || []).filter((o: string) => o.trim() !== '') : formData.type === 'boolean' ? ['True', 'False'] : [],
          correctAnswer: formData.correctAnswer,
          explanation: formData.explanation || '',
          difficulty: formData.difficulty || 'Medium'
        });
      }
    } else if (type === 'edit-posteval-quiz') {
      const std = newData.find(s => s.id === selection.standardId);
      const cls = std?.classes.find(c => c.id === selection.classId);
      const topic = cls?.curriculum.find(t => t.id === selection.topicId);
      const quiz = topic?.postEvaluationQuiz?.find(q => q.id === payload.id);
      if (quiz) {
        quiz.text = formData.text;
        quiz.type = formData.type;
        quiz.options = formData.type === 'mcq' ? (formData.optionsArray || []).filter((o: string) => o.trim() !== '') : formData.type === 'boolean' ? ['True', 'False'] : [];
        quiz.correctAnswer = formData.correctAnswer;
        quiz.explanation = formData.explanation;
        quiz.difficulty = formData.difficulty;
      }
    }

    // Sort topics by sequence
    newData.forEach(std => std.classes.forEach(cls => cls.curriculum.sort((a, b) => a.sequence - b.sequence)));
    setData(newData);
    closeModal();
  };

  const handleDelete = () => {
    const newData = [...data];
    const { itemType, id } = modal.payload;

    if (itemType === 'standard') {
      setData(newData.filter(s => s.id !== id));
    } else if (itemType === 'class') {
      const std = newData.find(s => s.id === selection.standardId);
      if (std) std.classes = std.classes.filter(c => c.id !== id);
      setData(newData);
    } else if (itemType === 'topic') {
      const std = newData.find(s => s.id === selection.standardId);
      const cls = std?.classes.find(c => c.id === selection.classId);
      if (cls) cls.curriculum = cls.curriculum.filter(t => t.id !== id);
      setData(newData);
    } else if (itemType === 'subtopic') {
      const std = newData.find(s => s.id === selection.standardId);
      const cls = std?.classes.find(c => c.id === selection.classId);
      const topic = cls?.curriculum.find(t => t.id === selection.topicId);
      if (topic) topic.subTopics = topic.subTopics.filter(s => s.id !== id);
      setData(newData);
    } else if (itemType === 'quiz') {
      const std = newData.find(s => s.id === selection.standardId);
      const cls = std?.classes.find(c => c.id === selection.classId);
      const topic = cls?.curriculum.find(t => t.id === selection.topicId);
      const sub = topic?.subTopics.find(s => s.id === selection.subtopicId);
      if (sub && sub.quizzes) sub.quizzes = sub.quizzes.filter(q => q.id !== id);
      setData(newData);
    } else if (itemType === 'prerequisite') {
      const std = newData.find(s => s.id === selection.standardId);
      const cls = std?.classes.find(c => c.id === selection.classId);
      const topic = cls?.curriculum.find(t => t.id === selection.topicId);
      if (topic && topic.prerequisites) topic.prerequisites = topic.prerequisites.filter(p => p.id !== id);
      setData(newData);
    } else if (itemType === 'preeval-quiz') {
      const std = newData.find(s => s.id === selection.standardId);
      const cls = std?.classes.find(c => c.id === selection.classId);
      const topic = cls?.curriculum.find(t => t.id === selection.topicId);
      if (topic && topic.preEvaluationQuiz) topic.preEvaluationQuiz = topic.preEvaluationQuiz.filter(q => q.id !== id);
      setData(newData);
    } else if (itemType === 'finaltest-quiz') {
      const std = newData.find(s => s.id === selection.standardId);
      const cls = std?.classes.find(c => c.id === selection.classId);
      const topic = cls?.curriculum.find(t => t.id === selection.topicId);
      if (topic && topic.finalTestQuiz) topic.finalTestQuiz = topic.finalTestQuiz.filter(q => q.id !== id);
      setData(newData);
    } else if (itemType === 'posteval-quiz') {
      const std = newData.find(s => s.id === selection.standardId);
      const cls = std?.classes.find(c => c.id === selection.classId);
      const topic = cls?.curriculum.find(t => t.id === selection.topicId);
      if (topic && topic.postEvaluationQuiz) topic.postEvaluationQuiz = topic.postEvaluationQuiz.filter(q => q.id !== id);
      setData(newData);
    }
    closeModal();
  };

  // --- Render Views ---
  const renderBreadcrumbs = () => {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-slate-600 overflow-x-auto whitespace-nowrap pb-4 mb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mr-2 pr-4 border-r border-slate-300">
          <Calculator className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-slate-900">Curriculum</span>
        </div>
        <button onClick={() => navigateTo('standards')} className={`hover:text-blue-600 transition-colors ${view === 'standards' ? 'text-blue-600 font-bold' : ''}`}>
          Standards
        </button>
        
        {view !== 'standards' && currentStandard && (
          <>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            <button onClick={() => navigateTo('classes')} className={`hover:text-blue-600 transition-colors ${view === 'classes' ? 'text-blue-600 font-bold' : ''}`}>
              {currentStandard.name}
            </button>
          </>
        )}
        
        {['topics', 'subtopics'].includes(view) && currentClass && (
          <>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            <button onClick={() => navigateTo('topics')} className={`hover:text-blue-600 transition-colors ${view === 'topics' ? 'text-blue-600 font-bold' : ''}`}>
              {currentClass.name}
            </button>
          </>
        )}
        
        {view === 'subtopics' && currentTopic && (
          <>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            <span className="text-slate-900 font-bold">{currentTopic.title}</span>
          </>
        )}
      </div>
    );
  };

  const renderStandards = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-extrabold text-slate-900">Standards</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <button onClick={() => openModal('add-standard')} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Standard
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(std => (
          <div key={std.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal('edit-standard', std)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => openModal('delete-confirm', { itemType: 'standard', id: std.id, name: std.name })} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">{std.name}</h3>
            <p className="text-sm text-slate-500 mb-4">{std.classes.length} Classes</p>
            <button onClick={() => navigateTo('classes', { standardId: std.id })} className="w-full py-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
              Manage Classes <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        ))}
        {data.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">No Standards Found</h3>
            <p className="text-slate-500">Get started by adding your first educational standard.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderClasses = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-extrabold text-slate-900">Classes in {currentStandard?.name}</h2>
        <button onClick={() => openModal('add-class')} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Class
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentStandard?.classes.map(cls => (
          <div key={cls.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal('edit-class', cls)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => openModal('delete-confirm', { itemType: 'class', id: cls.id, name: cls.name })} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">{cls.name}</h3>
            <p className="text-sm text-slate-500 mb-4">{cls.curriculum.length} Topics</p>
            <button onClick={() => navigateTo('topics', { classId: cls.id })} className="w-full py-2 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
              Manage Topics <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        ))}
        {currentStandard?.classes.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">No Classes Found</h3>
            <p className="text-slate-500">Add classes or sections to this standard.</p>
          </div>
        )}
      </div>
    </div>
  );

  // ── Level import handlers ────────────────────────────────────────────────
  const handleImportTopics = (items: any[]) => {
    const newData = [...data];
    const std = newData.find(s => s.id === selection.standardId);
    const cls = std?.classes.find(c => c.id === selection.classId);
    if (!cls) return;
    const existing = new Set(cls.curriculum.map(t => t.title.toLowerCase()));
    let nextSeq = (cls.curriculum.reduce((m, t) => Math.max(m, t.sequence), 0)) + 1;
    for (const item of items) {
      if (!existing.has(item.title.toLowerCase())) {
        cls.curriculum.push({ id: Date.now().toString() + Math.random(), title: item.title, sequence: item.sequence || nextSeq++, subTopics: [] });
        existing.add(item.title.toLowerCase());
      }
    }
    cls.curriculum.sort((a, b) => a.sequence - b.sequence);
    setData(newData);
  };

  const handleImportSubtopics = (items: any[]) => {
    const newData = [...data];
    const std = newData.find(s => s.id === selection.standardId);
    const cls = std?.classes.find(c => c.id === selection.classId);
    const topic = cls?.curriculum.find(t => t.id === selection.topicId);
    if (!topic) return;
    const existing = new Set(topic.subTopics.map(s => s.title.toLowerCase()));
    for (const item of items) {
      if (!existing.has(item.title.toLowerCase())) {
        topic.subTopics.push({ id: Date.now().toString() + Math.random(), title: item.title, videoUrl: item.videoUrl || '', quizzes: [] });
        existing.add(item.title.toLowerCase());
      }
    }
    setData(newData);
  };

  const handleImportPrereqs = (items: any[]) => {
    const newData = [...data];
    const std = newData.find(s => s.id === selection.standardId);
    const cls = std?.classes.find(c => c.id === selection.classId);
    const topic = cls?.curriculum.find(t => t.id === selection.topicId);
    if (!topic) return;
    if (!topic.prerequisites) topic.prerequisites = [];
    const existing = new Set(topic.prerequisites.map(p => p.title.toLowerCase()));
    for (const item of items) {
      if (!existing.has(item.title.toLowerCase())) {
        topic.prerequisites.push({ id: Date.now().toString() + Math.random(), title: item.title, category: item.category || 'Minor' });
        existing.add(item.title.toLowerCase());
      }
    }
    setData(newData);
  };

  const handleImportPreEvalQuestions = (items: any[]) => {
    const newData = [...data];
    const std = newData.find(s => s.id === selection.standardId);
    const cls = std?.classes.find(c => c.id === selection.classId);
    const topic = cls?.curriculum.find(t => t.id === selection.topicId);
    if (!topic) return;
    if (!topic.preEvaluationQuiz) topic.preEvaluationQuiz = [];
    topic.preEvaluationQuiz.push(...items);
    setData(newData);
  };

  const handleImportPostEvalQuestions = (items: any[]) => {
    const newData = [...data];
    const std = newData.find(s => s.id === selection.standardId);
    const cls = std?.classes.find(c => c.id === selection.classId);
    const topic = cls?.curriculum.find(t => t.id === selection.topicId);
    if (!topic) return;
    if (!topic.postEvaluationQuiz) topic.postEvaluationQuiz = [];
    topic.postEvaluationQuiz.push(...items);
    setData(newData);
  };

  const handleImportSubtopicQuestions = (items: any[]) => {
    const newData = [...data];
    const std = newData.find(s => s.id === selection.standardId);
    const cls = std?.classes.find(c => c.id === selection.classId);
    const topic = cls?.curriculum.find(t => t.id === selection.topicId);
    const sub = topic?.subTopics.find(s => s.id === selection.subtopicId);
    if (!sub) return;
    if (!sub.quizzes) sub.quizzes = [];
    sub.quizzes.push(...items);
    setData(newData);
  };

  const renderTopics = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-extrabold text-slate-900">Topics in {currentClass?.name}</h2>
        <button onClick={() => openModal('add-topic')} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Topic
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {currentClass?.curriculum.map(topic => (
            <div key={topic.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 font-black flex items-center justify-center">
                  {topic.sequence}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{topic.title}</h3>
                  <p className="text-sm text-slate-500">{topic.subTopics.length} Sub-topics</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                  <button onClick={() => openModal('edit-topic', topic)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => openModal('delete-confirm', { itemType: 'topic', id: topic.id, name: topic.title })} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
                <button onClick={() => navigateTo('subtopics', { topicId: topic.id, subtopicId: 'prerequisites' })} className="px-4 py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold rounded-xl transition-colors text-sm flex items-center gap-2">
                  Manage Topic <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {currentClass?.curriculum.length === 0 && (
            <div className="py-12 text-center">
              <ListTree className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">No Topics Found</h3>
              <p className="text-slate-500">Add topics to build the curriculum.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bulk import topics */}
      <LevelImportPanel
        target="topics"
        accent="blue"
        contextLabel={currentClass?.name}
        onImport={handleImportTopics}
      />
    </div>
  );

  const renderQuizCard = (quiz: Question, index: number, editType: string, deleteType: string) => (
    <div key={quiz.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative group">
      <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => openModal(editType, quiz)} className="p-2 bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
        <button onClick={() => openModal('delete-confirm', { itemType: deleteType, id: quiz.id, name: 'Question' })} className="p-2 bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
      </div>
      
      <div className="flex items-center gap-3 mb-4">
        <span className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">Q{index + 1}</span>
        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-bold uppercase tracking-wider">
          {quiz.type === 'mcq' ? 'Multiple Choice' : quiz.type === 'boolean' ? 'True / False' : 'Short Answer'}
        </span>
        <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
          quiz.difficulty === 'Hard' ? 'bg-red-50 text-red-700' :
          quiz.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700' :
          'bg-green-50 text-green-700'
        }`}>
          {quiz.difficulty}
        </span>
      </div>
      
      <p className="text-lg font-semibold text-slate-900 mb-6 pr-20">{quiz.text}</p>
      
      {(quiz.type === 'mcq' || quiz.type === 'boolean') && quiz.options && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {quiz.options.map((opt, oIndex) => {
            const isCorrect = opt === quiz.correctAnswer;
            return (
              <div key={oIndex} className={`p-4 rounded-xl border-2 flex items-center justify-between ${isCorrect ? 'border-green-500 bg-green-50' : 'border-slate-100 bg-slate-50'}`}>
                <span className={`font-medium ${isCorrect ? 'text-green-900' : 'text-slate-700'}`}>{opt}</span>
                {isCorrect && <CheckCircle2 className="w-5 h-5 text-green-600" />}
              </div>
            );
          })}
        </div>
      )}

      {quiz.type === 'text' && (
        <div className="mb-6 p-4 rounded-xl border-2 border-green-500 bg-green-50 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold text-green-800 uppercase tracking-wider block mb-1">Accepted Answer</span>
            <span className="font-medium text-green-900">{quiz.correctAnswer}</span>
          </div>
        </div>
      )}

      {quiz.explanation && (
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block mb-1">Explanation</span>
          <p className="text-sm text-blue-900">{quiz.explanation}</p>
        </div>
      )}
    </div>
  );

  const renderFinalTest = () => {
    const hasQuestions = (currentTopic?.finalTestQuiz?.length ?? 0) > 0;
    const showAnalytics = activeTab === ('finaltest-analytics' as any);
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                <Trophy className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">Final Topic Test</h2>
            </div>
            <p className="text-sm text-slate-500">Comprehensive test after students complete all subtopics. 60% required to pass.</p>
          </div>
          <button onClick={() => openModal('add-finaltest-quiz')} className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 transition-colors shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>

        {/* AI info callout */}
        <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
          <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-indigo-900 mb-0.5">AI-Assisted Feedback</p>
            <p className="text-xs text-indigo-700">If a student fails this test, the AI will analyze their wrong answers and provide personalized teaching before allowing a retake.</p>
          </div>
        </div>

        {/* Tabs */}
        {hasQuestions && (
          <div className="flex gap-1 border-b border-slate-200 mb-2">
            <button
              onClick={() => setActiveTab('video' as any)}
              className={`px-4 py-2 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${
                !showAnalytics ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <HelpCircle className="w-4 h-4" /> Questions
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs ml-1">{currentTopic?.finalTestQuiz?.length ?? 0}</span>
            </button>
            <button
              onClick={() => setActiveTab('finaltest-analytics' as any)}
              className={`px-4 py-2 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${
                showAnalytics ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <BarChart2 className="w-4 h-4" /> Analytics
            </button>
          </div>
        )}

        {showAnalytics ? (
          renderAnalyticsPanel(currentTopic?.finalTestQuiz ?? [], '#d97706')
        ) : (!currentTopic?.finalTestQuiz || currentTopic.finalTestQuiz.length === 0) ? (
          <div className="py-16 text-center border-2 border-dashed border-amber-200 rounded-2xl bg-amber-50">
            <Trophy className="w-16 h-16 text-amber-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Final Test Questions</h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">Add comprehensive questions to test student mastery of the entire topic.</p>
            <button onClick={() => openModal('add-finaltest-quiz')} className="px-6 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors shadow-sm">
              Create First Question
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {currentTopic.finalTestQuiz.map((quiz, index) => renderQuizCard(quiz, index, 'edit-finaltest-quiz', 'finaltest-quiz'))}
          </div>
        )}
      </div>
    );
  };

  const renderPrerequisites = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Prerequisites</h2>
          <p className="text-sm text-slate-500">Topics students should know before starting this section.</p>
        </div>
        <button onClick={() => openModal('add-prerequisite')} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Prerequisite
        </button>
      </div>

      {/* Bulk import prerequisites */}
      <LevelImportPanel
        target="prerequisites"
        accent="purple"
        contextLabel={currentTopic?.title}
        onImport={handleImportPrereqs}
      />

      {(!currentTopic?.prerequisites || currentTopic.prerequisites.length === 0) ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
          <Network className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Prerequisites</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">Add topics that are required to understand this section.</p>
          <button onClick={() => openModal('add-prerequisite')} className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-sm">
            Add First Prerequisite
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {currentTopic.prerequisites.map(req => (
            <div key={req.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                    req.category === 'Major' ? 'bg-red-50 text-red-700' :
                    req.category === 'Intermediate' ? 'bg-amber-50 text-amber-700' :
                    'bg-green-50 text-green-700'
                  }`}>
                    {req.category}
                  </span>
                  <span className="font-bold text-slate-900">{req.title}</span>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal('edit-prerequisite', req)} className="p-2 bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => openModal('delete-confirm', { itemType: 'prerequisite', id: req.id, name: req.title })} className="p-2 bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              {/* Threshold slider */}
              <ThresholdSlider
                value={req.passingThreshold ?? 60}
                onChange={(val) => {
                  const newData = [...data];
                  const std = newData.find(s => s.id === selection.standardId);
                  const cls = std?.classes.find(c => c.id === selection.classId);
                  const topic = cls?.curriculum.find(t => t.id === selection.topicId);
                  const prereq = topic?.prerequisites?.find(p => p.id === req.id);
                  if (prereq) prereq.passingThreshold = val;
                  setData(newData);
                }}
                label="Passing threshold"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAnalyticsPanel = (questions: Question[], accentColor: string) => {
    if (!questions || questions.length === 0) {
      return (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
          <BarChart2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Analytics Available</h3>
          <p className="text-slate-500">Add questions to see student performance analytics.</p>
        </div>
      );
    }
    const analytics = generateMockAnalytics(questions);
    const pieData = [
      { name: 'Score', value: analytics.averageScore, fill: accentColor },
      { name: 'Gap', value: 100 - analytics.averageScore, fill: '#e2e8f0' }
    ];
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Total Students</p>
            <p className="text-4xl font-extrabold text-blue-900">{analytics.totalStudents}</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold text-green-500 uppercase tracking-widest mb-1">Average Score</p>
            <p className="text-4xl font-extrabold text-green-900">{analytics.averageScore}%</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Pass Rate</p>
            <div className="relative w-20 h-20">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={38} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-slate-900">{analytics.averageScore}%</span>
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-extrabold text-slate-900 mb-1">Question-by-Question Performance</h3>
          <p className="text-xs text-slate-500 mb-5">Correct vs incorrect answers per question across all students</p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.questionStats} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dx={-10} />
                <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend wrapperStyle={{ paddingTop: '16px' }} />
                <Bar dataKey="correct" name="Correct" stackId="a" fill="#22c55e" radius={[0,0,4,4]} maxBarSize={48} />
                <Bar dataKey="incorrect" name="Incorrect" stackId="a" fill="#ef4444" radius={[4,4,0,0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Per-question detail table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900">Per-Question Breakdown</h3>
            <p className="text-xs text-slate-500 mt-0.5">Detailed statistics for every question in this quiz</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">#</th>
                  <th className="py-3 px-5">Question</th>
                  <th className="py-3 px-5 text-center">Correct</th>
                  <th className="py-3 px-5 text-center">Incorrect</th>
                  <th className="py-3 px-5 text-center">Total</th>
                  <th className="py-3 px-5 text-right">Success Rate</th>
                  <th className="py-3 px-5 text-right">Difficulty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analytics.questionStats.map((stat, idx) => {
                  const q = questions[idx];
                  return (
                    <tr key={stat.questionId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-5">
                        <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold">Q{idx + 1}</span>
                      </td>
                      <td className="py-3 px-5 max-w-xs">
                        <p className="text-sm font-medium text-slate-900 line-clamp-2">{stat.text}</p>
                        <span className="text-xs text-slate-400 font-semibold">{q?.type === 'mcq' ? 'MCQ' : q?.type === 'boolean' ? 'True/False' : 'Short Answer'}</span>
                      </td>
                      <td className="py-3 px-5 text-center">
                        <span className="text-sm font-bold text-green-600">{stat.correct}</span>
                      </td>
                      <td className="py-3 px-5 text-center">
                        <span className="text-sm font-bold text-red-500">{stat.incorrect}</span>
                      </td>
                      <td className="py-3 px-5 text-center">
                        <span className="text-sm font-medium text-slate-500">{analytics.totalStudents}</span>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${stat.successRate}%`, backgroundColor: stat.successRate >= 70 ? '#22c55e' : stat.successRate >= 40 ? '#f59e0b' : '#ef4444' }} />
                          </div>
                          <span className={`text-xs font-extrabold ${
                            stat.successRate >= 70 ? 'text-green-600' : stat.successRate >= 40 ? 'text-amber-600' : 'text-red-600'
                          }`}>{stat.successRate}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                          q?.difficulty === 'Hard' ? 'bg-red-50 text-red-700' :
                          q?.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700' :
                          'bg-green-50 text-green-700'
                        }`}>{q?.difficulty}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderPreEvaluation = () => {
    const hasQuestions = (currentTopic?.preEvaluationQuiz?.length ?? 0) > 0;
    const preEvalTab = selection.subtopicId === 'preevaluation';
    const showAnalytics = activeTab === ('preeval-analytics' as any);
    return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Pre-evaluation Quiz</h2>
          <p className="text-sm text-slate-500">Assess students' readiness before they start this topic.</p>
        </div>
        <button onClick={() => openModal('add-preeval-quiz')} className="px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 transition-colors shadow-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Question
        </button>
      </div>

      {/* Tabs */}
      {hasQuestions && (
        <div className="flex gap-1 border-b border-slate-200 mb-2">
          <button
            onClick={() => setActiveTab('video' as any)}
            className={`px-4 py-2 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${
              !showAnalytics ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <HelpCircle className="w-4 h-4" /> Questions
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs ml-1">{currentTopic?.preEvaluationQuiz?.length ?? 0}</span>
          </button>
          <button
            onClick={() => setActiveTab('preeval-analytics' as any)}
            className={`px-4 py-2 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${
              showAnalytics ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <BarChart2 className="w-4 h-4" /> Analytics
          </button>
        </div>
      )}

      {showAnalytics ? (
        renderAnalyticsPanel(currentTopic?.preEvaluationQuiz ?? [], '#f97316')
      ) : (!currentTopic?.preEvaluationQuiz || currentTopic.preEvaluationQuiz.length === 0) ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
          <ClipboardCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Pre-evaluation Questions</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">Create questions to test if students meet the prerequisites.</p>
          <button onClick={() => openModal('add-preeval-quiz')} className="px-6 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors shadow-sm">
            Create First Question
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {currentTopic.preEvaluationQuiz.map((quiz, index) => renderQuizCard(quiz, index, 'edit-preeval-quiz', 'preeval-quiz'))}
        </div>
      )}

      {/* Bulk import pre-eval questions */}
      {!showAnalytics && (
        <LevelImportPanel
          target="questions"
          accent="orange"
          contextLabel={`Pre-eval — ${currentTopic?.title}`}
          onImport={handleImportPreEvalQuestions}
        />
      )}
    </div>
    );
  };

  const renderPostEvaluation = () => {
    const hasQuestions = (currentTopic?.postEvaluationQuiz?.length ?? 0) > 0;
    const showAnalytics = activeTab === ('posteval-analytics' as any);
    return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Section End Quiz (Post-evaluation)</h2>
          <p className="text-sm text-slate-500">Assess students' understanding after they complete this topic.</p>
        </div>
        <button onClick={() => openModal('add-posteval-quiz')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Question
        </button>
      </div>

      {/* Tabs */}
      {hasQuestions && (
        <div className="flex gap-1 border-b border-slate-200 mb-2">
          <button
            onClick={() => setActiveTab('video' as any)}
            className={`px-4 py-2 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${
              !showAnalytics ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <HelpCircle className="w-4 h-4" /> Questions
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs ml-1">{currentTopic?.postEvaluationQuiz?.length ?? 0}</span>
          </button>
          <button
            onClick={() => setActiveTab('posteval-analytics' as any)}
            className={`px-4 py-2 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${
              showAnalytics ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <BarChart2 className="w-4 h-4" /> Analytics
          </button>
        </div>
      )}

      {showAnalytics ? (
        renderAnalyticsPanel(currentTopic?.postEvaluationQuiz ?? [], '#6366f1')
      ) : (!currentTopic?.postEvaluationQuiz || currentTopic.postEvaluationQuiz.length === 0) ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
          <ClipboardCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Section End Questions</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">Create questions to test if students have mastered the topic.</p>
          <button onClick={() => openModal('add-posteval-quiz')} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm">
            Create First Question
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {currentTopic.postEvaluationQuiz.map((quiz, index) => renderQuizCard(quiz, index, 'edit-posteval-quiz', 'posteval-quiz'))}
        </div>
      )}

      {/* Bulk import post-eval questions */}
      {!showAnalytics && (
        <LevelImportPanel
          target="questions"
          accent="indigo"
          contextLabel={`Section End Quiz — ${currentTopic?.title}`}
          onImport={handleImportPostEvalQuestions}
        />
      )}
    </div>
    );
  };

  const renderSubtopics = () => (
    <div className="flex flex-col md:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[600px]">
      {/* Left Sidebar: Sub-topics List */}
      <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-4 border-r border-slate-200 pr-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-extrabold text-slate-900">{currentTopic?.title}</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* Topic Level Items */}
          <div className="space-y-2">
            <div 
              onClick={() => { setSelection(prev => ({ ...prev, subtopicId: 'prerequisites' })); setActiveTab('video' as any); }}
              className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                selection.subtopicId === 'prerequisites' ? 'border-purple-600 bg-purple-50 text-purple-900' : 'border-transparent hover:bg-slate-50 hover:border-slate-200 text-slate-700'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${selection.subtopicId === 'prerequisites' ? 'bg-purple-200 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                <Network className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm">Prerequisites</span>
            </div>
            
            <div 
              onClick={() => { setSelection(prev => ({ ...prev, subtopicId: 'preevaluation' })); setActiveTab('video' as any); }}
              className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                selection.subtopicId === 'preevaluation' ? 'border-orange-600 bg-orange-50 text-orange-900' : 'border-transparent hover:bg-slate-50 hover:border-slate-200 text-slate-700'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${selection.subtopicId === 'preevaluation' ? 'bg-orange-200 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                <ClipboardCheck className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm">Pre-evaluation Quiz</span>
            </div>

            <div 
              onClick={() => { setSelection(prev => ({ ...prev, subtopicId: 'postevaluation' })); setActiveTab('video' as any); }}
              className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                selection.subtopicId === 'postevaluation' ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-transparent hover:bg-slate-50 hover:border-slate-200 text-slate-700'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${selection.subtopicId === 'postevaluation' ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                <ClipboardCheck className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm">Section End Quiz</span>
            </div>

            <div 
              onClick={() => { setSelection(prev => ({ ...prev, subtopicId: 'finaltest' })); setActiveTab('video' as any); }}
              className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                selection.subtopicId === 'finaltest' ? 'border-amber-600 bg-amber-50 text-amber-900' : 'border-transparent hover:bg-slate-50 hover:border-slate-200 text-slate-700'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${selection.subtopicId === 'finaltest' ? 'bg-amber-200 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                <Trophy className="w-4 h-4" />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <span className="font-bold text-sm">Final Topic Test</span>
                {(currentTopic?.finalTestQuiz?.length ?? 0) > 0 && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">{currentTopic!.finalTestQuiz!.length}Q</span>
                )}
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-200 w-full"></div>

          {/* Sub-topics List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Sub-topics</h3>
            {currentTopic?.subTopics.map((sub, index) => (
              <div 
                key={sub.id} 
                onClick={() => { setSelection(prev => ({ ...prev, subtopicId: sub.id })); setActiveTab('video'); }}
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all group relative ${
                  selection.subtopicId === sub.id 
                    ? 'border-blue-600 bg-blue-50' 
                    : 'border-transparent hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                      selection.subtopicId === sub.id ? 'bg-blue-200 text-blue-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {currentTopic.sequence}.{index + 1}
                    </span>
                    <h3 className={`font-bold text-sm ${selection.subtopicId === sub.id ? 'text-blue-900' : 'text-slate-700'}`}>
                      {sub.title}
                    </h3>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); openModal('edit-subtopic', sub); }} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded"><Edit2 className="w-3 h-3" /></button>
                    <button onClick={(e) => { e.stopPropagation(); openModal('delete-confirm', { itemType: 'subtopic', id: sub.id, name: sub.title }); }} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>
            ))}
            {currentTopic?.subTopics.length === 0 && (
              <div className="py-8 text-center text-slate-500 text-sm">
                No sub-topics yet.
              </div>
            )}
            <button onClick={() => openModal('add-subtopic')} className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 mt-auto">
              <Plus className="w-4 h-4" /> Add Sub-topic
            </button>
            {/* Bulk import subtopics */}
            <LevelImportPanel
              target="subtopics"
              accent="blue"
              contextLabel={currentTopic?.title}
              onImport={handleImportSubtopics}
            />
          </div>
        </div>
      </div>

      {/* Right Content Area: Sub-topic Management */}
      <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col">
        {selection.subtopicId === 'prerequisites' ? (
          renderPrerequisites()
        ) : selection.subtopicId === 'preevaluation' ? (
          renderPreEvaluation()
        ) : selection.subtopicId === 'postevaluation' ? (
          renderPostEvaluation()
        ) : selection.subtopicId === 'finaltest' ? (
          renderFinalTest()
        ) : currentSubtopic ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-extrabold text-slate-900">{currentSubtopic.title}</h2>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200">
              <button 
                onClick={() => setActiveTab('video')}
                className={`px-4 py-2 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'video' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              >
                <PlayCircle className="w-4 h-4" /> Video Content
              </button>
              <button 
                onClick={() => setActiveTab('quiz')}
                className={`px-4 py-2 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'quiz' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              >
                <HelpCircle className="w-4 h-4" /> Quiz Management
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs ml-1">{currentSubtopic.quizzes?.length || 0}</span>
              </button>
              {(currentSubtopic.quizzes?.length ?? 0) > 0 && (
                <button 
                  onClick={() => setActiveTab('quiz-analytics')}
                  className={`px-4 py-2 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'quiz-analytics' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                  <BarChart2 className="w-4 h-4" /> Quiz Analytics
                </button>
              )}
            </div>

            {/* Tab Content: Video */}
            {activeTab === 'video' && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-900">YouTube Video Lesson</h3>
                  <button onClick={() => openModal('edit-video')} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors flex items-center gap-2">
                    <Edit2 className="w-4 h-4" /> {currentSubtopic.videoUrl ? 'Change Video URL' : 'Add Video URL'}
                  </button>
                </div>
                
                {getYoutubeEmbedUrl(currentSubtopic.videoUrl || '') ? (
                  <div className="relative w-full max-w-[1600px] mx-auto rounded-2xl overflow-hidden bg-slate-900 shadow-lg" style={{ paddingTop: '56.25%' }}>
                    <iframe
                      src={getYoutubeEmbedUrl(currentSubtopic.videoUrl || '')!}
                      title="YouTube video player"
                      className="absolute top-0 left-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                    <Video className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No Video Added</h3>
                    <p className="text-slate-500 mb-6 max-w-md mx-auto">Enhance this sub-topic by adding a YouTube video lesson for students to watch.</p>
                    <button onClick={() => openModal('edit-video')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm">
                      Add YouTube URL
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab Content: Quiz */}
            {activeTab === 'quiz' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Assessment Questions</h3>
                    <p className="text-sm text-slate-500">Create quizzes to test student understanding.</p>
                  </div>
                  <button onClick={() => openModal('add-quiz')} className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Question
                  </button>
                </div>

                {(!currentSubtopic.quizzes || currentSubtopic.quizzes.length === 0) ? (
                  <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                    <HelpCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No Questions Yet</h3>
                    <p className="text-slate-500 mb-6 max-w-md mx-auto">Create multiple choice, true/false, or text-based questions to assess learning.</p>
                    <button onClick={() => openModal('add-quiz')} className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-sm">
                      Create First Question
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentSubtopic.quizzes.map((quiz, index) => renderQuizCard(quiz, index, 'edit-quiz', 'quiz'))}
                  </div>
                )}

                {/* Bulk import quiz questions */}
                <LevelImportPanel
                  target="questions"
                  accent="emerald"
                  contextLabel={currentSubtopic.title}
                  onImport={handleImportSubtopicQuestions}
                />
              </div>
            )}

            {/* Tab Content: Quiz Analytics */}
            {activeTab === 'quiz-analytics' && (
              <div>
                <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="p-2.5 bg-blue-50 rounded-xl">
                    <BarChart2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{currentSubtopic.title} — Quiz Analytics</h3>
                    <p className="text-sm text-slate-500">Student performance across all {currentSubtopic.quizzes?.length ?? 0} questions</p>
                  </div>
                </div>
                {renderAnalyticsPanel(currentSubtopic.quizzes ?? [], '#3b82f6')}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
            <FileText className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Select a Sub-topic</h3>
            <p className="text-slate-500 max-w-md">Choose a sub-topic from the sidebar to manage its video content and quizzes.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        {renderBreadcrumbs()}

        <div className="min-h-[500px]">
          {view === 'standards' && renderStandards()}
          {view === 'classes' && renderClasses()}
          {view === 'topics' && renderTopics()}
          {view === 'subtopics' && renderSubtopics()}
        </div>
      </div>

      {/* --- Modals --- */}
      
      {/* Delete Confirmation Modal */}
      <Modal isOpen={modal.isOpen && modal.type === 'delete-confirm'} onClose={closeModal} title="Confirm Deletion">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-bold text-slate-900 mb-2">Delete {modal.payload?.name}?</h4>
          <p className="text-slate-500 font-medium mb-6">This action cannot be undone and will remove all nested content.</p>
          <div className="flex gap-3">
            <button onClick={closeModal} className="flex-1 py-3 px-4 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
            <button onClick={handleDelete} className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-sm">Delete</button>
          </div>
        </div>
      </Modal>

      {/* Generic Form Modal */}
      <Modal 
        isOpen={modal.isOpen && modal.type !== 'delete-confirm' && modal.type !== 'edit-video' && modal.type !== 'add-quiz' && modal.type !== 'edit-quiz' && modal.type !== 'quiz-analytics' && modal.type !== 'add-preeval-quiz' && modal.type !== 'edit-preeval-quiz' && modal.type !== 'add-posteval-quiz' && modal.type !== 'edit-posteval-quiz' && modal.type !== 'add-prerequisite' && modal.type !== 'edit-prerequisite'} 
        onClose={closeModal} 
        title={modal.type.includes('add') ? `Add ${modal.type.split('-')[1]}` : `Edit ${modal.type.split('-')[1]}`}
      >
        <form onSubmit={handleSave} className="space-y-5 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 block">Name / Title</label>
            <input 
              type="text" required
              value={formData.name || formData.title || ''}
              onChange={(e) => setFormData({ ...formData, [modal.type.includes('standard') || modal.type.includes('class') ? 'name' : 'title']: e.target.value })}
              className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-all outline-none font-medium text-slate-900" 
            />
          </div>
          {modal.type.includes('topic') && !modal.type.includes('subtopic') && (
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 block">Sequence Order</label>
              <input 
                type="number" required min="1"
                value={formData.sequence || ''}
                onChange={(e) => setFormData({ ...formData, sequence: e.target.value })}
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-all outline-none font-medium text-slate-900" 
              />
            </div>
          )}
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={closeModal} className="flex-1 py-3 px-4 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm">Save</button>
          </div>
        </form>
      </Modal>

      {/* Video Modal */}
      <Modal isOpen={modal.isOpen && modal.type === 'edit-video'} onClose={closeModal} title="Update Video URL">
        <form onSubmit={handleSave} className="space-y-5 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 block">YouTube URL</label>
            <input 
              type="url" 
              value={formData.videoUrl || ''}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-all outline-none font-medium text-slate-900" 
              placeholder="https://youtube.com/watch?v=..."
            />
            <p className="text-xs text-slate-500 font-medium">Leave blank to remove the video.</p>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={closeModal} className="flex-1 py-3 px-4 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm">Save Video</button>
          </div>
        </form>
      </Modal>

      {/* Prerequisite Modal */}
      <Modal isOpen={modal.isOpen && (modal.type === 'add-prerequisite' || modal.type === 'edit-prerequisite')} onClose={closeModal} title={modal.type === 'add-prerequisite' ? "Add Prerequisite" : "Edit Prerequisite"}>
        <form onSubmit={handleSave} className="space-y-5 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 block">Prerequisite Topic</label>
            <input 
              type="text" required
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-all outline-none font-medium text-slate-900" 
              placeholder="e.g., Basic Addition"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 block">Category</label>
            <select 
              value={formData.category || 'Minor'}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-all outline-none font-medium text-slate-900"
            >
              <option value="Major">Major (Critical for understanding)</option>
              <option value="Intermediate">Intermediate (Highly recommended)</option>
              <option value="Minor">Minor (Helpful background)</option>
            </select>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={closeModal} className="flex-1 py-3 px-4 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-3 px-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-sm">Save</button>
          </div>
        </form>
      </Modal>

      {/* Quiz Modal */}
      <Modal size="5xl" isOpen={modal.isOpen && (modal.type === 'add-quiz' || modal.type === 'edit-quiz' || modal.type === 'add-preeval-quiz' || modal.type === 'edit-preeval-quiz' || modal.type === 'add-posteval-quiz' || modal.type === 'edit-posteval-quiz')} onClose={closeModal} title={modal.type.includes('add') ? "Add Question" : "Edit Question"}>
        <form onSubmit={handleSave} className="space-y-6 py-4 max-h-[85vh] overflow-y-auto px-4">
          <div className="space-y-2">
            <label className="text-sm font-extrabold text-slate-800 block">Question Text</label>
            <textarea 
              required value={formData.text || ''}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base transition-all outline-none font-medium text-slate-900 min-h-[100px] resize-y" 
              placeholder="Enter your question here..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-extrabold text-slate-800 block">Question Type</label>
              <select 
                value={formData.type || 'mcq'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base transition-all outline-none font-medium text-slate-900"
              >
                <option value="mcq">Multiple Choice</option>
                <option value="boolean">True / False</option>
                <option value="text">Short Answer</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-extrabold text-slate-800 block">Difficulty</label>
              <select 
                value={formData.difficulty || 'Medium'}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base transition-all outline-none font-medium text-slate-900"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {formData.type === 'mcq' && (
            <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-extrabold text-slate-800 block">Options</label>
                <button 
                  type="button" 
                  onClick={() => setFormData({ ...formData, optionsArray: [...(formData.optionsArray || []), ''] })}
                  className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Option
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(formData.optionsArray || ['', '', '', '']).map((opt: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0 shadow-sm">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <input 
                      type="text" required
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...(formData.optionsArray || ['', '', '', ''])];
                        newOpts[idx] = e.target.value;
                        setFormData({ ...formData, optionsArray: newOpts });
                      }}
                      className="block w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all outline-none font-medium text-slate-900 shadow-sm" 
                      placeholder={`Option ${idx + 1}`}
                    />
                    {(formData.optionsArray || []).length > 2 && (
                      <button 
                        type="button"
                        onClick={() => {
                          const newOpts = [...(formData.optionsArray || [])];
                          newOpts.splice(idx, 1);
                          setFormData({ ...formData, optionsArray: newOpts });
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-extrabold text-slate-800 block">Correct Answer</label>
            {formData.type === 'boolean' ? (
               <select 
                 required value={formData.correctAnswer || 'True'}
                 onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                 className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base transition-all outline-none font-medium text-slate-900"
               >
                 <option value="True">True</option>
                 <option value="False">False</option>
               </select>
            ) : formData.type === 'mcq' ? (
               <select 
                 required value={formData.correctAnswer || ''}
                 onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                 className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base transition-all outline-none font-medium text-slate-900"
               >
                 <option value="" disabled>Select the correct option</option>
                 {(formData.optionsArray || []).filter((o: string) => o.trim() !== '').map((opt: string, idx: number) => (
                   <option key={idx} value={opt}>{String.fromCharCode(65 + idx)}: {opt}</option>
                 ))}
               </select>
            ) : (
              <input 
                type="text" required
                value={formData.correctAnswer || ''}
                onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base transition-all outline-none font-medium text-slate-900" 
                placeholder="Enter the correct answer text"
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-extrabold text-slate-800 block">Explanation (Optional)</label>
            <textarea 
              value={formData.explanation || ''}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base transition-all outline-none font-medium text-slate-900 min-h-[80px] resize-y" 
              placeholder="Explain why this answer is correct to help students learn..."
            />
          </div>

          <div className="pt-6 flex gap-4 sticky bottom-0 bg-white pb-2 border-t border-slate-100 mt-6">
            <button type="button" onClick={closeModal} className="flex-1 py-3.5 px-4 border-2 border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all">Cancel</button>
            <button type="submit" className="flex-1 py-3.5 px-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">Save Question</button>
          </div>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      <CurriculumImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        existingData={data}
        onImport={(merged) => {
          setData(merged);
          setShowImport(false);
        }}
      />

    </AdminLayout>
  );
}
