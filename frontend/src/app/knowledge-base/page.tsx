'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  Eye,
  File,
  FileImage,
  FileSpreadsheet,
  Search,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/ui/SearchInput';
import { get, post, del } from '@/lib/api';
import type { KnowledgeDocument } from '@/types';

const documentTypeOptions = [
  { value: 'pdf', label: 'PDF Document' },
  { value: 'docx', label: 'Word Document' },
  { value: 'txt', label: 'Text File' },
  { value: 'md', label: 'Markdown' },
  { value: 'csv', label: 'CSV Data' },
  { value: 'website', label: 'Website URL' },
];

const fileTypeIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  docx: File,
  txt: FileText,
  md: FileText,
  csv: FileSpreadsheet,
  url: FileImage,
};

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeDocument | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadForm, setUploadForm] = useState({
    title: '',
    document_type: 'pdf',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = { page_size: 100 };
      if (searchQuery) params.search = searchQuery;
      const res = await get<{ results: KnowledgeDocument[] }>(
        '/knowledge/',
        params
      );
      setDocuments(res.data.results || []);
    } catch {
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (!uploadForm.title) {
      const name = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setUploadForm((prev) => ({ ...prev, title: name }));
    }
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const typeMap: Record<string, string> = {
      pdf: 'pdf',
      docx: 'docx',
      doc: 'docx',
      txt: 'txt',
      md: 'md',
      csv: 'csv',
    };
    if (typeMap[ext]) {
      setUploadForm((prev) => ({ ...prev, document_type: typeMap[ext] }));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadForm.title) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', uploadForm.title);
      formData.append('document_type', uploadForm.document_type);

      await fetch('/api/v1/knowledge/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${document.cookie.match(/access_token=([^;]+)/)?.[1] || ''}`,
        },
        body: formData,
      });

      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadForm({ title: '', document_type: 'pdf' });
      fetchDocuments();
    } catch {
      // error handled silently
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await del(`/knowledge/${id}/`);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      if (selectedDocument?.id === id) setSelectedDocument(null);
    } catch {
      // error handled silently
    }
  };

  const formatFileSize = (file: string) => {
    const parts = file.split('/');
    const name = parts[parts.length - 1];
    return name;
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
          <Button onClick={() => setShowUploadModal(true)}>
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search documents..."
            className="max-w-md"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className={selectedDocument ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Documents ({documents.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Spinner size="lg" />
                  </div>
                ) : documents.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="No documents yet"
                    description="Upload your first document to get started"
                    action={
                      <Button onClick={() => setShowUploadModal(true)}>
                        <Upload className="h-4 w-4" />
                        Upload Document
                      </Button>
                    }
                  />
                ) : (
                  <div className="divide-y divide-gray-100">
                    {documents.map((doc) => {
                      const Icon = fileTypeIcons[doc.document_type] || FileText;
                      return (
                        <div
                          key={doc.id}
                          onClick={() => setSelectedDocument(doc)}
                          className={`flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors hover:bg-gray-50 ${
                            selectedDocument?.id === doc.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                            <Icon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {doc.title}
                            </p>
                            <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                              <Badge variant="info" className="capitalize">
                                {doc.document_type}
                              </Badge>
                              <span>{formatFileSize(doc.file)}</span>
                              <span>
                                {new Date(doc.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={doc.is_indexed ? 'success' : 'warning'}>
                              {doc.is_indexed ? 'Indexed' : 'Pending'}
                            </Badge>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDocument(doc);
                              }}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(doc.id);
                              }}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {selectedDocument && (
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Document Preview</CardTitle>
                    <button
                      onClick={() => setSelectedDocument(null)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-100">
                      {(() => {
                        const Icon =
                          fileTypeIcons[selectedDocument.document_type] || FileText;
                        return <Icon className="h-8 w-8 text-blue-600" />;
                      })()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedDocument.title}
                      </h3>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="info" className="capitalize">
                          {selectedDocument.document_type}
                        </Badge>
                        <Badge
                          variant={selectedDocument.is_indexed ? 'success' : 'warning'}
                        >
                          {selectedDocument.is_indexed ? 'Indexed' : 'Processing'}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">File</span>
                        <span className="text-gray-900">
                          {formatFileSize(selectedDocument.file)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Uploaded</span>
                        <span className="text-gray-900">
                          {new Date(selectedDocument.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {selectedDocument.content && (
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-gray-700">
                          Content Preview
                        </h4>
                        <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                          {selectedDocument.content}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          window.open(selectedDocument.file, '_blank');
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        View File
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(selectedDocument.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setSelectedFile(null);
          setUploadForm({ title: '', document_type: 'pdf' });
        }}
        title="Upload Document"
        size="lg"
      >
        <div className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : selectedFile
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.doc,.txt,.md,.csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
            {selectedFile ? (
              <>
                <FileText className="mb-2 h-10 w-10 text-green-600" />
                <p className="text-sm font-medium text-green-700">
                  {selectedFile.name}
                </p>
                <p className="mt-1 text-xs text-green-600">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </>
            ) : (
              <>
                <Upload className="mb-2 h-10 w-10 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">
                  Drag & drop your file here
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  PDF, DOCX, TXT, MD, or CSV
                </p>
              </>
            )}
          </div>

          <Input
            label="Document Title"
            value={uploadForm.title}
            onChange={(e) =>
              setUploadForm({ ...uploadForm, title: e.target.value })
            }
            placeholder="Enter document title"
          />

          <Select
            label="Document Type"
            value={uploadForm.document_type}
            onChange={(e) =>
              setUploadForm({ ...uploadForm, document_type: e.target.value })
            }
            options={documentTypeOptions}
          />

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadModal(false);
                setSelectedFile(null);
                setUploadForm({ title: '', document_type: 'pdf' });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              isLoading={isUploading}
              disabled={!selectedFile || !uploadForm.title}
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
