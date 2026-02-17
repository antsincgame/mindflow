export interface Exercise {
  id: string;
  title: string;
  description: string;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'beginner';
  category: string;
  instructions?: string[];
  benefits?: string[];
  emotionTags?: string[];
  icon?: string;
  color?: string;
}
