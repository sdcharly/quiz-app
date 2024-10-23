import { useState } from 'react';
import { Quiz, Question, useQuizStore } from '@/store/quiz';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Trash2, Edit2, Save, X } from 'lucide-react';

interface QuestionListProps {
  quiz: Quiz;
}

interface EditingQuestion extends Question {
  options: string[];
}

export function QuestionList({ quiz }: QuestionListProps) {
  const updateQuiz = useQuizStore((state) => state.updateQuiz);
  const [editingQuestion, setEditingQuestion] = useState<EditingQuestion | null>(null);

  const handleDeleteQuestion = (questionId: string) => {
    const updatedQuestions = quiz.questions.filter((q) => q.id !== questionId);
    updateQuiz(quiz.id, { questions: updatedQuestions });
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion({ ...question });
  };

  const handleSaveQuestion = () => {
    if (!editingQuestion) return;

    const updatedQuestions = quiz.questions.map((q) =>
      q.id === editingQuestion.id ? editingQuestion : q
    );

    updateQuiz(quiz.id, { questions: updatedQuestions });
    setEditingQuestion(null);
  };

  if (quiz.questions.length === 0) {
    return (
      <Card>
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">
            No questions yet. Click "Generate Questions" to create some.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {quiz.questions.map((question, index) => (
        <Card key={question.id}>
          {editingQuestion?.id === question.id ? (
            <div className="p-6 space-y-4">
              <Input
                label="Question Text"
                value={editingQuestion.text}
                onChange={(e) =>
                  setEditingQuestion({
                    ...editingQuestion,
                    text: e.target.value,
                  })
                }
              />

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Options</h4>
                {editingQuestion.options.map((option, optionIndex) => (
                  <Input
                    key={optionIndex}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...editingQuestion.options];
                      newOptions[optionIndex] = e.target.value;
                      setEditingQuestion({
                        ...editingQuestion,
                        options: newOptions,
                      });
                    }}
                    label={`Option ${String.fromCharCode(65 + optionIndex)}`}
                  />
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correct Answer
                </label>
                <select
                  value={editingQuestion.correctAnswer}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      correctAnswer: Number(e.target.value),
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {editingQuestion.options.map((_, i) => (
                    <option key={i} value={i}>
                      Option {String.fromCharCode(65 + i)}
                    </option>
                  ))}
                </select>
              </div>

              <Textarea
                label="Explanation"
                value={editingQuestion.explanation}
                onChange={(e) =>
                  setEditingQuestion({
                    ...editingQuestion,
                    explanation: e.target.value,
                  })
                }
              />

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingQuestion(null)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveQuestion}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-start p-6">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">
                  Question {index + 1}
                </h4>
                <p className="mt-1 text-sm text-gray-700">{question.text}</p>

                <div className="mt-4 space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className={`flex items-center p-2 rounded-md ${
                        optionIndex === question.correctAnswer
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <span className="text-sm">
                        {String.fromCharCode(65 + optionIndex)}. {option}
                      </span>
                    </div>
                  ))}
                </div>

                {question.explanation && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Explanation:</span>{' '}
                      {question.explanation}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditQuestion(question)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteQuestion(question.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}