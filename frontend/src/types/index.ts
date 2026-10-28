export interface SensorInput {
  product_type: 'L' | 'M' | 'H';
  air_temperature: number;
  process_temperature: number;
  rotational_speed: number;
  torque: number;
  tool_wear: number;
}

export interface FeatureContribution {
  feature: string;
  value: number;
  importance_weight: number;
  status: 'normal' | 'warning' | 'critical';
  note: string;
}

export interface RuleAlert {
  rule_name: string;
  severity: 'Info' | 'Warning' | 'Critical';
  trigger_condition: string;
  explanation: string;
}

export interface PredictionResponse {
  failure_probability: number;
  calibrated_risk_score: number;
  risk_category: 'Low' | 'Moderate' | 'High' | 'Critical';
  predicted_failure_type: string | null;
  type_confidence: number | null;
  uncertainty_warning: string | null;
  warnings: string[];
  rule_alerts: RuleAlert[];
  feature_contributions: FeatureContribution[];
  recommended_action: string;
  timestamp: string;
}

export interface PredictionHistoryItem {
  id: number;
  timestamp: string;
  product_type: string;
  air_temperature: number;
  process_temperature: number;
  rotational_speed: number;
  torque: number;
  tool_wear: number;
  failure_probability: number;
  risk_score: number;
  risk_category: string;
  predicted_failure_type: string | null;
  confidence: number | null;
  warnings: string[];
  rule_alerts: any[];
  recommended_action: string | null;
}

export interface DatasetRecord {
  udi: number;
  product_id: string;
  type: string;
  air_temperature: number;
  process_temperature: number;
  rotational_speed: number;
  torque: number;
  tool_wear: number;
  target: number;
  failure_type: string;
  temp_diff: number;
  power_watts: number;
}

export interface DatasetSummary {
  total_records: number;
  normal_records: number;
  failure_records: number;
  failure_rate_percentage: number;
  product_type_distribution: Record<string, number>;
  failure_type_distribution: Record<string, number>;
  missing_values_count: number;
  numerical_summary: Record<string, {
    min: number;
    max: number;
    mean: number;
    std: number;
  }>;
}

export interface ScatterPoint {
  product_id: string;
  type: string;
  air_temp: number;
  torque: number;
  speed: number;
  tool_wear: number;
  is_failure: boolean;
  failure_type: string;
}

export interface DatasetAnalytics {
  breakdown_by_product_type: Record<string, Record<string, number>>;
  scatter_points: ScatterPoint[];
  correlation_matrix: Record<string, Record<string, number>>;
  tool_wear_distribution: Array<{
    bin: string;
    normal: number;
    failure: number;
  }>;
  mode_statistics: Record<string, {
    count: number;
    avg_torque: number;
    avg_speed: number;
    avg_tool_wear: number;
    avg_temp_diff: number;
  }>;
}

export interface ModelMetrics {
  model_name: string;
  version: string;
  trained_at: string;
  train_size: number;
  test_size: number;
  failure_cases_train: number;
  failure_cases_test: number;
  accuracy: number;
  balanced_accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  confusion_matrix: number[][];
  baseline_metrics: {
    logistic_regression: {
      accuracy: number;
      precision: number;
      recall: number;
      f1_score: number;
      roc_auc: number;
    };
    dummy_prior: {
      accuracy: number;
      precision: number;
      recall: number;
      f1_score: number;
    };
  };
  multiclass_metrics?: {
    failure_subset_test_size: number;
    test_accuracy: number;
    classes: string[];
    test_classification_report: any;
  };
  feature_names: string[];
  class_weights_used: string;
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number;
  description: string;
}

export interface MaintenanceRecord {
  id: number;
  asset_id: string;
  issue_observed: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assigned_technician: string;
  action_taken: string | null;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Under Review';
  source: string;
  created_at: string;
  updated_at: string;
}

export interface SystemSettings {
  system_name: string;
  version: string;
  tagline: string;
  operating_modes: Array<{
    id: string;
    name: string;
    active: boolean;
    description: string;
  }>;
  active_mode: string;
  hardware_connected: boolean;
  hardware_warning: string;
  thresholds: {
    low: number;
    moderate: number;
    high: number;
    critical: number;
  };
  threshold_note: string;
}
