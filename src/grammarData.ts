export interface GrammarStructure {
  title: string;
  examples: string[];
}

export interface GrammarLevel {
  level: string;
  grade: string;
  color: string;
  sections: GrammarStructure[];
}

export const GRAMMAR_LEVELS: GrammarLevel[] = [
  {
    level: "LEVEL 1",
    grade: "Lớp 2 (Câu đơn cơ bản)",
    color: "bg-emerald-500",
    sections: [
      {
        title: "Giới thiệu",
        examples: ["I am ___.", "My name is ___.", "I am ___ years old."]
      },
      {
        title: "Chỉ đồ vật",
        examples: ["This is a ___.", "That is my ___."]
      },
      {
        title: "Thích / Không thích",
        examples: ["I like ___.", "I don’t like ___."]
      },
      {
        title: "Có / Không có",
        examples: ["I have a ___.", "I don’t have a ___."]
      }
    ]
  },
  {
    level: "LEVEL 2",
    grade: "Lớp 3",
    color: "bg-amber-500",
    sections: [
      {
        title: "Hiện tại đơn",
        examples: ["I play football.", "She likes milk.", "He goes to school."]
      },
      {
        title: "Hỏi – đáp",
        examples: ["What is this?", "Where is the cat?", "Who is she?"]
      },
      {
        title: "Giới từ",
        examples: ["The book is on the table.", "The dog is under the chair."]
      }
    ]
  },
  {
    level: "LEVEL 3",
    grade: "Lớp 4",
    color: "bg-orange-500",
    sections: [
      {
        title: "Quá khứ đơn",
        examples: ["I played yesterday.", "She went to school."]
      },
      {
        title: "Tương lai",
        examples: ["I will go to the park.", "I am going to study."]
      },
      {
        title: "So sánh",
        examples: ["This is bigger.", "She is taller than me."]
      }
    ]
  },
  {
    level: "LEVEL 4",
    grade: "Lớp 5",
    color: "bg-red-500",
    sections: [
      {
        title: "Trạng từ",
        examples: ["She runs quickly.", "He speaks loudly."]
      },
      {
        title: "Liên từ",
        examples: ["I was tired but happy.", "I stayed home because it rained."]
      },
      {
        title: "Viết đoạn văn",
        examples: ["Viết đoạn văn 5–8 câu về chủ đề yêu thích."]
      }
    ]
  }
];
