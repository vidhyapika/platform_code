import React, { useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Modal } from '../../components/ui/Modal';
import { Users, Plus, Edit2, Trash2, Search, Mail, Phone, User, AlertTriangle, Send, BookOpen, Brain, TrendingUp, X, ChevronRight, Sparkles, Trophy } from 'lucide-react';
import { Student, MOCK_STANDARDS, MOCK_CLASSES, INITIAL_STUDENTS } from '../../data/adminMockData';
import { motion, AnimatePresence } from 'motion/react';

export function AdminStudents() {
  const [selectedStandardId, setSelectedStandardId] = useState<string>('std-1');
  const [selectedClassId, setSelectedClassId] = useState<string>('cls-1');
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState<{ isOpen: boolean; type: string; payload: any }>({
    isOpen: false, type: '', payload: null
  });
  const [formData, setFormData] = useState<Partial<Student>>({});
  const [isNotifying, setIsNotifying] = useState(false);
  const [notificationResult, setNotificationResult] = useState<{success?: boolean, message?: string} | null>(null);
  const [journeyStudent, setJourneyStudent] = useState<Student | null>(null);

  const filteredStudents = students.filter(s => 
    s.standardId === selectedStandardId &&
    s.classId === selectedClassId &&
    (s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.parentName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleStandardChange = (stdId: string) => {
    setSelectedStandardId(stdId);
    const firstClass = MOCK_CLASSES.find(c => c.standardId === stdId);
    setSelectedClassId(firstClass ? firstClass.id : '');
  };

  const openModal = (type: string, payload: any = null) => {
    setModal({ isOpen: true, type, payload });
    if (type === 'edit') {
      setFormData({ ...payload });
    } else if (type === 'add') {
      setFormData({ standardId: selectedStandardId, classId: selectedClassId }); // Default to selected
    }
    setNotificationResult(null);
  };

  const closeModal = () => setModal({ isOpen: false, type: '', payload: null });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let newStudent: Student;
    if (modal.type === 'add') {
      newStudent = {
        id: Date.now().toString(),
        studentName: formData.studentName || '',
        studentEmail: formData.studentEmail || '',
        studentPhone: formData.studentPhone || '',
        parentName: formData.parentName || '',
        parentEmail: formData.parentEmail || '',
        parentPhone: formData.parentPhone || '',
        standardId: formData.standardId || 'std-1',
        classId: formData.classId || 'cls-1'
      };
      setStudents([...students, newStudent]);
    } else {
      newStudent = { ...formData } as Student;
      setStudents(students.map(s => s.id === newStudent.id ? newStudent : s));
    }

    // If adding, send notification
    if (modal.type === 'add') {
      setIsNotifying(true);
      try {
        const selectedClass = MOCK_CLASSES.find(c => c.id === newStudent.classId);
        const response = await fetch('/api/notify-student', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newStudent,
            className: selectedClass ? selectedClass.name : 'your new class'
          })
        });
        const result = await response.json();
        setNotificationResult({
          success: result.success,
          message: result.notifications ? result.notifications.join(', ') : 'Notification sent.'
        });
      } catch (error: any) {
        setNotificationResult({ success: false, message: error.message });
      } finally {
        setIsNotifying(false);
      }
    } else {
      closeModal();
    }
  };

  const handleDelete = () => {
    setStudents(students.filter(s => s.id !== modal.payload.id));
    closeModal();
  };

  return (
    <AdminLayout>
      <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 text-white rounded-xl shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Student Management</h1>
              <p className="text-slate-500 font-medium">Manage students, parents, and enrollments.</p>
            </div>
          </div>
          <button onClick={() => openModal('add')} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Student
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-shrink-0 w-full sm:w-auto flex gap-2">
              <select 
                value={selectedStandardId}
                onChange={(e) => handleStandardChange(e.target.value)}
                className="w-full sm:w-40 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              >
                {MOCK_STANDARDS.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <select 
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full sm:w-40 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              >
                {MOCK_CLASSES.filter(c => c.standardId === selectedStandardId).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search students or parents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                  <th className="p-4">Student Details</th>
                  <th className="p-4">Parent Details</th>
                  <th className="p-4">Enrollment</th>
                  <th className="p-4 text-center">Progress</th>
                  <th className="p-4 text-center">AI Sessions</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                          {student.studentName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{student.studentName}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {student.studentEmail}</span>
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {student.studentPhone}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-slate-700">{student.parentName}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {student.parentEmail}</span>
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {student.parentPhone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-bold w-fit">
                          {MOCK_STANDARDS.find(s => s.id === student.standardId)?.name || student.standardId}
                        </span>
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold w-fit">
                          {MOCK_CLASSES.find(c => c.id === student.classId)?.name || student.classId}
                        </span>
                      </div>
                    </td>
                    {/* Progress column */}
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="text-sm font-extrabold text-slate-900">
                          {student.topicsCompleted ?? 0}/{student.totalTopics ?? 0}
                        </div>
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${student.totalTopics ? Math.round(((student.topicsCompleted ?? 0) / student.totalTopics) * 100) : 0}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold">{student.totalTopics ? Math.round(((student.topicsCompleted ?? 0) / student.totalTopics) * 100) : 0}%</p>
                      </div>
                    </td>
                    {/* AI Sessions column */}
                    <td className="p-4 text-center">
                      {(student.aiSessionCount ?? 0) > 0 ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100">
                          <Brain className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="text-xs font-extrabold text-indigo-700">{student.aiSessionCount}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 font-bold">—</span>
                      )}
                    </td>
                    {/* Status column */}
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-extrabold ${
                        student.learningStatus === 'completed'  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        student.learningStatus === 'struggling' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {student.learningStatus === 'completed'  ? <Trophy className="w-3 h-3" /> :
                         student.learningStatus === 'struggling' ? <AlertTriangle className="w-3 h-3" /> :
                         <TrendingUp className="w-3 h-3" />}
                        {student.learningStatus === 'completed' ? 'Completed' :
                         student.learningStatus === 'struggling' ? 'Struggling' : 'On Track'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setJourneyStudent(student)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View Journey">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button onClick={() => openModal('edit', student)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => openModal('delete', student)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <h3 className="text-lg font-bold text-slate-900 mb-1">No Students Found</h3>
                      <p className="text-slate-500">Try adjusting your search or add a new student.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Student Journey Slide-Over */}
      <AnimatePresence>
        {journeyStudent && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-40" onClick={() => setJourneyStudent(null)} />
            <motion.div
              initial={{ x: 560 }} animate={{ x: 0 }} exit={{ x: 560 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              className="fixed right-0 top-0 bottom-0 w-[560px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-purple-700">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white font-extrabold text-lg">
                    {journeyStudent.studentName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="font-extrabold text-white text-lg">{journeyStudent.studentName}</h2>
                    <p className="text-white/70 text-xs">{MOCK_CLASSES.find(c => c.id === journeyStudent.classId)?.name} · {MOCK_STANDARDS.find(s => s.id === journeyStudent.standardId)?.name}</p>
                  </div>
                </div>
                <button onClick={() => setJourneyStudent(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stats strip */}
              <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50">
                {[
                  { label: 'Topics Done', value: `${journeyStudent.topicsCompleted ?? 0}/${journeyStudent.totalTopics ?? 0}`, color: 'text-blue-600' },
                  { label: 'AI Sessions', value: journeyStudent.aiSessionCount ?? 0, color: 'text-indigo-600' },
                  { label: 'Status', value: journeyStudent.learningStatus === 'completed' ? '✓ Done' : journeyStudent.learningStatus === 'struggling' ? '⚠ Help' : '→ Track', color: journeyStudent.learningStatus === 'completed' ? 'text-emerald-600' : journeyStudent.learningStatus === 'struggling' ? 'text-amber-600' : 'text-blue-600' },
                ].map((s, i) => (
                  <div key={i} className="p-4 text-center">
                    <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Overall progress bar */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-extrabold text-blue-900">Overall Progress</p>
                    <p className="text-sm font-extrabold text-blue-700">{journeyStudent.totalTopics ? Math.round(((journeyStudent.topicsCompleted ?? 0) / journeyStudent.totalTopics) * 100) : 0}%</p>
                  </div>
                  <div className="h-3 bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${journeyStudent.totalTopics ? Math.round(((journeyStudent.topicsCompleted ?? 0) / journeyStudent.totalTopics) * 100) : 0}%` }} />
                  </div>
                </div>

                {/* AI Usage */}
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-700 flex items-center gap-2"><Brain className="w-4 h-4 text-indigo-600" /> AI Assistance History</h3>
                  {(journeyStudent.aiSessionCount ?? 0) > 0 ? (
                    <div className="space-y-2">
                      {Array.from({ length: journeyStudent.aiSessionCount ?? 0 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                          <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-indigo-900">AI Session #{i + 1}</p>
                            <p className="text-[10px] text-indigo-500">{i % 2 === 0 ? 'Prerequisite support' : 'Subtopic review'} · Topic {Math.min(i + 1, journeyStudent.totalTopics ?? 1)}</p>
                          </div>
                          <span className="text-[9px] font-extrabold text-indigo-400 uppercase">Completed</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                      No AI sessions yet — student is progressing independently
                    </div>
                  )}
                </div>

                {/* Contact info */}
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-700">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1">Student</p>
                      <p className="text-sm font-bold text-slate-900">{journeyStudent.studentName}</p>
                      <p className="text-xs text-slate-500">{journeyStudent.studentEmail}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1">Parent</p>
                      <p className="text-sm font-bold text-slate-900">{journeyStudent.parentName}</p>
                      <p className="text-xs text-slate-500">{journeyStudent.parentEmail}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <Modal isOpen={modal.isOpen && modal.type === 'delete'} onClose={closeModal} title="Confirm Deletion">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-bold text-slate-900 mb-2">Delete {modal.payload?.studentName}?</h4>
          <p className="text-slate-500 font-medium mb-6">This will remove the student and parent records. This action cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={closeModal} className="flex-1 py-3 px-4 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
            <button onClick={handleDelete} className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-sm">Delete</button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal isOpen={modal.isOpen && (modal.type === 'add' || modal.type === 'edit')} onClose={closeModal} title={modal.type === 'add' ? 'Add New Student' : 'Edit Student'} size="2xl">
        {notificationResult ? (
          <div className="py-8 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${notificationResult.success ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
              <Send className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Student Saved</h3>
            <p className="text-slate-500 mb-6">{notificationResult.message}</p>
            <button onClick={closeModal} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Enrollment Section */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
              <h4 className="text-xs font-extrabold text-emerald-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 rounded-lg"><BookOpen className="w-3.5 h-3.5 text-emerald-600" /></div>
                Enrollment Details
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block uppercase tracking-wide">Standard</label>
                  <select
                    required
                    value={formData.standardId || ''}
                    onChange={e => {
                      const newStdId = e.target.value;
                      const firstClass = MOCK_CLASSES.find(c => c.standardId === newStdId);
                      setFormData({ ...formData, standardId: newStdId, classId: firstClass ? firstClass.id : '' });
                    }}
                    className="block w-full px-4 py-2.5 bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all outline-none font-semibold text-slate-900"
                  >
                    <option value="" disabled>Select Standard</option>
                    {MOCK_STANDARDS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block uppercase tracking-wide">Section</label>
                  <select
                    required
                    value={formData.classId || ''}
                    onChange={e => setFormData({ ...formData, classId: e.target.value })}
                    className="block w-full px-4 py-2.5 bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-all outline-none font-semibold text-slate-900"
                  >
                    <option value="" disabled>Select Section</option>
                    {MOCK_CLASSES.filter(c => c.standardId === formData.standardId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Student + Parent side by side */}
            <div className="grid grid-cols-2 gap-4">
              {/* Student Section */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-3">
                <h4 className="text-xs font-extrabold text-blue-700 uppercase tracking-widest flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg"><User className="w-3.5 h-3.5 text-blue-600" /></div>
                  Student Details
                </h4>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block uppercase tracking-wide">Full Name</label>
                  <input type="text" required placeholder="e.g. Sarah Connor" value={formData.studentName || ''} onChange={e => setFormData({ ...formData, studentName: e.target.value })} className="block w-full px-3 py-2.5 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block uppercase tracking-wide">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input type="email" required placeholder="student@example.com" value={formData.studentEmail || ''} onChange={e => setFormData({ ...formData, studentEmail: e.target.value })} className="block w-full pl-9 pr-3 py-2.5 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block uppercase tracking-wide">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input type="tel" required placeholder="+1 234 567 8900" value={formData.studentPhone || ''} onChange={e => setFormData({ ...formData, studentPhone: e.target.value })} className="block w-full pl-9 pr-3 py-2.5 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Parent Section */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">
                <h4 className="text-xs font-extrabold text-indigo-700 uppercase tracking-widest flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 rounded-lg"><Users className="w-3.5 h-3.5 text-indigo-600" /></div>
                  Parent / Guardian
                </h4>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block uppercase tracking-wide">Full Name</label>
                  <input type="text" required placeholder="e.g. John Connor" value={formData.parentName || ''} onChange={e => setFormData({ ...formData, parentName: e.target.value })} className="block w-full px-3 py-2.5 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block uppercase tracking-wide">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input type="email" required placeholder="parent@example.com" value={formData.parentEmail || ''} onChange={e => setFormData({ ...formData, parentEmail: e.target.value })} className="block w-full pl-9 pr-3 py-2.5 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block uppercase tracking-wide">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input type="tel" required placeholder="+1 234 567 8900" value={formData.parentPhone || ''} onChange={e => setFormData({ ...formData, parentPhone: e.target.value })} className="block w-full pl-9 pr-3 py-2.5 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <button type="button" onClick={closeModal} disabled={isNotifying} className="flex-1 py-2.5 px-4 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 text-sm">
                Cancel
              </button>
              <button type="submit" disabled={isNotifying} className="flex-[2] py-2.5 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm flex justify-center items-center gap-2 disabled:opacity-60 text-sm">
                {isNotifying ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending Notifications...</>
                ) : (
                  <><Send className="w-4 h-4" /> Save & Notify</>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </AdminLayout>
  );
}
