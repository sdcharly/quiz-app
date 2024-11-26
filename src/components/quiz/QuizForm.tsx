import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { useQuizStore } from '@/store/quiz';
import { Timer, ListChecks, FileText, Pause, RefreshCw } from 'lucide-react';

interface Question {
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export function QuizForm() {
  const navigate = useNavigate();
  const addQuiz = useQuizStore((state) => state.addQuiz);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);
  const [questionsCount, setQuestionsCount] = useState(10);
  const [allowPause, setAllowPause] = useState(false);
  const [allowRetakes, setAllowRetakes] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (duration < 1) {
      newErrors.duration = 'Duration must be at least 1 minute';
    }
    if (questions.length === 0) {
      newErrors.questions = 'At least one question is required';
    }
    if (allowRetakes && maxAttempts < 2) {
      newErrors.maxAttempts = 'Maximum attempts must be at least 2 if retakes are allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddQuestion = () => {
    if (!currentQuestion.text.trim()) {
      setErrors(prev => ({ ...prev, questionText: 'Question text is required' }));
      return;
    }
    if (currentQuestion.options.some(opt => !opt.trim())) {
      setErrors(prev => ({ ...prev, options: 'All options must be filled' }));
      return;
    }
    
    setQuestions(prev => [...prev, currentQuestion]);
    setCurrentQuestion({
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
    });
    setErrors({});
  };

  const handleOptionChange = (index: number, value: string) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const quiz = {
      title,
      description,
      duration: Number(duration),
      questionsCount: questions.length,
      status: 'draft' as const,
      questions,
      settings: {
        allowPause,
        allowRetakes,
        maxAttempts: allowRetakes ? Number(maxAttempts) : 1,
      },
    };

    try {
      await addQuiz(quiz);
      navigate('/admin');
    } catch (error) {
      console.error('Failed to create quiz:', error);
      setErrors(prev => ({
        ...prev,
        submit: error instanceof Error ? error.message : 'Failed to create quiz',
      }));
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Quiz Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          icon={<FileText className="h-5 w-5 text-gray-400" />}
          placeholder="Enter quiz title"
        />

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
          placeholder="Enter quiz description"
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            type="number"
            label="Duration (minutes)"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            error={errors.duration}
            min={1}
            icon={<Timer className="h-5 w-5 text-gray-400" />}
          />

          <Input
            type="number"
            label="Number of Questions"
            value={questionsCount}
            onChange={(e) => setQuestionsCount(Number(e.target.value))}
            error={errors.questionsCount}
            min={1}
            icon={<ListChecks className="h-5 w-5 text-gray-400" />}
          />
        </div>

        <div className="space-y-4 rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900">Quiz Settings</h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pause className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">Allow Pause</p>
                <p className="text-xs text-gray-500">Students can pause and resume later</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={allowPause}
                onChange={(e) => setAllowPause(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">Allow Retakes</p>
                <p className="text-xs text-gray-500">Students can retake the quiz multiple times</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={allowRetakes}
                onChange={(e) => setAllowRetakes(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {allowRetakes && (
            <div className="mt-4">
              <Input
                type="number"
                label="Maximum Attempts"
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(Number(e.target.value))}
                error={errors.maxAttempts}
                min={2}
                max={10}
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Add Questions</h3>
          
          {questions.map((q, idx) => (
            <div key={idx} className="p-4 border rounded-lg">
              <p className="font-medium">Question {idx + 1}: {q.text}</p>
              <div className="ml-4">
                {q.options.map((opt, optIdx) => (
                  <p key={optIdx} className={optIdx === q.correctAnswer ? 'text-green-600' : ''}>
                    {optIdx + 1}. {opt}
                  </p>
                ))}
              </div>
            </div>
          ))}

          <div className="space-y-4 border p-4 rounded-lg">
            <Input
              label="Question Text"
              value={currentQuestion.text}
              onChange={(e) => setCurrentQuestion(prev => ({ ...prev, text: e.target.value }))}
              error={errors.questionText}
              placeholder="Enter question text"
            />

            {currentQuestion.options.map((opt, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  label={`Option ${idx + 1}`}
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  error={errors.options}
                  placeholder={`Enter option ${idx + 1}`}
                />
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={currentQuestion.correctAnswer === idx}
                  onChange={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: idx }))}
                  className="mt-8"
                />
              </div>
            ))}

            <Textarea
              label="Explanation (Optional)"
              value={currentQuestion.explanation}
              onChange={(e) => setCurrentQuestion(prev => ({ ...prev, explanation: e.target.value }))}
              placeholder="Enter explanation for the correct answer"
              rows={2}
            />

            <Button
              type="button"
              onClick={handleAddQuestion}
              variant="secondary"
              className="w-full"
            >
              Add Question
            </Button>
          </div>
        </div>

        {errors.submit && (
          <div className="text-red-500 text-sm">{errors.submit}</div>
        )}

        <Button type="submit" className="w-full">
          Create Quiz
        </Button>
      </form>
    </Card>
  );
}