import { authStorage } from '@/lib/auth-storage';
import type { AnalyzeReceiptFromImageResponse, OcrMethod } from '@/types/receipt';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface AnalyzeReceiptOptions {
  file?: File | null;
  imageUrl?: string | null;
  ocrMethod?: OcrMethod;
}

export async function analyzeReceiptFromImage(options: AnalyzeReceiptOptions): Promise<AnalyzeReceiptFromImageResponse> {
  const { file, imageUrl, ocrMethod = 'deepseek' } = options;

  if (!file && !imageUrl) {
    throw new Error('파일 또는 이미지 URL 중 하나는 반드시 제공해야 합니다.');
  }

  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  }
  if (imageUrl) {
    formData.append('image_url', imageUrl);
  }
  formData.append('ocr_method', ocrMethod);

  const token = authStorage.getAccessToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/receipts/analyze-receipt`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    const detail = typeof error?.detail === 'string' ? error.detail : '영수증 분석 요청에 실패했습니다.';
    throw new Error(detail);
  }

  return response.json();
}

