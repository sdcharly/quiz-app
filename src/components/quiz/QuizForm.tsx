import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { useQuizStore } from '@/store/quiz';
import { Timer, ListChecks, FileText, Pause, RefreshCw } from 'lucide-react';

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
    if (questionsCount < 1) {
      newErrors.questionsCount = 'Must have at least 1 question';
    }
    if (allowRetakes && maxAttempts < 2) {
      newErrors.maxAttempts = 'Maximum attempts must be at least 2 if retakes are allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const quiz = {
      id: crypto.randomUUID(),
      title,
      description,
      duration,
      questionsCount,
      status: 'draft' as const,
      questions: [],
      createdAt: new Date().toISOString(),
      settings: {
        allowPause,
        allowRetakes,
        maxAttempts: allowRetakes ? maxAttempts : 1,
      },
    };
    addQuiz(quiz);
    navigate('/admin');
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

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin')}
          >
            Cancel
          </Button>
          <Button type="submit">Create Quiz</Button>
        </div>
      </form>
    </Card>
  );
}