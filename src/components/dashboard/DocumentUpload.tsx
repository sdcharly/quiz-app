import { useState } from 'react';
import { Upload, X, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import OpenAI from 'openai';
import { processDocument } from '../../lib/documentProcessor';
import { getUserFriendlyError } from '../../lib/errors';

interface ProcessedDocument {
  id: string;
  name: string;
  content: string;
  summary?: string;
  metadata?: {
    pageCount?: number;
    fileSize?: number;
    processingTime?: number;
  };
}

interface ErrorState {
  message: string;
  type: 'error' | 'warning';
  timestamp: number;
}

export function DocumentUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [processedDocs, setProcessedDocs] = useState<ProcessedDocument[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<ErrorState[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);

  const addError = (message: string, type: 'error' | 'warning' = 'error') => {
    setErrors(prev => [...prev, { message, type, timestamp: Date.now() }]);
    // Auto-remove errors after 5 seconds
    setTimeout(() => {
      setErrors(prev => prev.filter(e => e.timestamp !== Date.now()));
    }, 5000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => 
      file.type === 'application/pdf' || 
      file.type === 'text/plain'
    );

    if (droppedFiles.length === 0) {
      addError('Please upload PDF or text files only');
      return;
    }

    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(file => 
        file.type === 'application/pdf' || 
        file.type === 'text/plain'
      );

      if (selectedFiles.length === 0) {
        addError('Please upload PDF or text files only');
        return;
      }

      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const generateSummary = async (content: string): Promise<string> => {
    const apiKey = import.meta.env.VITE_AI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found');
    }

    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-2024-08-06",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that creates concise summaries of documents."
          },
          {
            role: "user",
            content: `Please provide a brief summary of the following text:\n\n${content}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Summary generation error:', error);
      throw new Error('Failed to generate summary');
    }
  };

  const processFiles = async () => {
    setIsProcessing(true);
    setErrors([]);
    setCurrentFileIndex(0);

    const processedDocuments: ProcessedDocument[] = [];

    for (let i = 0; i < files.length; i++) {
      setCurrentFileIndex(i);
      const file = files[i];

      try {
        const result = await processDocument(file);
        
        let summary = '';
        try {
          summary = await generateSummary(result.content);
        } catch (summaryError) {
          console.warn('Failed to generate summary:', summaryError);
          addError(`Warning: Could not generate summary for ${file.name}`, 'warning');
        }

        processedDocuments.push({
          id: crypto.randomUUID(),
          name: file.name,
          content: result.content,
          summary,
          metadata: {
            pageCount: result.metadata.pageCount,
            fileSize: result.metadata.fileSize,
            processingTime: result.metadata.processingTime
          }
        });
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        addError(getUserFriendlyError(error as Error));
      }
    }

    if (processedDocuments.length > 0) {
      setProcessedDocs(processedDocuments);
      setFiles([]);
    } else if (errors.length === 0) {
      addError('No documents were successfully processed');
    }

    setIsProcessing(false);
    setCurrentFileIndex(-1);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Card className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Upload Documents</h3>
          <p className="mt-1 text-sm text-gray-500">
            Upload PDF or text documents to generate quiz questions
          </p>
        </div>
        {files.length > 0 && (
          <Button
            onClick={processFiles}
            disabled={isProcessing}
            className="flex items-center"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing {currentFileIndex + 1} of {files.length}
              </>
            ) : (
              'Process Files'
            )}
          </Button>
        )}
      </div>

      {errors.length > 0 && (
        <div className="space-y-2 mb-4">
          {errors.map((error, index) => (
            <div
              key={error.timestamp}
              className={cn(
                'p-4 text-sm rounded-md flex items-start',
                error.type === 'error' 
                  ? 'text-red-800 bg-red-100'
                  : 'text-yellow-800 bg-yellow-100'
              )}
            >
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              {error.message}
            </div>
          ))}
        </div>
      )}

      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6',
          'transition-colors duration-200',
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300',
          files.length > 0 && 'mb-4'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Drag and drop files here, or click to select files
        </p>
        <input
          type="file"
          className="hidden"
          onChange={handleFileChange}
          multiple
          accept=".pdf,.txt"
          id="file-upload"
          title="Upload files"
        />
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          Select Files
        </Button>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Selected Files:</h4>
          <div className="divide-y divide-gray-200">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">{file.name}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    ({formatFileSize(file.size)})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="text-gray-500 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {processedDocs.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Processed Documents:
          </h4>
          <div className="space-y-4">
            {processedDocs.map((doc) => (
              <div
                key={doc.id}
                className="rounded-lg border border-gray-200 p-4"
              >
                <div className="flex justify-between items-start">
                  <h5 className="font-medium text-gray-900">{doc.name}</h5>
                  {doc.metadata && (
                    <div className="text-xs text-gray-500">
                      {doc.metadata.pageCount && (
                        <span className="mr-3">{doc.metadata.pageCount} pages</span>
                      )}
                      {doc.metadata.fileSize && (
                        <span className="mr-3">{formatFileSize(doc.metadata.fileSize)}</span>
                      )}
                      {doc.metadata.processingTime && (
                        <span>Processed in {(doc.metadata.processingTime / 1000).toFixed(1)}s</span>
                      )}
                    </div>
                  )}
                </div>
                {doc.summary && (
                  <div className="mt-2">
                    <h6 className="text-sm font-medium text-gray-700">Summary:</h6>
                    <p className="text-sm text-gray-600 mt-1">{doc.summary}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
