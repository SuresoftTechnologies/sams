import { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Send, User, Edit2, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useUser } from '@/hooks/useAuth';
import { workflowService, type WorkflowComment } from '@/services/workflow-service';

interface WorkflowCommentsProps {
  workflowId: string;
}

export default function WorkflowComments({ workflowId }: WorkflowCommentsProps) {
  const user = useUser();
  const [comments, setComments] = useState<WorkflowComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadComments();
    // Set up polling for real-time updates
    const interval = setInterval(loadComments, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [workflowId]);

  const loadComments = async () => {
    try {
      const data = await workflowService.getWorkflowComments(workflowId);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) {
      toast.error('오류', {
        description: '메시지를 입력해주세요.',
      });
      return;
    }

    try {
      setIsSending(true);
      const comment = await workflowService.createWorkflowComment(workflowId, {
        comment: newComment.trim(),
      });
      setComments([comment, ...comments]);
      setNewComment('');
      toast.success('전송 완료', {
        description: '메시지가 전송되었습니다.',
      });
    } catch (error) {
      console.error('Failed to send comment:', error);
      toast.error('오류', {
        description: '메시지 전송에 실패했습니다.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editText.trim()) {
      toast.error('오류', {
        description: '메시지를 입력해주세요.',
      });
      return;
    }

    try {
      const updatedComment = await workflowService.updateWorkflowComment(
        workflowId,
        commentId,
        { comment: editText.trim() }
      );
      setComments(comments.map(c => c.id === commentId ? updatedComment : c));
      setEditingComment(null);
      setEditText('');
      toast.success('수정 완료', {
        description: '메시지가 수정되었습니다.',
      });
    } catch (error) {
      console.error('Failed to edit comment:', error);
      toast.error('오류', {
        description: '메시지 수정에 실패했습니다.',
      });
    }
  };

  const handleDeleteComment = async () => {
    if (!deleteCommentId) return;

    try {
      await workflowService.deleteWorkflowComment(workflowId, deleteCommentId);
      setComments(comments.filter(c => c.id !== deleteCommentId));
      setDeleteCommentId(null);
      toast.success('삭제 완료', {
        description: '메시지가 삭제되었습니다.',
      });
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('오류', {
        description: '메시지 삭제에 실패했습니다.',
      });
    }
  };

  const startEdit = (comment: WorkflowComment) => {
    setEditingComment(comment.id);
    setEditText(comment.comment);
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setEditText('');
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MM월 dd일 HH:mm', { locale: ko });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return '관리자';
      case 'manager':
        return '매니저';
      default:
        return '직원';
    }
  };

  return (
    <div className="space-y-4">
      {/* Comments List */}
      <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>아직 메시지가 없습니다.</p>
            <p className="text-sm mt-2">첫 메시지를 작성해보세요!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => {
              const isOwner = user?.id?.toString() === comment.user_id;
              const isEditing = editingComment === comment.id;

              return (
                <div
                  key={comment.id}
                  className={`flex gap-3 ${isOwner ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {comment.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`flex-1 max-w-[70%] ${
                      isOwner ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`flex items-center gap-2 mb-1 ${
                        isOwner ? 'justify-end' : ''
                      }`}
                    >
                      <span className="font-medium text-sm">
                        {comment.user.name}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getRoleBadgeColor(comment.user.role)}`}
                      >
                        {getRoleLabel(comment.user.role)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <div
                      className={`rounded-lg p-3 ${
                        isOwner
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-muted'
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="min-h-[60px] bg-background text-foreground"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleEditComment(comment.id)}
                            >
                              저장
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEdit}
                            >
                              취소
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="whitespace-pre-wrap">{comment.comment}</p>
                          {isOwner && (
                            <div className="flex gap-1 mt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => startEdit(comment)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => setDeleteCommentId(comment.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <Separator />

      {/* New Comment Input */}
      <div className="space-y-3">
        <Textarea
          placeholder="메시지를 입력하세요..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              handleSendComment();
            }
          }}
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            Ctrl+Enter로 전송할 수 있습니다
          </p>
          <Button
            onClick={handleSendComment}
            disabled={!newComment.trim() || isSending}
          >
            {isSending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            전송
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCommentId} onOpenChange={() => setDeleteCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>메시지를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 메시지가 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteComment}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}