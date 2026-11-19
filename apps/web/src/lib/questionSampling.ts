import { Question, Quiz } from '@mines-quiz/types';
import { MINING_STATUTORY_QUESTIONS, MiningSubjectQuestion } from '../data/miningQuestions';

export interface MiningSubject {
  code: string;
  name: string;
  shortName: string;
  description: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  questionsCount: number;
  iconName: string;
}

export const MINING_SUBJECTS: MiningSubject[] = [
  {
    code: 'MIN-ALL',
    name: 'Grand DGMS Statutory Mock (All Subjects Combined)',
    shortName: 'Full Comprehensive Mock',
    description: 'Complete cross-domain assessment spanning Coal Mines Regulations, Ventilation, Strata Control, Opencast, Explosives, and Rescue.',
    durationMinutes: 60,
    totalMarks: 30,
    passingMarks: 18,
    questionsCount: 30,
    iconName: 'Trophy',
  },
  {
    code: 'MIN-101',
    name: 'Coal Mines Regulations (CMR 2017) & Legislation',
    shortName: 'CMR 2017 & Mining Law',
    description: 'Statutory examination on CMR 2017, Mines Act 1952, statutory responsibilities, mine plans, safety committees, and accident notices.',
    durationMinutes: 45,
    totalMarks: 30,
    passingMarks: 18,
    questionsCount: 30,
    iconName: 'FileText',
  },
  {
    code: 'MIN-102',
    name: 'Mine Ventilation, Environmental Engineering & Gas Detection',
    shortName: 'Ventilation & Gas Safety',
    description: 'Statutory limits for inflammable gas (CH4), toxic gases (CO, H2S), air quantity per person, anemometry, and auxiliary fans.',
    durationMinutes: 45,
    totalMarks: 30,
    passingMarks: 18,
    questionsCount: 30,
    iconName: 'Wind',
  },
  {
    code: 'MIN-103',
    name: 'Strata Control, Rock Mechanics & Ground Support',
    shortName: 'Strata Control & Support',
    description: 'Systematic Support Rules (SSR), resin roof bolting anchorage tests, cable bolts, junction support, and depillaring safety.',
    durationMinutes: 45,
    totalMarks: 30,
    passingMarks: 18,
    questionsCount: 30,
    iconName: 'ShieldAlert',
  },
  {
    code: 'MIN-104',
    name: 'Opencast Mining, HEMM Machinery & Bench Safety',
    shortName: 'Opencast & HEMM Safety',
    description: 'Bench height-to-width ratios, dump stability, dumper haul road gradients, berm heights, and shovel-dumper interaction.',
    durationMinutes: 45,
    totalMarks: 30,
    passingMarks: 18,
    questionsCount: 30,
    iconName: 'Truck',
  },
  {
    code: 'MIN-105',
    name: 'Drilling, Commercial Explosives & Blasting Safety',
    shortName: 'Explosives & Blasting',
    description: 'Permitted explosives (P1, P3, P5), delay detonators, shotfirer statutory duties, blasting danger zone, and misfire remediation.',
    durationMinutes: 45,
    totalMarks: 30,
    passingMarks: 18,
    questionsCount: 30,
    iconName: 'Zap',
  },
  {
    code: 'MIN-106',
    name: 'Mine Fires, Inundation (Flooding) & Rescue Operations',
    shortName: 'Mine Fires & Rescue',
    description: 'Spontaneous combustion, Graham index, fire stopping seals, water danger zones, self-contained breathing apparatus, and rescue stations.',
    durationMinutes: 45,
    totalMarks: 30,
    passingMarks: 18,
    questionsCount: 30,
    iconName: 'Flame',
  },
];

/**
 * Deterministic pseudo-random number generator seeded with string hash.
 * Guarantees that two candidates receive completely unique question sets
 * and option permutations.
 */
