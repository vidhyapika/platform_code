import { 
  Calculator, Microscope, BookOpen, CheckCircle2, Download, 
  MessageSquare, GraduationCap, BrainCircuit, Library, Users,
  Video, PenTool, Globe, Zap, Target, Star, Crown, Award, MapPin
} from 'lucide-react';
import { 
  Course, DashboardCourse, Assignment, DashboardAssignment, 
  ScheduleEvent, DashboardSchedule, Activity, QuickLink, Badge,
  StudentCurriculumProgress
} from '../types';

export const MOCK_STUDENT_CURRICULUM: StudentCurriculumProgress = {
  standard: 'Grade 9',
  className: 'Section A',
  overallProgress: 45,
  completedTopics: 2,
  totalTopics: 5,
  topics: [
    {
      id: 'top-1',
      title: 'Algebraic Expressions',
      status: 'completed',
      progress: 100,
      subtopicsCompleted: 4,
      totalSubtopics: 4,
      prerequisiteScores: [
        { id: 'pre-1', title: 'Basic Arithmetic Operations', score: 10, total: 10, date: '2023-09-01' },
        { id: 'pre-2', title: 'Understanding Variables', score: 8, total: 10, date: '2023-09-02' }
      ],
      preEvaluationScore: { score: 15, total: 20, date: '2023-09-03' },
      sectionEndScore: { score: 45, total: 50, date: '2023-09-15' },
      subTopics: [
        {
          id: 'sub-1',
          title: 'Introduction to Polynomials',
          status: 'completed',
          videoUrl: 'https://www.youtube.com/embed/NybHckSEQBI',
          videoWatched: true,
          quizzes: [
            {
              id: 'q-1',
              text: 'What is the degree of the polynomial 3x^2 + 2x - 5?',
              type: 'mcq',
              options: ['1', '2', '3', '0'],
              correctAnswer: '2',
              explanation: 'The degree of a polynomial is the highest power of the variable in the expression. Here, the highest power of x is 2.',
              difficulty: 'Medium'
            }
          ],
          quizScore: { 
            score: 1, 
            total: 1, 
            date: '2023-09-05',
            pastAnswers: { 'q-1': '2' }
          }
        }
      ]
    },
    {
      id: 'top-2',
      title: 'Linear Equations',
      status: 'completed',
      progress: 100,
      subtopicsCompleted: 3,
      totalSubtopics: 3,
      prerequisiteScores: [
        { id: 'pre-3', title: 'Algebraic Expressions Basics', score: 9, total: 10, date: '2023-09-16' }
      ],
      preEvaluationScore: { score: 18, total: 20, date: '2023-09-17' },
      sectionEndScore: { score: 48, total: 50, date: '2023-09-30' },
      subTopics: []
    },
    {
      id: 'top-3',
      title: 'Geometry Foundations',
      status: 'in-progress',
      progress: 60,
      subtopicsCompleted: 3,
      totalSubtopics: 5,
      prerequisiteScores: [
        { id: 'pre-4', title: 'Basic Shapes', score: 10, total: 10, date: '2023-10-01' },
        { id: 'pre-5', title: 'Angles and Lines', score: 7, total: 10, date: '2023-10-02' }
      ],
      preEvaluationScore: { 
        score: 14, 
        total: 20, 
        date: '2023-10-03',
        pastAnswers: { 'pq-1': '180' }
      },
      preEvaluationQuiz: [
        {
          id: 'pq-1',
          text: 'How many degrees are in a triangle?',
          type: 'mcq',
          options: ['90', '180', '360', '270'],
          correctAnswer: '180',
          explanation: 'The sum of interior angles in any triangle is always 180 degrees.',
          difficulty: 'Easy'
        }
      ],
      subTopics: [
        {
          id: 'sub-3-1',
          title: 'Types of Triangles',
          status: 'completed',
          videoUrl: 'https://www.youtube.com/embed/mLeNaZcy-hE',
          videoWatched: true,
          quizzes: [
            {
              id: 'q-3-1',
              text: 'Which triangle has all sides equal?',
              type: 'mcq',
              options: ['Isosceles', 'Scalene', 'Equilateral', 'Right'],
              correctAnswer: 'Equilateral',
              explanation: 'An equilateral triangle has all three sides of equal length.',
              difficulty: 'Easy'
            }
          ],
          quizScore: { 
            score: 1, 
            total: 1, 
            date: '2023-10-05',
            pastAnswers: { 'q-3-1': 'Equilateral' }
          }
        },
        {
          id: 'sub-3-2',
          title: 'Pythagorean Theorem',
          status: 'in-progress',
          videoUrl: 'https://www.youtube.com/embed/AA621UofTUA',
          videoWatched: false,
          quizzes: [
            {
              id: 'q-3-2',
              text: 'In a right triangle, if a=3 and b=4, what is c?',
              type: 'mcq',
              options: ['5', '6', '7', '25'],
              correctAnswer: '5',
              explanation: 'a^2 + b^2 = c^2. 3^2 + 4^2 = 9 + 16 = 25. sqrt(25) = 5.',
              difficulty: 'Medium'
            }
          ]
        },
        {
          id: 'sub-3-3',
          title: 'Area and Perimeter',
          status: 'not-started',
          videoUrl: 'https://www.youtube.com/embed/xCdxURXMdFY',
          quizzes: []
        }
      ]
    },
    {
      id: 'top-4',
      title: 'Trigonometry Basics',
      status: 'not-started',
      progress: 0,
      subtopicsCompleted: 0,
      totalSubtopics: 4,
      prerequisiteScores: [],
      subTopics: []
    },
    {
      id: 'top-5',
      title: 'Statistics and Probability',
      status: 'not-started',
      progress: 0,
      subtopicsCompleted: 0,
      totalSubtopics: 3,
      prerequisiteScores: [],
      subTopics: []
    }
  ]
};

