/**
 * Workflow-related types and enums
 */

/**
 * Workflow type enum
 */
export enum WorkflowType {
  CHECKOUT = 'checkout', // 반출
  CHECKIN = 'checkin', // 반납
}

/**
 * Workflow status enum
 */
export enum WorkflowStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

/**
 * Workflow entity interface
 */
export interface Workflow {
  id: string;
  type: WorkflowType;
  status: WorkflowStatus;
  assetId: string;
  requesterId: string;
  assigneeId?: string | null;
  requestedDate: Date;
  expectedReturnDate?: Date | null;
  actualReturnDate?: Date | null;
  reason?: string;
  rejectReason?: string;
  approvedAt?: Date | null;
  approvedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Workflow with relations
 */
export interface WorkflowWithRelations extends Workflow {
  asset: {
    id: string;
    assetTag: string;
    name: string;
    model?: string;
  };
  requester: {
    id: string;
    name: string;
    email: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
  } | null;
  approver?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

/**
 * Create workflow DTO (checkout)
 */
export interface CreateCheckoutDto {
  assetId: string;
  assigneeId: string;
  requestedDate?: Date;
  expectedReturnDate?: Date;
  reason?: string;
}

/**
 * Create workflow DTO (checkin)
 */
export interface CreateCheckinDto {
  assetId: string;
  requestedDate?: Date;
  reason?: string;
}

/**
 * Approve workflow DTO
 */
export interface ApproveWorkflowDto {
  comment?: string;
}

/**
 * Reject workflow DTO
 */
export interface RejectWorkflowDto {
  reason: string;
}

/**
 * Workflow filter params
 */
export interface WorkflowFilterParams {
  type?: WorkflowType;
  status?: WorkflowStatus;
  requesterId?: string;
  assetId?: string;
  search?: string;
}

/**
 * Approval entity
 */
export interface Approval {
  id: string;
  workflowId: string;
  approverId: string;
  status: WorkflowStatus;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}
