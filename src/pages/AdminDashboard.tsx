import { Layout } from '@/components/layout/Layout';
import { DocumentUpload } from '@/components/dashboard/DocumentUpload';
import { QuizList } from '@/components/dashboard/QuizList';

export function AdminDashboard() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your quizzes and upload documents
          </p>
        </div>

        <DocumentUpload />
        <QuizList />
      </div>
    </Layout>
  );
}