import { authStorage } from '@/lib/auth-storage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Helper function to make authenticated requests
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = authStorage.getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: response.statusText,
    }));
    throw new Error(error.detail || 'API request failed');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export interface WorkflowPaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

export type WorkflowType = 'checkout' | 'checkin' | 'transfer' | 'maintenance' | 'rental' | 'return' | 'disposal';
export type WorkflowStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Asset {
  id: string;
  name: string;
  asset_code: string;
  model: string;
  manufacturer: string;
  category_id: string;
}

export interface Workflow {
  id: string;
  type: WorkflowType;
  status: WorkflowStatus;
  asset_id: string;
  asset?: Asset;
  requester_id: string;
  requester?: User;
  assignee_id?: string;
  assignee?: User;
  approver_id?: string;
  approver?: User;
  reason?: string;
  expected_return_date?: string;
  approved_at?: string;
  rejected_at?: string;
  reject_reason?: string;
  completed_at?: string;
  completion_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowComment {
  id: string;
  workflow_id: string;
  user_id: string;
  user: User;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkflowCommentRequest {
  comment: string;
}

export interface UpdateWorkflowCommentRequest {
  comment: string;
}

interface WorkflowFilters {
  skip?: number;
  limit?: number;
  workflow_type?: WorkflowType;
  status?: WorkflowStatus;
}

export interface CreateWorkflowRequest {
  type: WorkflowType;
  asset_id: string;
  reason?: string;
  expected_return_date?: string;
}

export interface CreateCheckoutRequest {
  asset_id: string;
  assignee_id?: string;
  reason?: string;
  expected_return_date?: string;
}

export interface CreateCheckinRequest {
  asset_id: string;
  reason?: string;
}

class WorkflowService {
  /**
   * Get all workflows for the current user (my requests)
   */
  async getMyRequests(filters: WorkflowFilters = {}): Promise<WorkflowPaginatedResponse<Workflow>> {
    const params = new URLSearchParams();
    if (filters.skip !== undefined) params.append('skip', filters.skip.toString());
    if (filters.limit !== undefined) params.append('limit', filters.limit.toString());
    if (filters.workflow_type) params.append('workflow_type', filters.workflow_type);
    if (filters.status) params.append('status', filters.status);

    return fetchWithAuth(`/api/v1/workflows/my-requests?${params.toString()}`);
  }

  /**
   * Get all workflows (for admin/manager)
   */
  async getAllWorkflows(filters: WorkflowFilters = {}): Promise<WorkflowPaginatedResponse<Workflow>> {
    const params = new URLSearchParams();
    if (filters.skip !== undefined) params.append('skip', filters.skip.toString());
    if (filters.limit !== undefined) params.append('limit', filters.limit.toString());
    if (filters.workflow_type) params.append('workflow_type', filters.workflow_type);
    if (filters.status) params.append('status', filters.status);

    return fetchWithAuth(`/api/v1/workflows?${params.toString()}`);
  }

  /**
   * Get workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<Workflow> {
    return fetchWithAuth(`/api/v1/workflows/${workflowId}`);
  }

  /**
   * Get comments for a workflow
   */
  async getWorkflowComments(
    workflowId: string,
    skip = 0,
    limit = 100
  ): Promise<WorkflowComment[]> {
    return fetchWithAuth(`/api/v1/workflows/${workflowId}/comments?skip=${skip}&limit=${limit}`);
  }

  /**
   * Create a new comment on a workflow
   */
  async createWorkflowComment(
    workflowId: string,
    data: CreateWorkflowCommentRequest
  ): Promise<WorkflowComment> {
    return fetchWithAuth(`/api/v1/workflows/${workflowId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update a workflow comment
   */
  async updateWorkflowComment(
    workflowId: string,
    commentId: string,
    data: UpdateWorkflowCommentRequest
  ): Promise<WorkflowComment> {
    return fetchWithAuth(`/api/v1/workflows/${workflowId}/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a workflow comment
   */
  async deleteWorkflowComment(workflowId: string, commentId: string): Promise<void> {
    return fetchWithAuth(`/api/v1/workflows/${workflowId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Approve a workflow
   */
  async approveWorkflow(workflowId: string, comment?: string): Promise<Workflow> {
    return fetchWithAuth(`/api/v1/workflows/${workflowId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  }

  /**
   * Reject a workflow
   */
  async rejectWorkflow(workflowId: string, reason: string): Promise<Workflow> {
    return fetchWithAuth(`/api/v1/workflows/${workflowId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  /**
   * Cancel a workflow
   */
  async cancelWorkflow(workflowId: string): Promise<Workflow> {
    return fetchWithAuth(`/api/v1/workflows/${workflowId}/cancel`, {
      method: 'POST',
    });
  }

  /**
   * Create a new workflow request
   */
  async createWorkflow(data: CreateWorkflowRequest): Promise<Workflow> {
    return fetchWithAuth('/api/v1/workflows', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Create a checkout workflow
   */
  async createCheckout(data: CreateCheckoutRequest): Promise<Workflow> {
    return fetchWithAuth('/api/v1/workflows/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Create a checkin workflow
   */
  async createCheckin(data: CreateCheckinRequest): Promise<Workflow> {
    return fetchWithAuth('/api/v1/workflows/checkin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const workflowService = new WorkflowService();