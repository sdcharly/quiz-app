import { useState } from 'react';
import { Quiz } from '@/store/quiz';
import { useAuthStore } from '@/store/auth';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Mail, Plus, Search, Trash2, UserPlus } from 'lucide-react';

interface StudentAssignmentProps {
  quiz: Quiz;
  onClose: () => void;
}

export function StudentAssignment({ quiz, onClose }: StudentAssignmentProps) {
  const { students, addStudent, removeStudent, assignQuiz, unassignQuiz } = useAuthStore();
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStudent = () => {
    if (!newStudentEmail || !newStudentName) return;

    addStudent({
      name: newStudentName,
      email: newStudentEmail,
    });

    setNewStudentEmail('');
    setNewStudentName('');
    setShowAddForm(false);
  };

  const toggleQuizAssignment = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    if (student.assignedQuizzes.includes(quiz.id)) {
      unassignQuiz(studentId, quiz.id);
    } else {
      assignQuiz(studentId, quiz.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Assign Students to Quiz
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage student access to "{quiz.title}"
          </p>

          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search className="h-5 w-5 text-gray-400" />}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowAddForm(true)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </div>

            {showAddForm && (
              <Card className="p-4 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-900 mb-4">
                  Add New Student
                </h4>
                <div className="space-y-4">
                  <Input
                    placeholder="Student Name"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                  />
                  <Input
                    type="email"
                    placeholder="Student Email"
                    value={newStudentEmail}
                    onChange={(e) => setNewStudentEmail(e.target.value)}
                    icon={<Mail className="h-5 w-5 text-gray-400" />}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddStudent}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Student
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Students ({filteredStudents.length})
              </h4>
              <div className="space-y-2">
                {filteredStudents.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No students found. Add students to assign them to this quiz.
                  </p>
                ) : (
                  filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {student.name}
                        </p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={student.assignedQuizzes.includes(quiz.id) ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => toggleQuizAssignment(student.id)}
                        >
                          {student.assignedQuizzes.includes(quiz.id)
                            ? 'Assigned'
                            : 'Assign'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => removeStudent(student.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}