import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const SYSTEM_INSTRUCTION = `
Bạn là một giáo viên tiếng Anh tiểu học (gia sư) cực kỳ vui vẻ, kiên nhẫn và yêu trẻ em. 
Tên của bạn là "Teacher Joy". 
Đối tượng học sinh: Trẻ em lớp 2-5 tại Việt Nam.

PHƯƠNG PHÁP GIẢNG DẠY:
1. Luôn chào đón học sinh bằng những câu cổ vũ: "Chào con yêu!", "Hôm nay chúng ta sẽ học thật vui nhé!", "Con làm tốt lắm!".
2. Ngôn ngữ: Sử dụng tiếng Việt là chính để giải thích, tiếng Anh cho từ vựng và ví dụ.
3. Cấu trúc bài học (10-15 từ):
   - Giới thiệu từ vựng: Từ (Phiên âm) - Nghĩa - Ví dụ dễ hiểu.
   - Tương tác: Hỏi học sinh lặp lại hoặc đặt câu.
   - Trò chơi: Matching, Điền từ, hoặc Chọn đáp án.
   - Hoạt động nói: Gợi ý một câu đơn giản để học sinh nói.
4. Định dạng phản hồi: Sử dụng Markdown rõ ràng, có emoji sinh động.

QUẢN LÝ TIẾN ĐỘ & LỘ TRÌNH:
- Bạn nắm giữ lộ trình 3000 từ vựng chia theo các tháng.
- Khi học sinh hỏi về "ngày học thứ...", hãy:
  1. Kiểm tra tiến độ học tập của con (dựa trên thông tin được cung cấp).
  2. Tóm tắt những gì con đã học được.
  3. Đề xuất chủ đề tiếp theo trong lộ trình phù hợp với trình độ hiện tại.
  4. Khuyến khích con tiếp tục cố gắng.

Khi đánh giá phát âm của học sinh:
- Nếu phát âm tốt: Khen ngợi nhiệt tình.
- Nếu chưa tốt: Chỉ ra lỗi sai một cách nhẹ nhàng và khuyến khích con thử lại.
`;

export async function generateLesson(topic: string, grade: string, wordsList: any[]) {
  const wordsContext = wordsList.map(w => `- ${w.word}: ${w.meaning} (Ví dụ: ${w.example})`).join('\n');
  
  const prompt = `Dạy cho học sinh lớp ${grade} chủ đề: ${topic}. 
  Dưới đây là danh sách các từ vựng đã được nạp sẵn từ cơ sở dữ liệu:
  ${wordsContext}

  Hãy soạn bài học dưới dạng JSON với cấu trúc sau:
  {
    "topic": "Tên chủ đề",
    "words": [
      {
        "word": "từ tiếng Anh",
        "pronunciation": "phiên âm",
        "meaning": "nghĩa tiếng Việt",
        "example": "câu ví dụ dễ hiểu",
        "memoryTip": "mẹo ghi nhớ vui nhộn/dễ nhớ"
      }
    ],
    "fillInBlanks": [
      {
        "sentence": "câu có chỗ trống (dùng ___)",
        "answer": "đáp án đúng",
        "options": ["đáp án đúng", "sai 1", "sai 2"]
      }
    ],
    "dialogue": {
      "text": "đoạn hội thoại ngắn chứa các từ đã học",
      "question": "câu hỏi về nội dung hội thoại",
      "options": ["đáp án đúng", "sai 1", "sai 2"],
      "answer": "đáp án đúng"
    }
  }
  Yêu cầu: 
  1. Sử dụng CHÍNH XÁC các từ vựng được cung cấp ở trên.
  2. Tạo phiên âm, mẹo ghi nhớ và các câu ví dụ sinh động cho từng từ.
  3. Tạo bài tập điền từ và hội thoại dựa trên các từ này.
  4. Nội dung cực kỳ vui vẻ, phù hợp trẻ em.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
    },
  });

  return JSON.parse(response.text);
}

export async function generatePersonalizedGrammar(grade: string, structure: string, words: any[]) {
  const wordsContext = words.map(w => w.word).join(', ');
  const prompt = `Bạn là Teacher Joy. Hãy tạo 3 ví dụ câu tiếng Anh cho cấu trúc ngữ pháp: "${structure}" dành cho học sinh ${grade}.
  Yêu cầu:
  1. Sử dụng các từ vựng mà học sinh đã học: [${wordsContext}]. Nếu không đủ từ phù hợp, hãy dùng từ vựng cơ bản lớp ${grade}.
  2. Mỗi ví dụ đi kèm nghĩa tiếng Việt.
  3. Trả về kết quả dưới dạng JSON:
  {
    "examples": [
      {"en": "Câu tiếng Anh", "vi": "Nghĩa tiếng Việt"}
    ]
  }`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
    },
  });

  return JSON.parse(response.text);
}

export async function chatWithTutor(message: string, history: any[], context?: { progress: any[], roadmap: any[] }) {
  let systemInstruction = SYSTEM_INSTRUCTION;
  if (context) {
    systemInstruction += `\n\nTHÔNG TIN TIẾN ĐỘ HIỆN TẠI:
    - Các chủ đề đã học: ${context.progress.map(p => p.topic).join(', ')}
    - Tổng số từ đã học: ${context.progress.reduce((acc, p) => acc + p.words_learned, 0)}
    - Lộ trình sắp tới: ${context.roadmap.filter(t => !context.progress.find(p => p.topic === t.name)).map(t => t.name).slice(0, 3).join(', ')}
    `;
  }

  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: systemInstruction,
    },
    history: history,
  });

  const response = await chat.sendMessage({ message });
  return response.text;
}

export async function textToSpeech(text: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio;
}

export async function evaluatePronunciation(audioBase64: string, expectedText: string, mimeType: string = "audio/wav") {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: audioBase64,
          },
        },
        {
          text: `Đây là âm thanh học sinh lớp 2-5 đọc từ/câu: "${expectedText}". 
          Hãy đánh giá chi tiết phát âm này và trả về kết quả dưới dạng JSON:
          {
            "accuracy": số từ 0-100,
            "feedback": "nhận xét ngắn gọn bằng tiếng Việt, vui vẻ",
            "fluency": "nhận xét về độ trôi chảy",
            "suggestion": "mẹo nhỏ để đọc tốt hơn",
            "isCorrect": true/false (true nếu accuracy >= 80)
          }`,
        },
      ],
    },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
    },
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    // Fallback if AI doesn't return valid JSON
    return {
      accuracy: 70,
      feedback: response.text,
      fluency: "Khá tốt",
      suggestion: "Cố gắng lên con nhé!",
      isCorrect: response.text.toLowerCase().includes('tuyệt vời') || response.text.toLowerCase().includes('chính xác')
    };
  }
}
