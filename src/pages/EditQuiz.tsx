import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { QuestionList } from '@/components/quiz/QuestionList';
import { GenerateQuestions } from '@/components/quiz/GenerateQuestions';
import { StudentAssignment } from '@/components/quiz/StudentAssignment';
import { useQuizStore } from '@/store/quiz';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, Save, Users, AlertCircle } from 'lucide-react';

export function EditQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { quizzes, updateQuiz } = useQuizStore();
  const { students } = useAuthStore();
  const quiz = quizzes.find((q) => q.id === id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!quiz) {
      navigate('/admin');
    }
  }, [quiz, navigate]);

  if (!quiz) return null;

  const assignedStudents = students.filter(student => 
    student.assignedQuizzes.includes(quiz.id)
  );

  const canPublish = 
    quiz.questions.length === quiz.questionsCount && // All questions are generated
    assignedStudents.length > 0 && // At least one student assigned
    quiz.status === 'draft'; // Quiz is still in draft

  const handlePublish = () => {
    if (!canPublish) {
      if (quiz.questions.length < quiz.questionsCount) {
        setError('Please generate all required questions before publishing.');
      } else if (assignedStudents.length === 0) {
        setError('Please assign at least one student before publishing.');
      } else if (quiz.status === 'published') {
        setError('This quiz has already been published.');
      }
      return;
    }

    updateQuiz(quiz.id, { status: 'published' });
    navigate('/admin');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin')}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h2 className="text-2xl font-bold text-gray-900">{quiz.title}</h2>
            <p className="mt-1 text-sm text-gray-500">{quiz.description}</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setIsAssigning(true)}
            >
              <Users className="mr-2 h-4 w-4" />
              Assign Students ({assignedStudents.length})
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsGenerating(true)}
              disabled={isGenerating || quiz.questions.length === quiz.questionsCount}
            >
              Generate Questions ({quiz.questions.length}/{quiz.questionsCount})
            </Button>
            <Button
              onClick={handlePublish}
              disabled={!canPublish}
            >
              <Save className="mr-2 h-4 w-4" />
              {quiz.status === 'published' ? 'Published' : 'Publish Quiz'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 text-sm text-amber-800 bg-amber-50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            {error}
          </div>
        )}

        <Card>
          <div className="flex items-center justify-between p-6">
            <h3 className="text-lg font-semibold text-gray-900">Quiz Details</h3>
            <div className="flex items-center gap-4">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                quiz.status === 'published' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {quiz.status}
              </span>
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-4 px-6 pb-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Duration</dt>
              <dd className="text-sm text-gray-900">{quiz.duration} minutes</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Questions</dt>
              <dd className="text-sm text-gray-900">
                {quiz.questions.length} / {quiz.questionsCount}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Assigned Students</dt>
              <dd className="text-sm text-gray-900">{assignedStudents.length}</dd>
            </div>
          </dl>
        </Card>

        <QuestionList quiz={quiz} />

        {isGenerating && (
          <GenerateQuestions
            quiz={quiz}
            onClose={() => setIsGenerating(false)}
          />
        )}

        {isAssigning && (
          <StudentAssignment
            quiz={quiz}
            onClose={() => setIsAssigning(false)}
          />
        )}
      </div>
    </Layout>
  );
}