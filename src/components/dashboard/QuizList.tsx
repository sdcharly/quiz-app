import { FileText, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '@/store/quiz';
import { cn } from '@/lib/utils';

export function QuizList() {
  const navigate = useNavigate();
  const quizzes = useQuizStore((state) => state.quizzes);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Your Quizzes</h3>
        <Button size="sm" onClick={() => navigate('/admin/create-quiz')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Quiz
        </Button>
      </div>

      <div className="mt-6 divide-y divide-gray-200">
        {quizzes.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">
            No quizzes created yet. Click the button above to create your first quiz.
          </p>
        ) : (
          quizzes.map((quiz) => (
            <div key={quiz.id} className="flex items-center justify-between py-4">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-400" />
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-900">
                    {quiz.title}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {quiz.questionsCount} questions • Created on{' '}
                    {new Date(quiz.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    quiz.status === 'published'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  )}
                >
                  {quiz.status}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/admin/quiz/${quiz.id}`)}
                >
                  Edit
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}