import React from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { motion } from 'motion/react';
import { User, Bell, Lock, Globe, Palette, HelpCircle } from 'lucide-react';

export function Settings() {
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

  const settingsSections = [
    { id: 'profile', icon: User, title: 'Profile Information', description: 'Update your personal details and avatar.' },
    { id: 'notifications', icon: Bell, title: 'Notifications', description: 'Manage email and push notifications.' },
    { id: 'security', icon: Lock, title: 'Security & Password', description: 'Update your password and secure your account.' },
    { id: 'appearance', icon: Palette, title: 'Appearance', description: 'Customize the look and feel of your dashboard.' },
    { id: 'language', icon: Globe, title: 'Language & Region', description: 'Set your preferred language and timezone.' },
    { id: 'help', icon: HelpCircle, title: 'Help & Support', description: 'Get help or contact support.' },
  ];

  return (
    <DashboardLayout>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full max-w-[1600px] mx-auto space-y-6"
      >
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900">Settings</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage your account preferences and settings.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar Navigation for Settings (Desktop) */}
          <motion.div variants={itemVariants} className="hidden md:block col-span-1 space-y-1">
            {settingsSections.map((section, index) => (
              <button 
                key={section.id}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                  index === 0 
                    ? 'bg-[#0084B4] text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <section.icon className={`w-5 h-5 ${index === 0 ? 'text-white' : 'text-slate-400'}`} />
                {section.title}
              </button>
            ))}
          </motion.div>

          {/* Main Settings Content Area */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Profile Information</h2>
              
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-8 border-b border-slate-100">
                <img 
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun" 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full border-4 border-slate-50 shadow-sm bg-slate-100"
                />
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button className="px-4 py-2 bg-[#0084B4] text-white rounded-xl text-sm font-bold hover:bg-[#006A91] transition-colors shadow-sm">
                    Change Avatar
                  </button>
                  <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm">
                    Remove
                  </button>
                </div>
              </div>

              <form className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">First Name</label>
                    <input type="text" defaultValue="Arjun" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0084B4]/20 focus:border-[#0084B4] outline-none transition-all font-medium text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Last Name</label>
                    <input type="text" defaultValue="Sharma" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0084B4]/20 focus:border-[#0084B4] outline-none transition-all font-medium text-slate-900" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address</label>
                  <input type="email" defaultValue="arjun.sharma@school.edu" disabled className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed" />
                  <p className="text-xs font-medium text-slate-500 mt-1.5">Contact your school administrator to change your email address.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Grade & Section</label>
                  <input type="text" defaultValue="Grade 9 - Section B" disabled className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed" />
                </div>

                <div className="pt-4 flex justify-end">
                  <button type="button" className="px-6 py-3 bg-[#0084B4] text-white rounded-xl text-sm font-bold hover:bg-[#006A91] transition-colors shadow-sm">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
