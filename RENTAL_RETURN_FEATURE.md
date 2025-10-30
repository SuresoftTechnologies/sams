# Asset Rental and Return Feature Implementation

## Overview
This document describes the complete implementation of the asset rental and return functionality for the AMS (Asset Management System). The feature allows employees to request rental of available assets and return assets they have borrowed.

## Implementation Status: COMPLETE ✅

## 1. Backend Implementation

### A. Database Schema Updates

#### Workflow Types (Updated)
```python
class WorkflowType(str, Enum):
    CHECKOUT = "checkout"
    CHECKIN = "checkin"
    TRANSFER = "transfer"
    MAINTENANCE = "maintenance"
    RENTAL = "rental"      # NEW: Rental request for loaned assets
    RETURN = "return"      # NEW: Return request for borrowed assets
    DISPOSAL = "disposal"  # NEW: Disposal request for old assets
```

### B. API Endpoints

#### Create Workflow Endpoint
- **Path**: `POST /api/v1/workflows`
- **Purpose**: Create new workflow requests (rental, return, disposal, maintenance)
- **Request Body**:
```json
{
  "type": "rental",
  "asset_id": "asset-uuid",
  "reason": "프로젝트 진행을 위한 노트북 대여",
  "expected_return_date": "2024-12-31T00:00:00Z"
}
```

#### Validation Logic
1. **RENTAL Workflow**:
   - Asset must have status = 'loaned' (대여용)
   - Asset must not be assigned to anyone (assigned_to = null)
   - Expected return date is required
   - Only employees can create rental requests

2. **RETURN Workflow**:
   - Asset must be assigned to the requesting user
   - Only employees can create return requests
   - Reason is optional

### C. Approval Processing
When workflows are approved:
- **RENTAL**: Asset's `assigned_to` is set to the requester
- **RETURN**: Asset's `assigned_to` is set to null (making it available again)
- History entries are created for audit trail

### D. Files Modified/Created
- `/apps/backend/src/models/workflow.py` - Added new workflow types
- `/apps/backend/src/schemas/workflow.py` - Updated schema with new types
- `/apps/backend/src/api/v1/endpoints/workflows.py` - Added POST endpoint and validation logic
- `/apps/backend/alembic/versions/20251031_0336-cb29c8bac60f_add_rental_return_workflow_types.py` - Migration file

## 2. Frontend Implementation

### A. Type Definitions

#### New Type Files
- `/apps/frontend/src/types/workflow.ts` - Complete workflow type definitions
```typescript
export type WorkflowType = 'checkout' | 'checkin' | 'transfer' |
                          'maintenance' | 'rental' | 'return' | 'disposal';

export interface CreateWorkflowRequest {
  type: WorkflowType;
  asset_id: string;
  reason?: string | null;
  expected_return_date?: string | null;
}
```

### B. Dialog Components

#### RentalDialog Component
- **Path**: `/apps/frontend/src/components/dialogs/RentalDialog.tsx`
- **Features**:
  - Form validation with Zod schema
  - Required fields: reason, expected_return_date
  - Date picker for return date (must be future date)
  - Success toast on completion
  - Error handling with user-friendly messages

#### ReturnDialog Component
- **Path**: `/apps/frontend/src/components/dialogs/ReturnDialog.tsx`
- **Features**:
  - Simplified form with optional reason field
  - Success toast on completion
  - Error handling

### C. API Service
- **Path**: `/apps/frontend/src/services/workflowApi.ts`
- Complete API client for workflow operations
- Methods: createWorkflow, getWorkflows, approveWorkflow, etc.

### D. Assets Page Updates
- **Path**: `/apps/frontend/src/pages/Assets.tsx`
- Added rental/return buttons to asset table
- Button visibility logic:
  - "대여 신청" button shown when:
    - Asset status is 'loaned'
    - Asset is not assigned to anyone
    - Current user is an employee
  - "반납 신청" button shown when:
    - Asset is assigned to current user
    - Current user is an employee
- Integrated dialog components
- Tooltips for better UX

### E. Files Modified/Created
- `/apps/frontend/src/types/api.ts` - Updated Asset interface
- `/apps/frontend/src/types/workflow.ts` - New workflow types
- `/apps/frontend/src/services/workflowApi.ts` - API service
- `/apps/frontend/src/components/dialogs/RentalDialog.tsx` - Rental dialog
- `/apps/frontend/src/components/dialogs/ReturnDialog.tsx` - Return dialog
- `/apps/frontend/src/pages/Assets.tsx` - Updated assets page

