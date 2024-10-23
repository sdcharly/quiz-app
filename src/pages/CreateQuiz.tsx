import { Layout } from '@/components/layout/Layout';
import { QuizForm } from '@/components/quiz/QuizForm';

export function CreateQuiz() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create New Quiz</h2>
          <p className="mt-1 text-sm text-gray-500">
            Configure your quiz settings and generate questions
          </p>
        </div>

        <QuizForm />
      </div>
    </Layout>
  );
}