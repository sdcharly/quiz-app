import { Card } from '../ui/Card';
import { FileText, Clock, Hash, Layers, ChevronRight } from 'lucide-react';
import { ProcessedDocument } from '@/lib/documentProcessor';

interface DocumentSummaryProps {
  document: ProcessedDocument;
}

function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function DocumentSummary({ document }: DocumentSummaryProps) {
  const { metadata } = document;
  
  return (
    <Card className="mt-6">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900">Document Summary</h3>
        
        <div className="mt-4 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Document Information</h4>
            <dl className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <dt className="text-sm text-gray-500">File Name:</dt>
                <dd className="text-sm font-medium text-gray-900">{metadata.title}</dd>
              </div>
              
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-gray-400" />
                <dt className="text-sm text-gray-500">Type:</dt>
                <dd className="text-sm font-medium text-gray-900">{metadata.fileType}</dd>
              </div>
              
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-gray-400" />
                <dt className="text-sm text-gray-500">Size:</dt>
                <dd className="text-sm font-medium text-gray-900">{formatFileSize(metadata.fileSize)}</dd>
              </div>
              
              {metadata.pageCount && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <dt className="text-sm text-gray-500">Pages:</dt>
                  <dd className="text-sm font-medium text-gray-900">{metadata.pageCount}</dd>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-gray-400" />
                <dt className="text-sm text-gray-500">Words:</dt>
                <dd className="text-sm font-medium text-gray-900">{metadata.wordCount.toLocaleString()}</dd>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <dt className="text-sm text-gray-500">Processed in:</dt>
                <dd className="text-sm font-medium text-gray-900">{formatDuration(metadata.processingTime)}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700">Content Analysis</h4>
            <dl className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-gray-400" />
                <dt className="text-sm text-gray-500">Chunks:</dt>
                <dd className="text-sm font-medium text-gray-900">{metadata.chunkCount}</dd>
              </div>
              
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-gray-400" />
                <dt className="text-sm text-gray-500">Avg. Words/Chunk:</dt>
                <dd className="text-sm font-medium text-gray-900">{metadata.averageWordsPerChunk}</dd>
              </div>
              
              <div className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <dt className="text-sm text-gray-500">Splitter:</dt>
                <dd className="text-sm font-medium text-gray-900 capitalize">{metadata.splitterType}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700">Splitter Configuration</h4>
            <dl className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-gray-400" />
                <dt className="text-sm text-gray-500">Chunk Size:</dt>
                <dd className="text-sm font-medium text-gray-900">{metadata.splitterConfig.chunkSize} chars</dd>
              </div>
              
              {metadata.splitterConfig.overlap && (
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-gray-400" />
                  <dt className="text-sm text-gray-500">Overlap:</dt>
                  <dd className="text-sm font-medium text-gray-900">{metadata.splitterConfig.overlap} chars</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </Card>
  );
}