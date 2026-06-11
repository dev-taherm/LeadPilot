'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  ArrowUpDown,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { get, post, put, del } from '@/lib/api';
import type { Lead, LeadStatus, LeadSource, PaginatedResponse } from '@/types';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'unqualified', label: 'Unqualified' },
  { value: 'meeting_booked', label: 'Meeting Booked' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

const SOURCE_OPTIONS = [
  { value: '', label: 'All Sources' },
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'social', label: 'Social' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'advertisement', label: 'Advertisement' },
  { value: 'other', label: 'Other' },
];

const LEAD_FORM_SOURCES = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'social', label: 'Social' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'advertisement', label: 'Advertisement' },
  { value: 'other', label: 'Other' },
];

interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  source: LeadSource;
  assigned_to: string;
}

const initialFormData: LeadFormData = {
  name: '',
  email: '',
  phone: '',
  company: '',
  source: 'website',
  assigned_to: '',
};

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    count: 0,
    total_pages: 0,
    current_page: 1,
    page_size: 10,
    next: null as string | null,
    previous: null as string | null,
  });

  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState<LeadFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof LeadFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page: currentPage, page_size: 10 };
      if (statusFilter) params.status = statusFilter;
      if (sourceFilter) params.source = sourceFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await get<PaginatedResponse<Lead>>('/leads/', params);
      setLeads(res.data.results);
      setPagination(res.data.pagination);
    } catch {
      setError('Failed to load leads. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, sourceFilter, searchQuery]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const openCreateModal = () => {
    setEditingLead(null);
    setFormData(initialFormData);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email,
      phone: lead.phone || '',
      company: lead.company || '',
      source: lead.source,
      assigned_to: lead.assigned_to ? String(lead.assigned_to.id) : '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof LeadFormData, string>> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = 'Invalid email format';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        company: formData.company.trim() || null,
        source: formData.source,
      };
      if (formData.assigned_to) {
        payload.assigned_to = Number(formData.assigned_to);
      }

      if (editingLead) {
        await put(`/leads/${editingLead.id}/`, payload);
      } else {
        await post('/leads/', payload);
      }
      setIsModalOpen(false);
      fetchLeads();
    } catch {
      setFormErrors({ email: 'Failed to save lead. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingLead) return;
    setDeleting(true);
    try {
      await del(`/leads/${deletingLead.id}/`);
      setDeleteModalOpen(false);
      setDeletingLead(null);
      fetchLeads();
    } catch {
      setError('Failed to delete lead.');
    } finally {
      setDeleting(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and track your leads
            </p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Add Lead
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="All Statuses"
            className="w-full sm:w-44"
          />
          <Select
            options={SOURCE_OPTIONS}
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="All Sources"
            className="w-full sm:w-44"
          />
          <SearchInput
            value={searchQuery}
            onChange={(val) => {
              setSearchQuery(val);
              setCurrentPage(1);
            }}
            placeholder="Search leads..."
            className="w-full sm:w-64"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : leads.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No leads found"
            description={
              searchQuery || statusFilter || sourceFilter
                ? 'Try adjusting your filters'
                : 'Get started by adding your first lead'
            }
            action={
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4" />
                Add Lead
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <span className="flex items-center gap-1">
                      Name <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Company</TableHead>
                  <TableHead className="hidden md:table-cell">Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="hidden xl:table-cell">
                    Assigned To
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/leads/${lead.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar name={lead.name} size="sm" />
                        <span className="font-medium text-gray-900">
                          {lead.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500">{lead.email}</TableCell>
                    <TableCell className="hidden lg:table-cell text-gray-500">
                      {lead.company || '—'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="capitalize text-gray-500">
                        {lead.source.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={lead.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className={`h-full rounded-full transition-all ${
                              lead.score >= 70
                                ? 'bg-green-500'
                                : lead.score >= 40
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                            }`}
                            style={{ width: `${lead.score}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{lead.score}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {lead.assigned_to ? (
                        <div className="flex items-center gap-2">
                          <Avatar
                            name={`${lead.assigned_to.first_name} ${lead.assigned_to.last_name}`}
                            size="sm"
                          />
                          <span className="text-sm text-gray-700">
                            {lead.assigned_to.first_name}{' '}
                            {lead.assigned_to.last_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-gray-500">
                      {formatDate(lead.created_at)}
                    </TableCell>
                    <TableCell>
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(lead)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeletingLead(lead);
                            setDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * pagination.page_size + 1} to{' '}
                  {Math.min(
                    currentPage * pagination.page_size,
                    pagination.count
                  )}{' '}
                  of {pagination.count} leads
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {pagination.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === pagination.total_pages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Create / Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingLead ? 'Edit Lead' : 'Add New Lead'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              error={formErrors.name}
              placeholder="John Doe"
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              error={formErrors.email}
              placeholder="john@example.com"
            />
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="+1 (555) 000-0000"
            />
            <Input
              label="Company"
              value={formData.company}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, company: e.target.value }))
              }
              placeholder="Acme Corp"
            />
            <Select
              label="Source"
              options={LEAD_FORM_SOURCES}
              value={formData.source}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  source: e.target.value as LeadSource,
                }))
              }
            />
            <Input
              label="Assigned To (User ID)"
              value={formData.assigned_to}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  assigned_to: e.target.value,
                }))
              }
              placeholder="Optional user ID"
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting}>
                {editingLead ? 'Save Changes' : 'Create Lead'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Delete Lead"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete{' '}
              <strong>{deletingLead?.name}</strong>? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                isLoading={deleting}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
