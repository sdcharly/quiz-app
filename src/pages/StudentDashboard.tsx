import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useQuizStore } from '@/store/quiz';
import { useAuthStore } from '@/store/auth';
import { PlayCircle, Clock, ListChecks, PauseCircle, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function StudentDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const quizzes = useQuizStore((state) => state.quizzes);

  // Get assigned quizzes for the current student
  const assignedQuizzes = quizzes.filter(quiz => 
    quiz.status === 'published' && 
    (user as any)?.assignedQuizzes?.includes(quiz.id)
  );

  if (!user) return null;

  const getQuizStatus = (quiz: Quiz) => {
    const attempts = quiz.attempts.filter(a => a.studentId === user.id);
    const latestAttempt = attempts[attempts.length - 1];

    if (!latestAttempt) return 'not-started';
    if (latestAttempt.status === 'paused') return 'paused';
    if (latestAttempt.status === 'completed') {
      if (quiz.settings.allowRetakes && attempts.length < quiz.settings.maxAttempts) {
        return 'can-retry';
      }
      return 'completed';
    }
    return 'in-progress';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'can-retry':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'paused':
        return 'Paused';
      case 'can-retry':
        return 'Can Retry';
      case 'in-progress':
        return 'In Progress';
      default:
        return 'Not Started';
    }
  };

  const getButtonText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'View Results';
      case 'paused':
        return 'Resume Quiz';
      case 'can-retry':
        return 'Retry Quiz';
      case 'in-progress':
        return 'Continue Quiz';
      default:
        return 'Start Quiz';
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Dashboard</h2>
          <p className="mt-1 text-sm text-gray-500">
            View your assigned quizzes and track your progress
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assignedQuizzes.map((quiz) => {
            const status = getQuizStatus(quiz);
            const attempts = quiz.attempts.filter(a => a.studentId === user.id);
            const bestScore = attempts.length > 0
              ? Math.max(...attempts.map(a => a.score))
              : null;

            return (
              <Card key={quiz.id} className="flex flex-col">
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {quiz.title}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                        status
                      )}`}
                    >
                      {getStatusText(status)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                    {quiz.description}
                  </p>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="mr-2 h-4 w-4" />
                      {quiz.duration} minutes
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <ListChecks className="mr-2 h-4 w-4" />
                      {quiz.questionsCount} questions
                    </div>
                    {bestScore !== null && (
                      <div className="flex items-center text-sm text-gray-500">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Best Score: {Math.round(bestScore)}%
                      </div>
                    )}
                    {attempts.length > 0 && (
                      <div className="flex items-center text-sm text-gray-500">
                        <XCircle className="mr-2 h-4 w-4" />
                        Attempts: {attempts.length}/{quiz.settings.maxAttempts}
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 p-6">
                  <Button
                    onClick={() =>
                      status === 'completed' && !quiz.settings.allowRetakes
                        ? navigate(`/student/results/${quiz.id}`)
                        : navigate(`/student/quiz/${quiz.id}`)
                    }
                    className="w-full"
                    disabled={false} // Remove the disabled condition
                  >
                    {status === 'paused' ? (
                      <PauseCircle className="mr-2 h-4 w-4" />
                    ) : (
                      <PlayCircle className="mr-2 h-4 w-4" />
                    )}
                    {getButtonText(status)}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {assignedQuizzes.length === 0 && (
          <Card className="p-6 text-center">
            <p className="text-sm text-gray-500">
              No quizzes have been assigned to you yet.
            </p>
          </Card>
        )}
      </div>
    </Layout>
  );
}