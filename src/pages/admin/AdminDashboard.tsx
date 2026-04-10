import React from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { motion } from 'motion/react';
import { Users, BookOpen, TrendingUp, Activity, MoreVertical } from 'lucide-react';

export function AdminDashboard() {
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

  const stats = [
    { title: 'Total Students', value: '2,845', change: '+12.5%', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { title: 'Active Courses', value: '48', change: '+4', icon: BookOpen, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { title: 'Avg. Engagement', value: '86%', change: '+2.1%', icon: Activity, color: 'text-green-600', bgColor: 'bg-green-100' },
    { title: 'Platform Revenue', value: '$12,450', change: '+8.4%', icon: TrendingUp, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  ];

  const recentStudents = [
    { id: 1, name: 'Arjun Sharma', grade: 'Grade 9', joinDate: 'Today, 10:23 AM', status: 'Active' },
    { id: 2, name: 'Priya Patel', grade: 'Grade 8', joinDate: 'Today, 09:15 AM', status: 'Active' },
    { id: 3, name: 'Rahul Kumar', grade: 'Grade 10', joinDate: 'Yesterday', status: 'Pending' },
    { id: 4, name: 'Sneha Gupta', grade: 'Grade 7', joinDate: 'Yesterday', status: 'Active' },
  ];

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
            <h1 className="text-2xl font-extrabold text-slate-900">Platform Overview</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Monitor platform metrics and recent activity.</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
              Export Report
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div key={index} variants={itemVariants} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                  {stat.change}
                </span>
              </div>
              <h3 className="text-slate-500 font-bold text-sm mb-1">{stat.title}</h3>
              <p className="text-3xl font-extrabold text-slate-900">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Signups */}
          <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Recent Student Signups</h2>
              <button className="text-sm font-bold text-blue-600 hover:text-blue-700">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-xs uppercase tracking-wider text-slate-500 font-bold border-b border-slate-100">
                    <th className="p-4 pl-6">Student Name</th>
                    <th className="p-4">Grade</th>
                    <th className="p-4">Join Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium text-slate-700 divide-y divide-slate-100">
                  {recentStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6 font-bold text-slate-900">{student.name}</td>
                      <td className="p-4">{student.grade}</td>
                      <td className="p-4 text-slate-500">{student.joinDate}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          student.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-colors text-left group">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Add New Course</h4>
                  <p className="text-xs text-slate-500 font-medium">Create a new curriculum</p>
                </div>
              </button>
              
              <button className="w-full flex items-center gap-3 p-4 rounded-2xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50 transition-colors text-left group">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Invite Students</h4>
                  <p className="text-xs text-slate-500 font-medium">Send bulk invitations</p>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AdminLayout>
  );
}
