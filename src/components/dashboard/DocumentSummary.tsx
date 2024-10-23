import { Card } from '../ui/Card';
import { DocumentSummary as Summary } from '@/lib/ai';

interface DocumentSummaryProps {
  summary: Summary;
}

export function DocumentSummary({ summary }: DocumentSummaryProps) {
  return (
    <Card className="mt-6">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900">Document Summary</h3>
        
        <div className="mt-4 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Title</h4>
            <p className="mt-1 text-base text-gray-900">{summary.title}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700">Summary</h4>
            <p className="mt-1 text-base text-gray-600 whitespace-pre-line">
              {summary.summary}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700">Key Points</h4>
            <ul className="mt-1 list-disc list-inside space-y-1">
              {summary.keyPoints.map((point, index) => (
                <li key={index} className="text-base text-gray-600">
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Word Count</h4>
              <p className="mt-1 text-base text-gray-600">{summary.wordCount} words</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700">Topic Areas</h4>
              <div className="mt-1 flex flex-wrap gap-2">
                {summary.topicAreas.map((topic, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}