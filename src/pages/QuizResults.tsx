import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useQuizStore } from '@/store/quiz';
import { useAuthStore } from '@/store/auth';
import { ArrowLeft, CheckCircle, XCircle, Clock, Award, BarChart2 } from 'lucide-react';

export function QuizResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const quiz = useQuizStore((state) => state.quizzes.find((q) => q.id === id));
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!quiz || !user) {
      navigate('/student');
    }
  }, [quiz, user, navigate]);

  if (!quiz || !user) return null;

  const attempts = quiz.attempts.filter((a) => a.studentId === user.id);
  const currentAttempt = attempts[attempts.length - 1];
  
  if (!currentAttempt) {
    navigate('/student');
    return null;
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const calculateStats = () => {
    const correctAnswers = currentAttempt.answers.reduce(
      (acc, answer, index) => (answer === quiz.questions[index].correctAnswer ? acc + 1 : acc),
      0
    );
    
    return {
      totalQuestions: quiz.questions.length,
      correctAnswers,
      incorrectAnswers: quiz.questions.length - correctAnswers,
      accuracy: (correctAnswers / quiz.questions.length) * 100,
      timePerQuestion: currentAttempt.timeSpent / quiz.questions.length,
      attemptNumber: attempts.length,
      bestScore: Math.max(...attempts.map((a) => a.score)),
      averageScore: attempts.reduce((acc, a) => acc + a.score, 0) / attempts.length,
    };
  };

  const stats = calculateStats();

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/student')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quiz Results</h2>
          <p className="mt-1 text-sm text-gray-500">{quiz.title}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Attempt</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-500">Score</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {Math.round(currentAttempt.score)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-500">Time Taken</span>
                </div>
                <span className="text-gray-900">{formatTime(currentAttempt.timeSpent)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-500">Correct Answers</span>
                </div>
                <span className="text-gray-900">{stats.correctAnswers}/{stats.totalQuestions}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Analysis</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-500">Accuracy</span>
                </div>
                <span className="text-gray-900">{Math.round(stats.accuracy)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-500">Avg. Time per Question</span>
                </div>
                <span className="text-gray-900">{Math.round(stats.timePerQuestion)}s</span>
              </div>
              {attempts.length > 1 && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-blue-500" />
                      <span className="text-sm font-medium text-gray-500">Best Score</span>
                    </div>
                    <span className="text-gray-900">{Math.round(stats.bestScore)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart2 className="h-5 w-5 text-blue-500" />
                      <span className="text-sm font-medium text-gray-500">Average Score</span>
                    </div>
                    <span className="text-gray-900">{Math.round(stats.averageScore)}%</span>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Question Analysis</h3>
          {quiz.questions.map((question, index) => (
            <Card key={question.id} className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">Question {index + 1}</span>
                      {currentAttempt.answers[index] === question.correctAnswer ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                          Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                          Incorrect
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-gray-900">{question.text}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className={`p-3 rounded-lg ${
                        optionIndex === question.correctAnswer
                          ? 'bg-green-50 border border-green-200'
                          : optionIndex === currentAttempt.answers[index]
                          ? 'bg-red-50 border border-red-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          <span className="font-medium">
                            {String.fromCharCode(65 + optionIndex)}.
                          </span>{' '}
                          {option}
                        </span>
                        {optionIndex === question.correctAnswer && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {optionIndex === currentAttempt.answers[index] &&
                          optionIndex !== question.correctAnswer && (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                      </div>
                    </div>
                  ))}
                </div>

                {question.explanation && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <span className="font-medium">Explanation:</span>{' '}
                      {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}