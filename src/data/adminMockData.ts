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
  aiSessionCount?: number;
  learningStatus?: 'on-track' | 'struggling' | 'completed';
  topicsCompleted?: number;
  totalTopics?: number;
}

export interface Question {
  id: string;
  text: string;
  type: 'text' | 'mcq' | 'boolean' | 'true_false' | 'image_upload';
  imageUrl?: string;
  options?: string[];
  correctAnswer?: string;
  alternativeAnswers?: string[];
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface Prerequisite {
  id: string;
  title: string;
  description?: string;
  category: 'Major' | 'Intermediate' | 'Minor';
  questions?: Question[];
  passingThreshold?: number; // 0-100 percentage required to pass
  maxAIAttempts?: number;
}

export interface SubTopic {
  id: string;
  title: string;
  videoUrl?: string;
  quizzes?: Question[];
  sequenceOrder?: number;
  order?: number;
  passingThreshold?: number;
}

export interface Topic {
  id: string;
  title: string;
  sequence: number;
  sequenceOrder?: number;
  description?: string;
  finalTestThreshold?: number;
  subTopics: SubTopic[];
  prerequisites?: Prerequisite[];
  preEvaluationQuiz?: Question[];
  postEvaluationQuiz?: Question[];
  finalTestQuiz?: Question[];
}

export interface CurriculumClass {
  id: string;
  name: string;
  passingThreshold?: number;
  curriculum: Topic[];
}

export interface Standard {
  id: string;
  name: string;
  description?: string;
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
    aiSessionCount: 1,
    learningStatus: 'on-track',
    topicsCompleted: 1,
    totalTopics: 2,
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
    aiSessionCount: 4,
    learningStatus: 'struggling',
    topicsCompleted: 0,
    totalTopics: 2,
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
    aiSessionCount: 2,
    learningStatus: 'on-track',
    topicsCompleted: 1,
    totalTopics: 2,
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
    aiSessionCount: 0,
    learningStatus: 'on-track',
    topicsCompleted: 1,
    totalTopics: 2,
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
    aiSessionCount: 5,
    learningStatus: 'struggling',
    topicsCompleted: 0,
    totalTopics: 2,
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
    aiSessionCount: 3,
    learningStatus: 'on-track',
    topicsCompleted: 1,
    totalTopics: 2,
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
    aiSessionCount: 2,
    learningStatus: 'completed',
    topicsCompleted: 2,
    totalTopics: 2,
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
    aiSessionCount: 1,
    learningStatus: 'on-track',
    topicsCompleted: 1,
    totalTopics: 2,
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
    aiSessionCount: 6,
    learningStatus: 'struggling',
    topicsCompleted: 0,
    totalTopics: 2,
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
    aiSessionCount: 0,
    learningStatus: 'on-track',
    topicsCompleted: 1,
    totalTopics: 2,
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
                passingThreshold: 70,
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
                passingThreshold: 60,
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
            finalTestQuiz: [
              {
                id: 'final-1-q1',
                text: 'Which of the following is a polynomial expression?',
                type: 'mcq',
                options: ['3x² + 2x - 1', '√x + 3', '1/x + 2', 'x^(-2) + 5'],
                correctAnswer: '3x² + 2x - 1',
                explanation: 'Polynomials have non-negative integer exponents. √x has exponent 1/2 and 1/x has exponent -1.',
                difficulty: 'Medium',
              },
              {
                id: 'final-1-q2',
                text: 'Simplify: (2x + 3)(x - 1)',
                type: 'mcq',
                options: ['2x² + x - 3', '2x² - x + 3', '2x² + 5x - 3', '2x² - x - 3'],
                correctAnswer: '2x² + x - 3',
                explanation: 'FOIL: 2x·x + 2x·(-1) + 3·x + 3·(-1) = 2x² - 2x + 3x - 3 = 2x² + x - 3.',
                difficulty: 'Medium',
              },
              {
                id: 'final-1-q3',
                text: 'What is the value of the expression 4a - 2b when a = 3 and b = 5?',
                type: 'mcq',
                options: ['2', '12', '22', '7'],
                correctAnswer: '2',
                explanation: '4(3) - 2(5) = 12 - 10 = 2.',
                difficulty: 'Easy',
              },
            ],
            subTopics: [
              {
                id: 'sub-1',
                title: 'Introduction to Polynomials',
                sequenceOrder: 1,
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
                passingThreshold: 70,
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
            finalTestQuiz: [
              {
                id: 'final-2-q1',
                text: 'Solve for x: 3(x + 2) = 21',
                type: 'mcq',
                options: ['x = 5', 'x = 7', 'x = 9', 'x = 4'],
                correctAnswer: 'x = 5',
                explanation: '3x + 6 = 21 → 3x = 15 → x = 5.',
                difficulty: 'Medium',
              },
              {
                id: 'final-2-q2',
                text: 'A number is multiplied by 4 and then 6 is added. The result is 34. What is the number?',
                type: 'mcq',
                options: ['5', '6', '7', '8'],
                correctAnswer: '7',
                explanation: '4x + 6 = 34 → 4x = 28 → x = 7.',
                difficulty: 'Medium',
              },
              {
                id: 'final-2-q3',
                text: 'Which equation has the solution x = -2?',
                type: 'mcq',
                options: ['x + 5 = 3', '2x + 3 = 7', 'x - 4 = -2', '3x = 9'],
                correctAnswer: 'x + 5 = 3',
                explanation: 'x + 5 = 3 → x = -2. Check: -2 + 5 = 3 ✓',
                difficulty: 'Easy',
              },
            ],
            subTopics: [
              {
                id: 'sub-2',
                title: 'Solving One-Variable Equations',
                sequenceOrder: 1,
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
                sequenceOrder: 2,
                videoUrl: '',
                quizzes: [],
              },
            ],
          },
          // ── Topic 3 ───────────────────────────────────────────────────
          {
            id: 'top-3',
            title: 'Quadratic Equations',
            sequence: 3,
            prerequisites: [
              {
                id: 'pre-5',
                title: 'Linear Equations',
                description: 'Ability to solve one-variable linear equations and interpret solutions.',
                category: 'Major',
                passingThreshold: 70,
                questions: [
                  {
                    id: 'pre5-q1',
                    text: 'Solve: 4x + 8 = 24',
                    type: 'mcq',
                    options: ['2', '4', '6', '8'],
                    correctAnswer: '4',
                    explanation: '4x = 16, so x = 4.',
                    difficulty: 'Easy',
                  },
                  {
                    id: 'pre5-q2',
                    text: 'Which value satisfies 2x - 3 = 7?',
                    type: 'mcq',
                    options: ['2', '5', '6', '10'],
                    correctAnswer: '5',
                    explanation: '2x = 10, x = 5.',
                    difficulty: 'Easy',
                  },
                ],
              },
              {
                id: 'pre-6',
                title: 'Factoring Basics',
                description: 'Ability to factor simple expressions like common factors and differences of squares.',
                category: 'Intermediate',
                passingThreshold: 60,
                questions: [
                  {
                    id: 'pre6-q1',
                    text: 'Factor out the GCF: 6x² + 9x',
                    type: 'mcq',
                    options: ['3x(2x + 3)', '6x(x + 3)', '3(2x² + 3x)', 'x(6x + 9)'],
                    correctAnswer: '3x(2x + 3)',
                    explanation: 'GCF of 6x² and 9x is 3x. So 3x(2x + 3).',
                    difficulty: 'Medium',
                  },
                ],
              },
            ],
            preEvaluationQuiz: [
              {
                id: 'pq-3',
                text: 'What is a quadratic equation?',
                type: 'mcq',
                options: [
                  'An equation where the highest power of x is 2',
                  'An equation where the highest power of x is 1',
                  'An equation with two variables',
                  'An equation with fractions',
                ],
                correctAnswer: 'An equation where the highest power of x is 2',
                explanation: 'A quadratic equation has the form ax² + bx + c = 0, where the highest power of x is 2.',
                difficulty: 'Easy',
              },
            ],
            postEvaluationQuiz: [
              {
                id: 'postq-3',
                text: 'Using the quadratic formula, solve: x² - 5x + 6 = 0',
                type: 'mcq',
                options: ['x = 2 and x = 3', 'x = -2 and x = -3', 'x = 1 and x = 6', 'x = -1 and x = -6'],
                correctAnswer: 'x = 2 and x = 3',
                explanation: 'Discriminant = 25 - 24 = 1. x = (5 ± 1)/2, giving x = 3 and x = 2.',
                difficulty: 'Medium',
              },
            ],
            finalTestQuiz: [
              {
                id: 'final-3-q1',
                text: 'What are the roots of x² - 4 = 0?',
                type: 'mcq',
                options: ['x = ±2', 'x = ±4', 'x = 2 only', 'x = -2 only'],
                correctAnswer: 'x = ±2',
                explanation: 'x² = 4, so x = ±2.',
                difficulty: 'Easy',
              },
              {
                id: 'final-3-q2',
                text: 'Solve by factoring: x² + 7x + 12 = 0',
                type: 'mcq',
                options: ['x = -3 and x = -4', 'x = 3 and x = 4', 'x = -3 and x = 4', 'x = 3 and x = -4'],
                correctAnswer: 'x = -3 and x = -4',
                explanation: '(x + 3)(x + 4) = 0, so x = -3 and x = -4.',
                difficulty: 'Medium',
              },
              {
                id: 'final-3-q3',
                text: 'How many real roots does x² + 1 = 0 have?',
                type: 'mcq',
                options: ['0', '1', '2', '3'],
                correctAnswer: '0',
                explanation: 'Discriminant = 0 - 4 = -4 < 0, so no real roots.',
                difficulty: 'Hard',
              },
            ],
            subTopics: [
              {
                id: 'sub-4',
                title: 'Understanding Quadratic Form',
                sequenceOrder: 1,
                videoUrl: 'https://www.youtube.com/watch?v=kj_gRMiagIw',
                quizzes: [
                  {
                    id: 'q-4',
                    text: 'Identify the coefficients a, b, c in: 2x² - 3x + 5 = 0',
                    type: 'mcq',
                    options: ['a=2, b=-3, c=5', 'a=2, b=3, c=-5', 'a=-2, b=3, c=5', 'a=2, b=3, c=5'],
                    correctAnswer: 'a=2, b=-3, c=5',
                    explanation: 'The standard form ax² + bx + c = 0 gives a=2, b=-3, c=5.',
                    difficulty: 'Easy',
                  },
                ],
              },
              {
                id: 'sub-5',
                title: 'Solving by Factoring',
                sequenceOrder: 2,
                videoUrl: 'https://www.youtube.com/watch?v=NybHckSEQBI',
                quizzes: [
                  {
                    id: 'q-5',
                    text: 'Solve by factoring: x² - 9x + 20 = 0',
                    type: 'mcq',
                    options: ['x = 4 and x = 5', 'x = -4 and x = -5', 'x = 4 and x = -5', 'x = -4 and x = 5'],
                    correctAnswer: 'x = 4 and x = 5',
                    explanation: '(x - 4)(x - 5) = 0, so x = 4 and x = 5.',
                    difficulty: 'Medium',
                  },
                ],
              },
            ],
          },
          // ── Topic 4 ───────────────────────────────────────────────────
          {
            id: 'top-4',
            title: 'Coordinate Geometry',
            sequence: 4,
            prerequisites: [],
            preEvaluationQuiz: [
              {
                id: 'pq-4',
                text: 'On a number line, which coordinate is largest?',
                type: 'mcq',
                options: ['-5', '0', '3', '-10'],
                correctAnswer: '3',
                explanation: '3 is the greatest value on a number line.',
                difficulty: 'Easy',
              },
            ],
            postEvaluationQuiz: [],
            finalTestQuiz: [
              {
                id: 'final-4-q1',
                text: 'What is the distance between points (1, 2) and (4, 6)?',
                type: 'mcq',
                options: ['4', '5', '6', '7'],
                correctAnswer: '5',
                explanation: '√((4-1)² + (6-2)²) = √(9 + 16) = √25 = 5.',
                difficulty: 'Medium',
              },
              {
                id: 'final-4-q2',
                text: 'Find the midpoint of the segment joining (2, 4) and (8, 10).',
                type: 'mcq',
                options: ['(5, 7)', '(6, 7)', '(4, 6)', '(3, 5)'],
                correctAnswer: '(5, 7)',
                explanation: 'Midpoint = ((2+8)/2, (4+10)/2) = (5, 7).',
                difficulty: 'Medium',
              },
              {
                id: 'final-4-q3',
                text: 'In which quadrant does the point (-3, 5) lie?',
                type: 'mcq',
                options: ['Quadrant I', 'Quadrant II', 'Quadrant III', 'Quadrant IV'],
                correctAnswer: 'Quadrant II',
                explanation: 'Negative x and positive y means Quadrant II.',
                difficulty: 'Easy',
              },
            ],
            subTopics: [
              {
                id: 'sub-6',
                title: 'The Cartesian Plane',
                sequenceOrder: 1,
                videoUrl: 'https://www.youtube.com/watch?v=OkFdDqW9xxM',
                quizzes: [
                  {
                    id: 'q-6',
                    text: 'What are the coordinates of the origin?',
                    type: 'mcq',
                    options: ['(1, 1)', '(0, 1)', '(0, 0)', '(1, 0)'],
                    correctAnswer: '(0, 0)',
                    explanation: 'The origin is the intersection of the x- and y-axes at (0, 0).',
                    difficulty: 'Easy',
                  },
                ],
              },
              {
                id: 'sub-7',
                title: 'Distance & Midpoint Formulas',
                sequenceOrder: 2,
                videoUrl: 'https://www.youtube.com/watch?v=PsHOiQff0RQ',
                quizzes: [
                  {
                    id: 'q-7',
                    text: 'What is the distance from (0, 0) to (3, 4)?',
                    type: 'mcq',
                    options: ['5', '7', '6', '4'],
                    correctAnswer: '5',
                    explanation: '√(3² + 4²) = √(9 + 16) = √25 = 5.',
                    difficulty: 'Easy',
                  },
                ],
              },
            ],
          },
          // ── Topic 5 ───────────────────────────────────────────────────
          {
            id: 'top-5',
            title: 'Statistics & Data Analysis',
            sequence: 5,
            prerequisites: [
              {
                id: 'pre-7',
                title: 'Basic Arithmetic',
                description: 'Comfort with addition, subtraction, division and working with sets of numbers.',
                category: 'Minor',
                passingThreshold: 50,
                questions: [
                  {
                    id: 'pre7-q1',
                    text: 'What is the sum of 12 + 15 + 18 + 21?',
                    type: 'mcq',
                    options: ['56', '66', '60', '72'],
                    correctAnswer: '66',
                    explanation: '12 + 15 = 27, 27 + 18 = 45, 45 + 21 = 66.',
                    difficulty: 'Easy',
                  },
                ],
              },
            ],
            preEvaluationQuiz: [],
            postEvaluationQuiz: [
              {
                id: 'postq-5',
                text: 'In the dataset {4, 6, 6, 7, 9}, what is the mode?',
                type: 'mcq',
                options: ['4', '6', '7', '9'],
                correctAnswer: '6',
                explanation: '6 appears twice — more than any other value — so it is the mode.',
                difficulty: 'Easy',
              },
            ],
            finalTestQuiz: [],
            subTopics: [
              {
                id: 'sub-8',
                title: 'Mean, Median and Mode',
                sequenceOrder: 1,
                videoUrl: 'https://www.youtube.com/watch?v=zOYVZtTIjBA',
                quizzes: [
                  {
                    id: 'q-8',
                    text: 'Find the mean of: 5, 8, 12, 15, 10',
                    type: 'mcq',
                    options: ['8', '10', '11', '12'],
                    correctAnswer: '10',
                    explanation: '(5 + 8 + 12 + 15 + 10) / 5 = 50 / 5 = 10.',
                    difficulty: 'Easy',
                  },
                  {
                    id: 'q-9',
                    text: 'Which value is the median of: 3, 7, 1, 9, 5?',
                    type: 'mcq',
                    options: ['3', '5', '7', '9'],
                    correctAnswer: '5',
                    explanation: 'Sort: 1, 3, 5, 7, 9. The middle value (3rd of 5) is 5.',
                    difficulty: 'Easy',
                  },
                ],
              },
              {
                id: 'sub-9',
                title: 'Reading Charts & Graphs',
                sequenceOrder: 2,
                videoUrl: 'https://www.youtube.com/watch?v=GjGNHMKgkZo',
                quizzes: [
                  {
                    id: 'q-10',
                    text: 'A bar chart shows scores of 70, 85, 90, 60. What is the range?',
                    type: 'mcq',
                    options: ['20', '25', '30', '35'],
                    correctAnswer: '30',
                    explanation: 'Range = max - min = 90 - 60 = 30.',
                    difficulty: 'Easy',
                  },
                ],
              },
            ],
          },
          // ── Topic 6 ───────────────────────────────────────────────────
          {
            id: 'top-6',
            title: 'Geometry & Measurement',
            sequence: 6,
            prerequisites: [],
            preEvaluationQuiz: [],
            postEvaluationQuiz: [],
            finalTestQuiz: [
              {
                id: 'final-6-q1',
                text: 'What is the area of a rectangle with length 8 cm and width 5 cm?',
                type: 'mcq',
                options: ['26 cm²', '40 cm²', '13 cm²', '45 cm²'],
                correctAnswer: '40 cm²',
                explanation: 'Area = length × width = 8 × 5 = 40 cm².',
                difficulty: 'Easy',
              },
              {
                id: 'final-6-q2',
                text: 'What is the volume of a cube with side 4 cm?',
                type: 'mcq',
                options: ['16 cm³', '24 cm³', '48 cm³', '64 cm³'],
                correctAnswer: '64 cm³',
                explanation: 'Volume = side³ = 4³ = 64 cm³.',
                difficulty: 'Easy',
              },
              {
                id: 'final-6-q3',
                text: 'A circle has radius 7 cm. What is its area? (Use π ≈ 22/7)',
                type: 'mcq',
                options: ['44 cm²', '154 cm²', '22 cm²', '49 cm²'],
                correctAnswer: '154 cm²',
                explanation: 'Area = πr² = (22/7) × 7² = (22/7) × 49 = 154 cm².',
                difficulty: 'Medium',
              },
            ],
            subTopics: [
              {
                id: 'sub-10',
                title: 'Area & Perimeter',
                sequenceOrder: 1,
                videoUrl: 'https://www.youtube.com/watch?v=AAB0WhTKNHU',
                quizzes: [
                  {
                    id: 'q-11',
                    text: 'A square has a side of 6 cm. What is its perimeter?',
                    type: 'mcq',
                    options: ['12 cm', '18 cm', '24 cm', '36 cm'],
                    correctAnswer: '24 cm',
                    explanation: 'Perimeter of a square = 4 × side = 4 × 6 = 24 cm.',
                    difficulty: 'Easy',
                  },
                ],
              },
              {
                id: 'sub-11',
                title: 'Surface Area & Volume',
                sequenceOrder: 2,
                videoUrl: 'https://www.youtube.com/watch?v=MBUot4VbAcs',
                quizzes: [
                  {
                    id: 'q-12',
                    text: 'What is the surface area of a cube with side 3 cm?',
                    type: 'mcq',
                    options: ['27 cm²', '54 cm²', '36 cm²', '18 cm²'],
                    correctAnswer: '54 cm²',
                    explanation: 'Surface area = 6 × side² = 6 × 9 = 54 cm².',
                    difficulty: 'Medium',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];