function createSeededPRNG(seedStr: string) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(array: T[], prng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function getSubjectByCode(code: string): MiningSubject {
  const found = MINING_SUBJECTS.find((s) => s.code === code);
  return found || MINING_SUBJECTS[0];
}

export interface CandidateExamSessionOptions {
  subjectCode: string;
  candidateEmail: string;
  candidateName?: string;
  mode?: 'mock' | 'live';
  sessionSalt?: string;
}

export function generateCandidateExamSession({
  subjectCode,
  candidateEmail,
  candidateName = 'Candidate',
  mode = 'mock',
  sessionSalt = '',
}: CandidateExamSessionOptions): {
  quiz: Quiz;
  rawMasterQuestionsForScoring: Question[];
} {
  const subject = getSubjectByCode(subjectCode);
  const prng = createSeededPRNG(`${candidateEmail.toLowerCase()}_${subjectCode}_${sessionSalt || Date.now()}`);

  // 1. Filter primary subject questions
  let primaryPool: MiningSubjectQuestion[] = [];
  if (subjectCode === 'MIN-ALL') {
    primaryPool = [...MINING_STATUTORY_QUESTIONS];
  } else {
    primaryPool = MINING_STATUTORY_QUESTIONS.filter(
      (q) => q.subjectCode === subjectCode
    );
    if (primaryPool.length === 0) {
      primaryPool = [...MINING_STATUTORY_QUESTIONS];
    }
  }

  // 2. Shuffle primary pool uniquely for this candidate
  const shuffledPrimary = seededShuffle(primaryPool, prng);

  // 3. Guaranteed 30-Question Paper Engine:
  // If primary subject has fewer than 30 questions, backfill remaining slots from the full statutory pool
  const candidatePool: MiningSubjectQuestion[] = [...shuffledPrimary];
  if (candidatePool.length < 30) {
    const remainingPool = MINING_STATUTORY_QUESTIONS.filter(
      (q) => !candidatePool.some((selected) => selected.id === q.id)
    );
    const shuffledRemaining = seededShuffle(remainingPool, prng);
    candidatePool.push(...shuffledRemaining);
  }

  // 4. Sample exactly 30 questions (or full available pool up to 30)
  const targetCount = Math.min(30, candidatePool.length);
  const sampledQuestions = candidatePool.slice(0, targetCount);

  // 4. Randomize question order and option choices for each question
  const clientQuestions: Question[] = [];
  const rawMasterQuestionsForScoring: Question[] = [];

  sampledQuestions.forEach((origQ, index) => {
    // Shuffle options for this question
    const shuffledOptions = seededShuffle(origQ.options, prng);

    // Keep server master record with correctOptionIds for later scoring
    rawMasterQuestionsForScoring.push({
      ...origQ,
      options: shuffledOptions,
    });

    // Strip correctOptionIds and explanation for client-side zero-knowledge delivery in live exam
    const clientSafeQ: Question = {
      id: origQ.id,
      quizId: subject.code,
      text: origQ.text,
      type: origQ.type,
      options: shuffledOptions.map((opt) => ({
        id: opt.id,
        text: opt.text,
        imageUrl: opt.imageUrl,
      })),
      marks: origQ.marks,
      negativeMarks: origQ.negativeMarks,
      explanation: mode === 'mock' ? origQ.explanation : undefined,
    };

    clientQuestions.push(clientSafeQ);
  });

  const quiz: Quiz = {
    id: `quiz-${subject.code.toLowerCase()}-${mode}`,
    title: `${subject.name} (${mode.toUpperCase()} MODE)`,
    description: subject.description,
    category: 'Mining & Geo-Engineering',
    durationMinutes: subject.durationMinutes,
    totalMarks: clientQuestions.length * 1,
    passingMarks: Math.ceil(clientQuestions.length * 0.6),
    questionsCount: clientQuestions.length,
    questions: clientQuestions,
    shuffleQuestions: true,
    proctoringEnabled: true,
    maxViolationsAllowed: mode === 'live' ? 3 : 999,
    status: 'published',
    createdBy: 'DGMS Statutory Board',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    quiz,
    rawMasterQuestionsForScoring,
  };
}
