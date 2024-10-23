import { useState } from 'react';
import { Quiz, useQuizStore } from '@/store/quiz';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Loader2, Brain, AlertCircle } from 'lucide-react';
import { generateQuestions, QuestionGenerationError } from '@/services/questionGenerator';

interface GenerateQuestionsProps {
  quiz: Quiz;
  onClose: () => void;
}

type Complexity = 'lite' | 'medium' | 'expert';

interface ComplexityOption {
  value: Complexity;
  label: string;
  description: string;
  icon: JSX.Element;
}

const complexityOptions: ComplexityOption[] = [
  {
    value: 'lite',
    label: 'Lite',
    description: 'Basic understanding and recall of main concepts',
    icon: <Brain className="h-5 w-5 text-green-500" />
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Deeper understanding and application of concepts',
    icon: <Brain className="h-5 w-5 text-yellow-500" />
  },
  {
    value: 'expert',
    label: 'Expert',
    description: 'Advanced analysis and complex problem-solving',
    icon: <Brain className="h-5 w-5 text-red-500" />
  }
];

export function GenerateQuestions({ quiz, onClose }: GenerateQuestionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complexity, setComplexity] = useState<Complexity>('medium');
  const updateQuiz = useQuizStore((state) => state.updateQuiz);

  const remainingQuestions = quiz.questionsCount - quiz.questions.length;

  const handleGenerateQuestions = async () => {
    if (remainingQuestions <= 0) {
      setError('All required questions have already been generated.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const documentContent = sessionStorage.getItem('processedDocument');
      
      if (!documentContent) {
        throw new Error('No document content found. Please upload and process a document first.');
      }

      const questions = await generateQuestions({
        complexity,
        count: remainingQuestions,
        content: documentContent
      });

      updateQuiz(quiz.id, {
        questions: [
          ...quiz.questions,
          ...questions
        ]
      });

      onClose();
    } catch (err) {
      console.error('Question generation error:', err);
      if (err instanceof QuestionGenerationError && err.details?.errors) {
        setError(err.details.errors.join('\n'));
      } else {
        setError(err instanceof Error ? err.message : 'Failed to generate questions');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <div className="space-y-6 p-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Generate Questions
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {remainingQuestions > 0
                ? `Generate ${remainingQuestions} more questions (${quiz.questions.length}/${quiz.questionsCount} created)`
                : 'All required questions have been generated'}
            </p>
          </div>

          {remainingQuestions <= 0 && (
            <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
              <p className="text-sm text-yellow-700">
                You have already generated all required questions. You can delete existing questions if you want to generate new ones.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700">
              Complexity Level
            </label>
            <div className="grid gap-4">
              {complexityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setComplexity(option.value)}
                  className={`flex items-start space-x-4 p-4 rounded-lg border-2 transition-colors ${
                    complexity === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <div className="flex-shrink-0">{option.icon}</div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{option.label}</p>
                    <p className="text-sm text-gray-500">{option.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 text-sm text-red-800 bg-red-100 rounded-md whitespace-pre-line">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateQuestions}
              disabled={isLoading || remainingQuestions <= 0}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate'
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}