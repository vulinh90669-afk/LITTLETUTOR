export interface Topic {
  id: string;
  name: string;
  vietnamese: string;
  month: number;
  grade: string;
  icon: string;
}

export const ROADMAP: Topic[] = [
  // Month 1
  { id: "family", name: "Family", vietnamese: "Gia đình", month: 1, grade: "2-5", icon: "Users" },
  { id: "school", name: "School", vietnamese: "Trường học", month: 1, grade: "2-5", icon: "School" },
  { id: "body", name: "Body", vietnamese: "Cơ thể", month: 1, grade: "2-5", icon: "User" },
  { id: "colors", name: "Colors", vietnamese: "Màu sắc", month: 1, grade: "2-5", icon: "Palette" },
  { id: "numbers", name: "Numbers", vietnamese: "Số đếm", month: 1, grade: "2-5", icon: "Hash" },
  { id: "animals-basic", name: "Animals (Basic)", vietnamese: "Động vật (Cơ bản)", month: 1, grade: "2-5", icon: "Dog" },
  
  // Month 2
  { id: "food", name: "Food", vietnamese: "Thức ăn", month: 2, grade: "2-5", icon: "Utensils" },
  { id: "clothes", name: "Clothes", vietnamese: "Quần áo", month: 2, grade: "2-5", icon: "Shirt" },
  { id: "house", name: "House", vietnamese: "Ngôi nhà", month: 2, grade: "2-5", icon: "Home" },
  { id: "nature", name: "Nature", vietnamese: "Thiên nhiên", month: 2, grade: "2-5", icon: "Leaf" },
  { id: "feelings", name: "Feelings", vietnamese: "Cảm xúc", month: 2, grade: "2-5", icon: "Smile" },
  { id: "action-verbs", name: "Action Verbs", vietnamese: "Động từ hành động", month: 2, grade: "2-5", icon: "Zap" },
  
  // Month 3
  { id: "transportation", name: "Transportation", vietnamese: "Giao thông", month: 3, grade: "2-5", icon: "Car" },
  { id: "jobs", name: "Jobs", vietnamese: "Nghề nghiệp", month: 3, grade: "2-5", icon: "Briefcase" },
  { id: "weather", name: "Weather", vietnamese: "Thời tiết", month: 3, grade: "2-5", icon: "CloudSun" },
  { id: "daily-routine", name: "Daily Routine", vietnamese: "Hàng ngày", month: 3, grade: "2-5", icon: "Clock" },
  { id: "adjectives-basic", name: "Adjectives (Basic)", vietnamese: "Tính từ (Cơ bản)", month: 3, grade: "2-5", icon: "Star" },
];
