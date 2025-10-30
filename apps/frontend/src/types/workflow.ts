/**
 * Workflow Type Definitions
 */

export type WorkflowType = 'checkout' | 'checkin' | 'transfer' | 'maintenance' | 'rental' | 'return' | 'disposal';
export type WorkflowStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';

export interface Workflow {
  id: string;
  type: WorkflowType;
  status: WorkflowStatus;
  asset_id: string;
  requester_id: string;
  assignee_id?: string | null;
  approver_id?: string | null;
  reason?: string | null;
  expected_return_date?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  reject_reason?: string | null;
  completed_at?: string | null;
  completion_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkflowRequest {
  type: WorkflowType;
  asset_id: string;
  assignee_id?: string | null;
  reason?: string | null;
  expected_return_date?: string | null;
}

export interface UpdateWorkflowRequest {
  status?: WorkflowStatus;
  reject_reason?: string | null;
  completion_notes?: string | null;
}

export interface ApprovalRequest {
  comment?: string | null;
}

export const WorkflowTypeLabels: Record<WorkflowType, string> = {
  checkout: '반출',
  checkin: '반입',
  transfer: '이관',
  maintenance: '유지보수',
  rental: '대여',
  return: '반납',
  disposal: '불용처리'
};

export const WorkflowStatusLabels: Record<WorkflowStatus, string> = {
  pending: '대기중',
  approved: '승인됨',
  rejected: '거절됨',
  cancelled: '취소됨',
  completed: '완료됨'
};

export const WorkflowStatusColors: Record<WorkflowStatus, string> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'default',
  completed: 'info'
};