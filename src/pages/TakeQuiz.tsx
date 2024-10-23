import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useQuizStore } from '@/store/quiz';
import { useAuthStore } from '@/store/auth';
import { ArrowLeft, ArrowRight, Clock, AlertTriangle, PauseCircle } from 'lucide-react';
import { ProgressBar } from '@/components/ui/ProgressBar';

export function TakeQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const quiz = useQuizStore((state) => state.quizzes.find((q) => q.id === id));
  const { submitQuizAttempt, pauseQuizAttempt } = useQuizStore();
  const user = useAuthStore((state) => state.user);
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningType, setWarningType] = useState<'exit' | 'submit' | 'pause'>('exit');

  useEffect(() => {
    if (!quiz || !user) {
      navigate('/student');
      return;
    }

    // Check if student can take this quiz
    const attempts = quiz.attempts.filter(a => a.studentId === user.id);
    const completedAttempts = attempts.filter(a => a.status === 'completed');
    
    if (!quiz.settings.allowRetakes && completedAttempts.length > 0) {
      navigate('/student');
      return;
    }

    if (quiz.settings.allowRetakes && completedAttempts.length >= quiz.settings.maxAttempts) {
      navigate('/student');
      return;
    }

    // Resume from pause if applicable
    const pausedAttempt = attempts.find(a => a.status === 'paused');
    if (pausedAttempt) {
      setTimeLeft(pausedAttempt.remainingTime || quiz.duration * 60);
      setSelectedAnswers(pausedAttempt.answers);
      setCurrentQuestion(pausedAttempt.answers.findIndex(a => a === -1) || 0);
    } else {
      setTimeLeft(quiz.duration * 60);
      setSelectedAnswers(new Array(quiz.questions.length).fill(-1));
    }
  }, [quiz, user, navigate]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  if (!quiz || !user) return null;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (answerIndex: number) => {
    setSelectedAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[currentQuestion] = answerIndex;
      return newAnswers;
    });
  };

  const handlePause = async () => {
    if (!quiz.settings.allowPause) return;

    try {
      await pauseQuizAttempt(quiz.id, user.id, timeLeft);
      navigate('/student');
    } catch (error) {
      console.error('Failed to pause quiz:', error);
    }
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit) {
      const unanswered = selectedAnswers.filter((a) => a === -1).length;
      if (unanswered > 0) {
        setWarningType('submit');
        setShowWarning(true);
        return;
      }
    }

    setIsSubmitting(true);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    try {
      await submitQuizAttempt({
        id: crypto.randomUUID(),
        quizId: quiz.id,
        studentId: user.id,
        answers: selectedAnswers,
        timeSpent,
        remainingTime: null,
        status: 'completed',
      });
      navigate('/student/results/' + quiz.id);
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      setIsSubmitting(false);
    }
  };

  const currentQuestionData = quiz.questions[currentQuestion];
  const answeredCount = selectedAnswers.filter((a) => a !== -1).length;
  const progress = (answeredCount / quiz.questions.length) * 100;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (answeredCount > 0) {
                setWarningType('exit');
                setShowWarning(true);
              } else {
                navigate('/student');
              }
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Exit Quiz
          </Button>
          <div className="flex items-center gap-4">
            {quiz.settings.allowPause && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setWarningType('pause');
                  setShowWarning(true);
                }}
              >
                <PauseCircle className="mr-2 h-4 w-4" />
                Pause Quiz
              </Button>
            )}
            <div className="flex items-center text-lg font-semibold text-gray-900">
              <Clock className="mr-2 h-5 w-5 text-blue-500" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Question {currentQuestion + 1} of {quiz.questions.length}
              </h3>
              <span className="text-sm text-gray-500">
                {answeredCount} of {quiz.questions.length} answered
              </span>
            </div>

            <ProgressBar progress={progress} />

            <div className="space-y-4">
              <p className="text-gray-900">{currentQuestionData.text}</p>

              <div className="space-y-3">
                {currentQuestionData.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                      selectedAnswers[currentQuestion] === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    <span className="font-medium">
                      {String.fromCharCode(65 + index)}.
                    </span>{' '}
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion((prev) => prev - 1)}
                disabled={currentQuestion === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {currentQuestion === quiz.questions.length - 1 ? (
                <Button
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting}
                >
                  Submit Quiz
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentQuestion((prev) => prev + 1)}
                  disabled={selectedAnswers[currentQuestion] === -1}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>

        {showWarning && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6">
              <div className="flex items-start">
                <AlertTriangle className="h-6 w-6 text-yellow-500 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {warningType === 'pause'
                      ? 'Pause Quiz?'
                      : warningType === 'submit'
                      ? 'Submit Quiz?'
                      : 'Exit Quiz?'}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {warningType === 'pause'
                      ? 'Your progress will be saved and you can resume later.'
                      : answeredCount < quiz.questions.length
                      ? `You have ${
                          quiz.questions.length - answeredCount
                        } unanswered questions. Are you sure you want to ${
                          warningType === 'submit' ? 'submit' : 'exit'
                        }?`
                      : `Are you sure you want to ${
                          warningType === 'submit' ? 'submit your quiz' : 'exit'
                        }?`}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowWarning(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowWarning(false);
                    if (warningType === 'pause') {
                      handlePause();
                    } else if (warningType === 'submit') {
                      handleSubmit(true);
                    } else {
                      navigate('/student');
                    }
                  }}
                >
                  {warningType === 'pause'
                    ? 'Pause Quiz'
                    : warningType === 'submit'
                    ? 'Submit Quiz'
                    : 'Exit Quiz'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}