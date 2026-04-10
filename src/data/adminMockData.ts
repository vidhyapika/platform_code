// ─── Shared Admin Types ───────────────────────────────────────────────────────

export interface Student {
  id: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  standardId: string;
  classId: string;
  joinedAt?: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'text' | 'mcq' | 'boolean';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface Prerequisite {
  id: string;
  title: string;
  description?: string;
  category: 'Major' | 'Intermediate' | 'Minor';
  questions?: Question[];
}

export interface SubTopic {
  id: string;
  title: string;
  videoUrl?: string;
  quizzes?: Question[];
}

export interface Topic {
  id: string;
  title: string;
  sequence: number;
  subTopics: SubTopic[];
  prerequisites?: Prerequisite[];
  preEvaluationQuiz?: Question[];
  postEvaluationQuiz?: Question[];
}

export interface CurriculumClass {
  id: string;
  name: string;
  curriculum: Topic[];
}

export interface Standard {
  id: string;
  name: string;
  classes: CurriculumClass[];
}

// ─── Standards & Sections ────────────────────────────────────────────────────

export const MOCK_STANDARDS = [
  { id: 'std-1', name: 'Grade 9' },
  { id: 'std-2', name: 'Grade 10' },
];

export const MOCK_CLASSES = [
  { id: 'cls-1', standardId: 'std-1', name: 'Section A' },
  { id: 'cls-2', standardId: 'std-1', name: 'Section B' },
  { id: 'cls-3', standardId: 'std-2', name: 'Section A' },
];

// ─── Students ────────────────────────────────────────────────────────────────

export const INITIAL_STUDENTS: Student[] = [
  {
    id: '1',
    studentName: 'Alice Johnson',
    studentEmail: 'alice@example.com',
    studentPhone: '+1234567890',
    parentName: 'Bob Johnson',
    parentEmail: 'bob@example.com',
    parentPhone: '+1987654321',
    standardId: 'std-1',
    classId: 'cls-1',
    joinedAt: '2026-03-10',
  },
  {
    id: '2',
    studentName: 'Ravi Shankar',
    studentEmail: 'ravi@example.com',
    studentPhone: '+1234500001',
    parentName: 'Suresh Shankar',
    parentEmail: 'suresh@example.com',
    parentPhone: '+1987600001',
    standardId: 'std-1',
    classId: 'cls-1',
    joinedAt: '2026-03-12',
  },
  {
    id: '3',
    studentName: 'Meena Patel',
    studentEmail: 'meena@example.com',
    studentPhone: '+1234500002',
    parentName: 'Jignesh Patel',
    parentEmail: 'jignesh@example.com',
    parentPhone: '+1987600002',
    standardId: 'std-1',
    classId: 'cls-1',
    joinedAt: '2026-03-15',
  },
  {
    id: '4',
    studentName: 'Arjun Sharma',
    studentEmail: 'arjun@example.com',
    studentPhone: '+1234500003',
    parentName: 'Ramesh Sharma',
    parentEmail: 'ramesh@example.com',
    parentPhone: '+1987600003',
    standardId: 'std-1',
    classId: 'cls-1',
    joinedAt: '2026-03-18',
  },
  {
    id: '5',
    studentName: 'Priya Nair',
    studentEmail: 'priya@example.com',
    studentPhone: '+1234500004',
    parentName: 'Mohan Nair',
    parentEmail: 'mohan@example.com',
    parentPhone: '+1987600004',
    standardId: 'std-1',
    classId: 'cls-2',
    joinedAt: '2026-03-20',
  },
  {
    id: '6',
    studentName: 'Rohit Verma',
    studentEmail: 'rohit@example.com',
    studentPhone: '+1234500005',
    parentName: 'Ajay Verma',
    parentEmail: 'ajay@example.com',
    parentPhone: '+1987600005',
    standardId: 'std-1',
    classId: 'cls-2',
    joinedAt: '2026-03-22',
  },
  {
    id: '7',
    studentName: 'Sana Khan',
    studentEmail: 'sana@example.com',
    studentPhone: '+1234500006',
    parentName: 'Iqbal Khan',
    parentEmail: 'iqbal@example.com',
    parentPhone: '+1987600006',
    standardId: 'std-1',
    classId: 'cls-2',
    joinedAt: '2026-03-25',
  },
  {
    id: '8',
    studentName: 'Karan Singh',
    studentEmail: 'karan@example.com',
    studentPhone: '+1234500007',
    parentName: 'Harpal Singh',
    parentEmail: 'harpal@example.com',
    parentPhone: '+1987600007',
    standardId: 'std-2',
    classId: 'cls-3',
    joinedAt: '2026-03-28',
  },
  {
    id: '9',
    studentName: 'Deepa Reddy',
    studentEmail: 'deepa@example.com',
    studentPhone: '+1234500008',
    parentName: 'Venkat Reddy',
    parentEmail: 'venkat@example.com',
    parentPhone: '+1987600008',
    standardId: 'std-2',
    classId: 'cls-3',
    joinedAt: '2026-04-01',
  },
  {
    id: '10',
    studentName: 'Amir Hussain',
    studentEmail: 'amir@example.com',
    studentPhone: '+1234500009',
    parentName: 'Salim Hussain',
    parentEmail: 'salim@example.com',
    parentPhone: '+1987600009',
    standardId: 'std-2',
    classId: 'cls-3',
    joinedAt: '2026-04-05',
  },
];

// ─── Curriculum ───────────────────────────────────────────────────────────────

export const INITIAL_CURRICULUM_DATA: Standard[] = [
  {
    id: 'std-1',
    name: 'Grade 9',
    classes: [
      {
        id: 'cls-1',
        name: 'Section A',
        curriculum: [
          {
            id: 'top-1',
            title: 'Algebraic Expressions',
            sequence: 1,
            prerequisites: [
              {
                id: 'pre-1',
                title: 'Basic Arithmetic Operations',
                description: 'Ability to add, subtract, multiply and divide whole numbers and fractions.',
                category: 'Major',
                questions: [
                  {
                    id: 'prereq-1-q1',
                    text: 'What is the result of 48 ÷ 6 + 3 × 2?',
                    type: 'mcq',
                    options: ['14', '18', '12', '16'],
                    correctAnswer: '14',
                    explanation: 'Division and multiplication first: 48÷6 = 8, 3×2 = 6. Then addition: 8+6 = 14.',
                    difficulty: 'Easy',
                  },
                  {
                    id: 'prereq-1-q2',
                    text: 'Which of the following fractions is equivalent to 3/4?',
                    type: 'mcq',
                    options: ['6/9', '9/12', '4/5', '2/3'],
                    correctAnswer: '9/12',
                    explanation: '3/4 = 9/12 (multiply numerator and denominator by 3).',
                    difficulty: 'Easy',
                  },
                  {
                    id: 'prereq-1-q3',
                    text: 'What is 15% of 200?',
                    type: 'mcq',
                    options: ['25', '30', '35', '40'],
                    correctAnswer: '30',
                    explanation: '15% of 200 = 0.15 × 200 = 30.',
                    difficulty: 'Medium',
                  },
                ],
              },
              {
                id: 'pre-2',
                title: 'Understanding Variables',
                description: 'Familiarity with representing unknown quantities using letters in simple expressions.',
                category: 'Intermediate',
                questions: [
                  {
                    id: 'prereq-2-q1',
                    text: 'If x = 4, what is the value of 3x + 2?',
                    type: 'mcq',
                    options: ['10', '14', '12', '16'],
                    correctAnswer: '14',
                    explanation: '3(4) + 2 = 12 + 2 = 14.',
                    difficulty: 'Easy',
                  },
                  {
                    id: 'prereq-2-q2',
                    text: 'Which expression represents "5 more than twice a number n"?',
                    type: 'mcq',
                    options: ['5n + 2', '2n + 5', '2n - 5', '5 - 2n'],
                    correctAnswer: '2n + 5',
                    explanation: 'Twice a number n is 2n; 5 more than that is 2n + 5.',
                    difficulty: 'Easy',
                  },
                ],
              },
            ],
            preEvaluationQuiz: [
              {
                id: 'pq-1',
                text: 'What is 5 + 3 * 2?',
                type: 'mcq',
                options: ['16', '11', '10', '13'],
                correctAnswer: '11',
                explanation:
                  'According to order of operations (PEMDAS/BODMAS), multiplication is performed before addition. So, 3 * 2 = 6, and 5 + 6 = 11.',
                difficulty: 'Easy',
              },
            ],
            postEvaluationQuiz: [
              {
                id: 'postq-1',
                text: 'Factorize: x^2 - 5x + 6',
                type: 'mcq',
                options: ['(x-2)(x-3)', '(x+2)(x+3)', '(x-1)(x-6)', '(x+1)(x-6)'],
                correctAnswer: '(x-2)(x-3)',
                explanation: 'The numbers that multiply to 6 and add to -5 are -2 and -3.',
                difficulty: 'Medium',
              },
            ],
            subTopics: [
              {
                id: 'sub-1',
                title: 'Introduction to Polynomials',
                videoUrl: 'https://www.youtube.com/watch?v=NybHckSEQBI',
                quizzes: [
                  {
                    id: 'q-1',
                    text: 'What is the degree of the polynomial 3x^2 + 2x - 5?',
                    type: 'mcq',
                    options: ['1', '2', '3', '0'],
                    correctAnswer: '2',
                    explanation:
                      'The degree of a polynomial is the highest power of the variable. Here, the highest power of x is 2.',
                    difficulty: 'Medium',
                  },
                ],
              },
            ],
          },
          {
            id: 'top-2',
            title: 'Linear Equations',
            sequence: 2,
            prerequisites: [
              {
                id: 'pre-3',
                title: 'Algebraic Expressions',
                description: 'Understanding how to simplify and evaluate algebraic expressions with one variable.',
                category: 'Major',
                questions: [
                  {
                    id: 'prereq-3-q1',
                    text: 'Simplify: 3x + 2x - x',
                    type: 'mcq',
                    options: ['4x', '5x', '6x', '3x'],
                    correctAnswer: '4x',
                    explanation: '3x + 2x - x = (3+2-1)x = 4x.',
                    difficulty: 'Easy',
                  },
                  {
                    id: 'prereq-3-q2',
                    text: 'Expand: 2(x + 3)',
                    type: 'mcq',
                    options: ['2x + 3', '2x + 6', 'x + 6', '2x + 5'],
                    correctAnswer: '2x + 6',
                    explanation: 'Distribute 2: 2×x + 2×3 = 2x + 6.',
                    difficulty: 'Easy',
                  },
                  {
                    id: 'prereq-3-q3',
                    text: 'If a = 2 and b = 3, find the value of 2a² - b.',
                    type: 'mcq',
                    options: ['5', '7', '9', '11'],
                    correctAnswer: '5',
                    explanation: '2(2²) - 3 = 2(4) - 3 = 8 - 3 = 5.',
                    difficulty: 'Medium',
                  },
                ],
              },
            ],
            preEvaluationQuiz: [
              {
                id: 'pq-2',
                text: 'Solve for x: 2x + 4 = 10',
                type: 'mcq',
                options: ['2', '3', '5', '7'],
                correctAnswer: '3',
                explanation: 'Subtract 4 from both sides: 2x = 6, then divide by 2: x = 3.',
                difficulty: 'Easy',
              },
            ],
            postEvaluationQuiz: [
              {
                id: 'postq-2',
                text: 'Which of the following is a solution to 3x - 9 = 0?',
                type: 'mcq',
                options: ['x = 0', 'x = 3', 'x = -3', 'x = 9'],
                correctAnswer: 'x = 3',
                explanation: 'Divide both sides by 3: x = 3.',
                difficulty: 'Easy',
              },
            ],
            subTopics: [
              {
                id: 'sub-2',
                title: 'Solving One-Variable Equations',
                videoUrl: '',
                quizzes: [
                  {
                    id: 'q-2',
                    text: 'What is the value of x in 5x = 25?',
                    type: 'mcq',
                    options: ['3', '4', '5', '6'],
                    correctAnswer: '5',
                    explanation: 'Divide both sides by 5: x = 5.',
                    difficulty: 'Easy',
                  },
                ],
              },
              {
                id: 'sub-3',
                title: 'Word Problems with Linear Equations',
                videoUrl: '',
                quizzes: [],
              },
            ],
          },
        ],
      },
    ],
  },
];