## 3. Workflow Process

### Rental Workflow
1. Employee views asset list
2. Identifies available asset (status='loaned', not assigned)
3. Clicks "대여 신청" button
4. Fills out rental form:
   - Enters reason for rental
   - Selects expected return date
5. Submits request → Creates workflow with status='pending'
6. Manager/Admin reviews and approves request
7. Asset is assigned to the employee
8. Asset history is updated

### Return Workflow
1. Employee views asset list
2. Sees "반납 신청" button for assets assigned to them
3. Clicks button and optionally enters return reason
4. Submits request → Creates workflow with status='pending'
5. Manager/Admin reviews and approves request
6. Asset assignment is cleared
7. Asset becomes available for others to rent
8. Asset history is updated

## 4. Testing Instructions

### Backend Testing
```bash
# Run migrations
cd apps/backend
.venv/bin/python -m alembic upgrade head

# Start backend server
.venv/bin/python -m uvicorn src.main:app --reload

# Test with provided script
.venv/bin/python test_rental_return.py
```

### Frontend Testing
```bash
# Start frontend
cd apps/frontend
npm run dev
```

### Manual Testing Steps
1. Login as an employee user
2. Navigate to Assets page
3. Find assets with status "대여용" (loaned)
4. Click "대여 신청" button on available assets
5. Fill form and submit
6. Login as manager/admin
7. Navigate to Requests page
8. Approve the rental request
9. Login back as employee
10. Verify asset now shows "반납 신청" button
11. Click "반납 신청" and submit
12. Manager approves return
13. Asset becomes available again

## 5. Validation Rules

### Rental Request Validation
- ✅ Asset must exist
- ✅ Asset status must be 'loaned'
- ✅ Asset must not be assigned to anyone
- ✅ Expected return date is required
- ✅ Expected return date must be in the future
- ✅ Only employees can create rental requests

### Return Request Validation
- ✅ Asset must exist
- ✅ Asset must be assigned to the requesting user
- ✅ Only employees can create return requests

## 6. Error Messages

### Korean Error Messages
- **Asset not available for rental**: "이 자산은 대여할 수 없습니다. 대여용 자산만 대여 가능합니다."
- **Asset already rented**: "이 자산은 이미 대여 중입니다."
- **Return date required**: "대여 신청 시 반납 예정일은 필수입니다."
- **Cannot return asset**: "본인이 대여한 자산만 반납할 수 있습니다."
- **Success - Rental**: "대여 신청이 완료되었습니다."
- **Success - Return**: "반납 신청이 완료되었습니다."

## 7. Edge Cases Handled

1. **Concurrent Requests**: Database constraints prevent multiple users from renting the same asset
2. **Invalid Status Transitions**: Validation ensures assets can only be rented when available
3. **User Permissions**: Role-based access control ensures only employees can rent/return
4. **Date Validation**: Past dates cannot be selected for expected return date
5. **Form Validation**: All required fields are validated before submission
6. **Network Errors**: Proper error handling and user feedback

## 8. Future Enhancements

1. **Email Notifications**: Send emails when requests are created/approved
2. **Overdue Tracking**: Track and alert for overdue rentals
3. **Bulk Operations**: Allow multiple assets to be requested at once
4. **Request History**: Show rental/return history in asset details
5. **Auto-approval Rules**: Automatically approve requests based on criteria
6. **Mobile App Support**: Optimize dialogs for mobile devices

## 9. Database Relationships

```
Workflow
├── asset_id → Asset
├── requester_id → User
├── assignee_id → User (for rentals)
└── approver_id → User (when approved)

Asset
├── assigned_to → User (current holder)
└── status (enum: loaned, issued, etc.)
```

## 10. Security Considerations

- ✅ Authentication required for all workflow endpoints
- ✅ Authorization checks for user roles
- ✅ Input validation on both frontend and backend
- ✅ SQL injection prevention through ORM
- ✅ XSS prevention through React's built-in protections
- ✅ CSRF protection through token-based auth

## Implementation Complete!
The rental and return feature is fully implemented and ready for production use.