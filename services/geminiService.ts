import { GoogleGenAI, Type, Schema } from "@google/genai";
import { StudyGuide } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const studyGuideSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A bulleted summary of the material, max 150 words.",
    },
    mcqs: {
      type: Type.ARRAY,
      description: "8 Multiple Choice Questions.",
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Exactly 4 options.",
          },
          correctOptionIndex: {
            type: Type.INTEGER,
            description: "Index of the correct option (0-3).",
          },
          rationale: {
            type: Type.STRING,
            description: "1-2 lines explaining why the answer is correct.",
          },
        },
        required: ["question", "options", "correctOptionIndex", "rationale"],
      },
    },
    flashcards: {
      type: Type.ARRAY,
      description: "10 Flashcards.",
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING },
          definition: { type: Type.STRING },
        },
        required: ["term", "definition"],
      },
    },
    practiceQuestions: {
      type: Type.ARRAY,
      description: "6 Practice Questions (2 Easy, 2 Medium, 2 Hard).",
      items: {
        type: Type.OBJECT,
        properties: {
          difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
          question: { type: Type.STRING },
          modelAnswer: { type: Type.STRING, description: "Succinct model answer." },
        },
        required: ["difficulty", "question", "modelAnswer"],
      },
    },
    fillInTheBlanks: {
      type: Type.ARRAY,
      description: "5 Fill-in-the-blank questions.",
      items: {
        type: Type.OBJECT,
        properties: {
          sentence: { type: Type.STRING, description: "Sentence with a blank indicated by '______'." },
          answer: { type: Type.STRING, description: "The correct word or phrase to fill the blank." },
        },
        required: ["sentence", "answer"],
      },
    },
    trueFalseQuestions: {
      type: Type.ARRAY,
      description: "5 True/False questions.",
      items: {
        type: Type.OBJECT,
        properties: {
          statement: { type: Type.STRING },
          isTrue: { type: Type.BOOLEAN },
          rationale: { type: Type.STRING, description: "Succinct rationale for why it is true or false." },
        },
        required: ["statement", "isTrue", "rationale"],
      },
    },
    studyPlan: {
      type: Type.ARRAY,
      description: "Mini Study Plan for next 3 days.",
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.INTEGER },
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                timeEstimate: { type: Type.STRING, description: "e.g., '30 mins'" },
                description: { type: Type.STRING },
              },
              required: ["timeEstimate", "description"],
            },
          },
        },
        required: ["day", "tasks"],
      },
    },
  },
  required: ["summary", "mcqs", "flashcards", "practiceQuestions", "fillInTheBlanks", "trueFalseQuestions", "studyPlan"],
};

export async function generateStudyGuide(
  files: { base64: string; mimeType: string }[],
  additionalContext: string
): Promise<StudyGuide> {
  const model = "gemini-2.5-flash"; // Supports multimodal + JSON

  const promptText = `
    You are Study Vision, an education assistant.
    Task: Analyze the provided notes (image/PDF).
    Context/Priorities provided by user: "${additionalContext}"
    
    Constraints:
    - Respect user focus/syllabus if provided.
    - If handwriting is unclear, make reasonable assumptions based on context.
    - Avoid hallucinations; quote or paraphrase only from provided material.
    - For equations/definitions, keep LaTeX-friendly formatting where relevant.
    
    Required Output Components:
    1. Bullet Summary (max 150 words).
    2. 8 MCQs (4 options, rationale).
    3. 10 Flashcards.
    4. 6 Practice Questions (2 Easy, 2 Med, 2 Hard).
    5. 5 Fill-in-the-blank questions.
    6. 5 True/False questions.
    7. 3-Day Study Plan with Spaced Repetition:
       - Day 1: Focus on new material.
       - Day 2: Review Day 1 material + new material/deeper dive.
       - Day 3: Review Day 1 & 2 material + final synthesis/practice.
       - Provide specific time estimates for each block.
    
    Generate the response strictly according to the JSON schema provided.
  `;

  try {
    const parts = [
      ...files.map(file => ({
        inlineData: {
          mimeType: file.mimeType,
          data: file.base64,
        },
      })),
      { text: promptText },
    ];

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: parts,
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: studyGuideSchema,
        systemInstruction: "You are a world-class educational content generator designed to help students learn efficiently.",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text from Gemini.");
    }

    const data = JSON.parse(text) as StudyGuide;
    return data;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export async function* sendChatMessageStream(
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  context: string
) {
    const systemInstruction = `You are "Buddy", a friendly and helpful AI study companion.
    
    PRIORITY CONTEXT (User's Uploaded Material):
    ${context ? context : "No specific notes uploaded yet. Use general knowledge."}
    
    INSTRUCTIONS:
    1. PRIORITIZE the provided CONTEXT. If the user asks a question covered by the notes, answer based on the notes.
    2. If the answer is not in the context, use your general global knowledge, but acknowledge that it's outside the provided notes if relevant.
    3. Be encouraging, concise, and educational.
    4. Use Markdown for formatting (bold, italics, lists).
    `;

    const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
            systemInstruction
        },
        history: history
    });

    const result = await chat.sendMessageStream({
        message: newMessage
    });

    for await (const chunk of result) {
        if (chunk.text) {
            yield chunk.text;
        }
    }
}