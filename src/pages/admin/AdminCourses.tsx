import React from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { motion } from 'motion/react';
import { Plus, Search, Filter, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { MOCK_COURSES } from '../../data/mockData';

export function AdminCourses() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <AdminLayout>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full max-w-[1600px] mx-auto space-y-6"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Manage Courses</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Add, edit, or remove courses from the platform.</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add New Course
            </button>
          </div>
        </div>

        <motion.div variants={itemVariants} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
            <div className="relative w-full sm:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm outline-none font-medium text-slate-700 placeholder:text-slate-400"
                placeholder="Search courses..."
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors bg-white">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-xs uppercase tracking-wider text-slate-500 font-bold border-b border-slate-100">
                  <th className="p-4 pl-6">Course Name</th>
                  <th className="p-4">Instructor</th>
                  <th className="p-4">Lessons</th>
                  <th className="p-4">Enrolled</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium text-slate-700 divide-y divide-slate-100">
                {MOCK_COURSES.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${course.bgColor} ${course.color}`}>
                          <course.icon className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-slate-900">{course.title}</span>
                      </div>
                    </td>
                    <td className="p-4">{course.instructor}</td>
                    <td className="p-4">{course.totalLessons}</td>
                    <td className="p-4">1,240</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
                        Published
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm font-medium text-slate-500 bg-slate-50/50">
            <span>Showing 1 to {MOCK_COURSES.length} of {MOCK_COURSES.length} results</span>
            <div className="flex gap-1">
              <button className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50" disabled>Prev</button>
              <button className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50" disabled>Next</button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AdminLayout>
  );
}
