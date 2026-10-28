import {
  SensorInput,
  PredictionResponse,
  PredictionHistoryItem,
  DatasetSummary,
  DatasetRecord,
  DatasetAnalytics,
  ModelMetrics,
  FeatureImportanceItem,
  MaintenanceRecord,
  SystemSettings
} from '../types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let errorDetail = `HTTP Error ${res.status}: ${res.statusText}`;
    try {
      const errObj = await res.json();
      if (errObj && errObj.detail) {
        errorDetail = typeof errObj.detail === 'string' ? errObj.detail : JSON.stringify(errObj.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export const apiService = {
  // Health
  getHealth: () => fetchJson<any>('/health'),

  // Dataset
  getDatasetSummary: () => fetchJson<DatasetSummary>('/dataset/summary'),

  getDatasetRecords: (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    product_type?: string;
    failure_type?: string;
    target?: number;
    min_speed?: number;
    max_speed?: number;
    min_torque?: number;
    max_torque?: number;
    sort_by?: string;
    sort_order?: string;
  }) => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          q.append(key, String(val));
        }
      });
    }
    return fetchJson<{
      records: DatasetRecord[];
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
    }>(`/dataset/records?${q.toString()}`);
  },

  getRecordByProductId: (productId: string) =>
    fetchJson<DatasetRecord>(`/dataset/records/${encodeURIComponent(productId)}`),

  getDatasetAnalytics: () => fetchJson<DatasetAnalytics>('/dataset/analytics'),

  // Predict
  predict: (data: SensorInput) =>
    fetchJson<PredictionResponse>('/predict', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getPredictionHistory: (limit = 25, riskCategory?: string) => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (riskCategory && riskCategory !== 'ALL') q.append('risk_category', riskCategory);
    return fetchJson<PredictionHistoryItem[]>(`/predictions/history?${q.toString()}`);
  },

  clearPredictionHistory: () =>
    fetchJson<{ message: string; deleted_count: number }>('/predictions/history', {
      method: 'DELETE',
    }),

  // Model Lab
  getModelMetrics: () => fetchJson<ModelMetrics>('/model/metrics'),

  getFeatureImportance: () =>
    fetchJson<{
      model_name: string;
      feature_importances: FeatureImportanceItem[];
      calculation_method: string;
    }>('/model/feature-importance'),

  retrainModel: () =>
    fetchJson<{
      status: string;
      message: string;
      updated_at: string;
      metrics: ModelMetrics;
    }>('/model/retrain', { method: 'POST' }),

  // Maintenance Work Orders
  getMaintenanceRecords: (params?: { status?: string; priority?: string; asset_id?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          q.append(key, String(val));
        }
      });
    }
    return fetchJson<MaintenanceRecord[]>(`/maintenance?${q.toString()}`);
  },

  createMaintenanceRecord: (data: {
    asset_id: string;
    issue_observed: string;
    priority?: string;
    assigned_technician?: string;
    action_taken?: string;
    status?: string;
    source?: string;
  }) =>
    fetchJson<MaintenanceRecord>('/maintenance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMaintenanceRecord: (
    id: number,
    data: {
      issue_observed?: string;
      priority?: string;
      assigned_technician?: string;
      action_taken?: string;
      status?: string;
    }
  ) =>
    fetchJson<MaintenanceRecord>(`/maintenance/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteMaintenanceRecord: (id: number) =>
    fetchJson<{ message: string }>(`/maintenance/${id}`, {
      method: 'DELETE',
    }),

  // Settings
  getSystemSettings: () => fetchJson<SystemSettings>('/settings'),

  updateThresholds: (thresholds: {
    threshold_low: number;
    threshold_moderate: number;
    threshold_high: number;
    threshold_critical: number;
  }) =>
    fetchJson<{
      status: string;
      message: string;
      updated_thresholds: any;
    }>('/settings/thresholds', {
      method: 'POST',
      body: JSON.stringify(thresholds),
    }),
};