export const MOCK_COURSES: Course[] = [
  { id: 1, title: 'Advanced Mathematics', instructor: 'Dr. Sarah Jenkins', progress: 75, totalLessons: 24, completedLessons: 18, icon: Calculator, color: 'text-[#0084B4]', bgColor: 'bg-[#E1F0F5]', image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=400' },
  { id: 2, title: 'Biology: Cell Structure', instructor: 'Prof. Michael Chen', progress: 40, totalLessons: 15, completedLessons: 6, icon: Microscope, color: 'text-[#7CB342]', bgColor: 'bg-[#EAF5E1]', image: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&q=80&w=400' },
  { id: 3, title: 'World History', instructor: 'Mrs. Emily Davis', progress: 15, totalLessons: 30, completedLessons: 4, icon: Globe, color: 'text-[#8B5CF6]', bgColor: 'bg-[#F3E8FF]', image: 'https://images.unsplash.com/photo-1447069387366-2a3470621122?auto=format&fit=crop&q=80&w=400' },
  { id: 4, title: 'English Literature', instructor: 'Mr. Robert Wilson', progress: 90, totalLessons: 20, completedLessons: 18, icon: BookOpen, color: 'text-[#F59E0B]', bgColor: 'bg-[#FEF3C7]', image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=400' }
];

export const MOCK_DASHBOARD_COURSES: DashboardCourse[] = [
  { id: 1, subject: 'Mathematics', unit: 'Unit 4: Algebra I', progress: 72, completed: 12, total: 18, icon: Calculator, color: 'text-[#0084B4]', bgColor: 'bg-[#E1F0F5]' },
  { id: 2, subject: 'Science', unit: 'Unit 2: Cell Biology', progress: 90, completed: 18, total: 20, icon: Microscope, color: 'text-[#7CB342]', bgColor: 'bg-[#EAF5E1]' },
  { id: 3, subject: 'English', unit: 'Poetry & Prose', progress: 45, completed: 9, total: 20, icon: BookOpen, color: 'text-[#8B5CF6]', bgColor: 'bg-[#F3E8FF]' },
];

export const MOCK_ASSIGNMENTS: Assignment[] = [
  { id: 1, title: 'Cell Biology Lab Report', subject: 'Science', dueDate: 'Today, 11:59 PM', status: 'urgent', progress: 60 },
  { id: 2, title: 'Algebra Practice Set 4', subject: 'Mathematics', dueDate: 'Tomorrow, 5:00 PM', status: 'pending', progress: 0 },
  { id: 3, title: 'World War II Essay', subject: 'History', dueDate: 'Friday, 11:59 PM', status: 'pending', progress: 25 },
  { id: 4, title: 'Poetry Analysis', subject: 'English', dueDate: 'Completed', status: 'completed', progress: 100, score: '95/100' }
];

export const MOCK_DASHBOARD_ASSIGNMENTS: DashboardAssignment[] = [
  { id: 1, title: 'Lab Report: Plant Cells', subject: 'Science - Unit 2', due: 'Due Today, 5:00 PM', isUrgent: true },
  { id: 2, title: 'Linear Equations Workbook', subject: 'Mathematics - Unit 4', due: 'Due Tomorrow', isUrgent: false },
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
