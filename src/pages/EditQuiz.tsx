import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { QuestionList } from "../components/quiz/QuestionList";
import { GenerateQuestions } from "../components/quiz/GenerateQuestions";

export const EditQuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`/api/quiz/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch quiz");
        }
        const data = await response.json();
        setQuestions(data.questions);
        setTitle(data.title);
      } catch (error) {
        console.error("Error fetching quiz:", error);
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchQuiz();
    }
  }, [id, navigate]);

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/quiz/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          questions,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save quiz");
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving quiz:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Edit Quiz: {title}</h1>
        <div className="space-y-6">
          <QuestionList questions={questions} setQuestions={setQuestions} />
          <GenerateQuestions setQuestions={setQuestions} />
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Save Changes
          </button>
        </div>
      </div>
    </Layout>
  );
};
