import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { useQuizStore } from '@/store/quiz';
import { Timer, ListChecks, FileText, Pause, RefreshCw } from 'lucide-react';
import { useDocumentStore } from '@/store/documents';

interface Question {
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export function QuizForm() {
  const navigate = useNavigate();
  const addQuiz = useQuizStore((state) => state.addQuiz);
  const { documents, selectedDocuments, selectDocument, deselectDocument } = useDocumentStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);
  const [questionsCount, setQuestionsCount] = useState(10);
  const [allowPause, setAllowPause] = useState(false);
  const [allowRetakes, setAllowRetakes] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
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

  const generateQuestions = async () => {
    if (selectedDocuments.length === 0) {
      setErrors({ documents: 'Please select at least one document' });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentIds: selectedDocuments,
          count: questionsCount,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      const generatedQuestions = await response.json();
      setQuestions(generatedQuestions);
    } catch (error) {
      console.error('Failed to generate questions:', error);
      setErrors({ generation: 'Failed to generate questions. Please try again.' });
    } finally {
      setIsGenerating(false);
    }
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
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Create New Quiz</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={errors.description}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              error={errors.duration}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Number of Questions</label>
            <Input
              type="number"
              value={questionsCount}
              onChange={(e) => setQuestionsCount(parseInt(e.target.value))}
              error={errors.questionsCount}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Select Documents</h3>
          {documents.length === 0 ? (
            <p className="text-sm text-gray-500">No documents available. Please upload some documents first.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`p-4 border rounded-lg cursor-pointer ${
                    selectedDocuments.includes(doc.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() =>
                    selectedDocuments.includes(doc.id)
                      ? deselectDocument(doc.id)
                      : selectDocument(doc.id)
                  }
                >
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <h4 className="font-medium">{doc.title}</h4>
                      <p className="text-sm text-gray-500">
                        {doc.metadata.wordCount} words • {doc.metadata.chunkCount} chunks
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="allowPause"
              checked={allowPause}
              onChange={(e) => setAllowPause(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="allowPause" className="ml-2 text-sm text-gray-700">
              Allow Pause
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="allowRetakes"
              checked={allowRetakes}
              onChange={(e) => setAllowRetakes(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="allowRetakes" className="ml-2 text-sm text-gray-700">
              Allow Retakes
            </label>
          </div>
          {allowRetakes && (
            <div className="flex items-center">
              <label htmlFor="maxAttempts" className="text-sm text-gray-700 mr-2">
                Max Attempts:
              </label>
              <Input
                type="number"
                id="maxAttempts"
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(parseInt(e.target.value))}
                className="w-20"
                min={2}
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Questions</h3>
            <Button
              onClick={generateQuestions}
              disabled={isGenerating || selectedDocuments.length === 0}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <ListChecks className="mr-2 h-4 w-4" />
                  Generate Questions
                </>
              )}
            </Button>
          </div>

          {errors.generation && (
            <p className="text-sm text-red-600">{errors.generation}</p>
          )}

          {questions.length > 0 ? (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Question {index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newQuestions = [...questions];
                        newQuestions.splice(index, 1);
                        setQuestions(newQuestions);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                  <p className="mt-2">{question.text}</p>
                  <div className="mt-2 space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className={`p-2 rounded ${
                          optionIndex === question.correctAnswer
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                  {question.explanation && (
                    <p className="mt-2 text-sm text-gray-600">
                      Explanation: {question.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No questions generated yet. Select documents and click "Generate Questions" to start.
            </p>
          )}
        </div>

        <Button type="submit" onClick={handleSubmit} className="w-full">
          Create Quiz
        </Button>
      </div>
    </Card>
  );
}