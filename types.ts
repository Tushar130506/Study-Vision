export interface MCQ {
  question: string;
  options: string[];
  correctOptionIndex: number;
  rationale: string;
}

export interface Flashcard {
  term: string;
  definition: string;
}

export interface PracticeQuestion {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  question: string;
  modelAnswer: string;
}

export interface FillInTheBlank {
  sentence: string;
  answer: string;
}

export interface TrueFalse {
  statement: string;
  isTrue: boolean;
  rationale: string;
}

export interface StudyTask {
  timeEstimate: string;
  description: string;
}

export interface StudyDay {
  day: number;
  tasks: StudyTask[];
}

export interface StudyGuide {
  summary: string;
  mcqs: MCQ[];
  flashcards: Flashcard[];
  practiceQuestions: PracticeQuestion[];
  fillInTheBlanks: FillInTheBlank[];
  trueFalseQuestions: TrueFalse[];
  studyPlan: StudyDay[];
}

export interface Session {
  id: string;
  title: string;
  createdAt: number;
  data: StudyGuide;
}

export interface FileData {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}