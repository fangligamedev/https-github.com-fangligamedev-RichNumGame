import { MistakeRecord, MathQuestion } from "../types";

// Zeabur AI Hub Configuration
const ZEABUR_AI_HUB_KEY = (import.meta as any).env?.VITE_ZEABUR_AI_HUB_KEY || "sk-4WKOo738u5xEMF8qv7ZX1Q";
const ZEABUR_AI_HUB_ENDPOINT = (import.meta as any).env?.VITE_ZEABUR_AI_HUB_ENDPOINT || "https://api.zeabur.com/ai/v1/chat/completions";
const SELECTED_MODEL = (import.meta as any).env?.VITE_SELECTED_MODEL || "gemini-3-flash-preview";

// Local RNG helper for fallback
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateAddQuestion = (): MathQuestion => {
  const a = randomInt(10, 500);
  const b = randomInt(10, 500);
  const ans = a + b;
  const context = [
    `你在超市买了${a}元的零食和${b}元的饮料，一共要付多少钱？`,
    `你的存钱罐里有${a}元，妈妈又奖励了你${b}元，现在一共有多少钱？`,
    `第一天走了${a}步，第二天走了${b}步，两天一共走了多少步？`
  ];
  return {
    question: context[randomInt(0, context.length - 1)],
    answer: ans,
    options: generateOptions(ans),
    type: 'ADD',
    difficulty: 1,
    explanation: `${a} 加上 ${b} 等于 ${ans}。`
  };
};

const generateSubQuestion = (): MathQuestion => {
  const a = randomInt(100, 900);
  const b = randomInt(10, a - 10);
  const ans = a - b;
  const context = [
    `你有${a}元，买玩具花掉了${b}元，还剩多少钱？`,
    `这本书一共有${a}页，你已经看了${b}页，还有多少页没看？`,
    `原价${a}元的衣服，现在优惠${b}元，现价是多少？`
  ];
  return {
    question: context[randomInt(0, context.length - 1)],
    answer: ans,
    options: generateOptions(ans),
    type: 'SUB',
    difficulty: 1,
    explanation: `${a} 减去 ${b} 等于 ${ans}。`
  };
};

const generateMulQuestion = (): MathQuestion => {
  const a = randomInt(10, 90);
  const b = randomInt(2, 9);
  const ans = a * b;
  const context = [
    `一张电影票${a}元，买${b}张需要多少钱？`,
    `每层楼高${b}米，这栋楼有${a}层，一共高多少米？`,
    `一盒巧克力有${a}块，${b}盒一共有多少块？`
  ];
  return {
    question: context[randomInt(0, context.length - 1)],
    answer: ans,
    options: generateOptions(ans),
    type: 'MUL',
    difficulty: 2,
    explanation: `${a} 乘以 ${b} 等于 ${ans}。`
  };
};

const generateDivQuestion = (): MathQuestion => {
  const b = randomInt(2, 9);
  const ans = randomInt(10, 100);
  const a = ans * b;
  const context = [
    `把${a}颗糖果平均分给${b}个小朋友，每人分到几颗？`,
    `这本故事书${a}页，如果每天看${b}页，几天能看完？`,
    `${a}元可以买${b}个同样的笔记本，一个笔记本多少钱？`
  ];
  return {
    question: context[randomInt(0, context.length - 1)],
    answer: ans,
    options: generateOptions(ans),
    type: 'DIV',
    difficulty: 2,
    explanation: `${a} 除以 ${b} 等于 ${ans}。`
  };
};

const generateOptions = (correct: number): number[] => {
  const opts = new Set<number>();
  opts.add(correct);
  while (opts.size < 4) {
    const diff = randomInt(1, 10) * (Math.random() > 0.5 ? 1 : -1) * (correct > 50 ? 10 : 1);
    const val = correct + diff;
    if (val > 0 && val !== correct) opts.add(val);
  }
  return Array.from(opts).sort(() => Math.random() - 0.5);
};

export const generateMathQuestion = async (
  mistakes: MistakeRecord[]
): Promise<MathQuestion | null> => {
  try {
    const systemPrompt = `你是一个小学数学老师。请生成一个适合三年级学生的数学题目。
题目类型可能是：加法 (ADD)、减法 (SUB)、乘法 (MUL)、除法 (DIV)。
请根据用户的错题记录调整难度：${JSON.stringify(mistakes)}。

返回格式必须是 JSON 且符合以下接口：
{
  "question": "题目内容，包含生活场景",
  "answer": 123,
  "options": [123, 456, 789, 101],
  "type": "ADD" | "SUB" | "MUL" | "DIV",
  "difficulty": 1 | 2 | 3,
  "explanation": "简短的解析"
}
确保 options 中包含 4 个选项，且其中一个是正确答案。`;

    const response = await fetch(ZEABUR_AI_HUB_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ZEABUR_AI_HUB_KEY}`
      },
      body: JSON.stringify({
        model: SELECTED_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "请生成一个数学挑战题目。" }
        ],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const question = JSON.parse(content) as MathQuestion;
    
    // Ensure numeric values and proper structure
    return {
      ...question,
      answer: Number(question.answer),
      options: question.options.map(o => Number(o)),
      difficulty: Number(question.difficulty || 1)
    };
  } catch (error) {
    console.error("Failed to generate AI question, falling back to local generator:", error);
    
    // Fallback to local logic
    return new Promise((resolve) => {
      setTimeout(() => {
        let type: 'ADD' | 'SUB' | 'MUL' | 'DIV' = 'ADD';
        const rand = Math.random();
        const mulMistakes = mistakes.find(m => m.questionType === 'MUL')?.count || 0;
        
        if (mulMistakes > 2 && rand > 0.3) {
          type = 'MUL';
        } else if (rand < 0.25) {
          type = 'ADD';
        } else if (rand < 0.5) {
          type = 'SUB';
        } else if (rand < 0.75) {
          type = 'MUL';
        } else {
          type = 'DIV';
        }

        let q: MathQuestion;
        switch (type) {
          case 'ADD': q = generateAddQuestion(); break;
          case 'SUB': q = generateSubQuestion(); break;
          case 'MUL': q = generateMulQuestion(); break;
          case 'DIV': q = generateDivQuestion(); break;
          default: q = generateAddQuestion();
        }
        resolve(q);
      }, 500);
    });
  }
};
