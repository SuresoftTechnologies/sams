export type OcrMethod = 'deepseek';

export interface ReceiptLineItem {
  item_type: string;
  name: string;
  quantity: number;
  unit_price?: string | null;
  model?: string | null;
  specifications?: string | null;
}

export interface ReceiptAnalysisResult {
  document_type: string;
  purchase_date?: string | null;
  supplier?: string | null;
  line_items: ReceiptLineItem[];
  confidence: number;
  raw_data?: Record<string, unknown> | null;
}

export interface AnalyzeReceiptFromImageResponse {
  extracted_text: string;
  analysis: ReceiptAnalysisResult;
  ocr_method: OcrMethod;
  suggested_name: string;
  suggested_notes?: string | null;
  suggested_category_code?: string | null;
  processing_time: number;
  warnings: string[];
}

