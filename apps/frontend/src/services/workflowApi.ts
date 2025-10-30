/**
 * Workflow API Service
 */

import apiClient from '@/lib/apiClient';
import type { CreateWorkflowRequest, UpdateWorkflowRequest, Workflow, ApprovalRequest } from '@/types/workflow';
import type { PaginatedResponse } from '@/types/api';

export const workflowApi = {
  /**
   * Get paginated list of workflows
   */
  async getWorkflows(params?: {
    skip?: number;
    limit?: number;
    workflow_type?: string;
    status?: string;
    asset_id?: string;
  }): Promise<PaginatedResponse<Workflow>> {
    const response = await apiClient.get('/workflows', { params });
    return response.data;
  },

  /**
   * Get user's own workflows
   */
  async getMyRequests(params?: {
    skip?: number;
    limit?: number;
    workflow_type?: string;
    status?: string;
  }): Promise<PaginatedResponse<Workflow>> {
    const response = await apiClient.get('/workflows/my-requests', { params });
    return response.data;
  },

  /**
   * Get workflow by ID
   */
  async getWorkflow(id: string): Promise<Workflow> {
    const response = await apiClient.get(`/workflows/${id}`);
    return response.data;
  },

  /**
   * Create a new workflow
   */
  async createWorkflow(data: CreateWorkflowRequest): Promise<Workflow> {
    const response = await apiClient.post('/workflows', data);
    return response.data;
  },

  /**
   * Create checkout request (deprecated - use createWorkflow)
   */
  async createCheckout(data: {
    asset_id: string;
    reason?: string;
    expected_return_date?: string;
  }): Promise<Workflow> {
    const response = await apiClient.post('/workflows/checkout', data);
    return response.data;
  },

  /**
   * Create checkin request (deprecated - use createWorkflow)
   */
  async createCheckin(data: {
    asset_id: string;
    reason?: string;
  }): Promise<Workflow> {
    const response = await apiClient.post('/workflows/checkin', data);
    return response.data;
  },

  /**
   * Approve workflow
   */
  async approveWorkflow(id: string, data?: ApprovalRequest): Promise<Workflow> {
    const response = await apiClient.patch(`/workflows/${id}/approve`, data || {});
    return response.data;
  },

  /**
   * Reject workflow
   */
  async rejectWorkflow(id: string, reject_reason: string): Promise<Workflow> {
    const response = await apiClient.patch(`/workflows/${id}/reject`, reject_reason);
    return response.data;
  },

  /**
   * Cancel workflow
   */
  async cancelWorkflow(id: string): Promise<Workflow> {
    const response = await apiClient.patch(`/workflows/${id}/cancel`);
    return response.data;
  },

  /**
   * Update workflow
   */
  async updateWorkflow(id: string, data: UpdateWorkflowRequest): Promise<Workflow> {
    const response = await apiClient.patch(`/workflows/${id}`, data);
    return response.data;
  }
};