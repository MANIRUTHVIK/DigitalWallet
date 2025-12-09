export const VITAL_TYPES = {
  BLOOD_PRESSURE: "blood_pressure",
  HEART_RATE: "heart_rate",
  SPO2: "spo2",
  BLOOD_SUGAR: "blood_sugar",
  HEMOGLOBIN: "hemoglobin",
  CHOLESTEROL: "cholesterol",
} as const;

export const VITAL_UNITS = {
  [VITAL_TYPES.BLOOD_PRESSURE]: "mmHg",
  [VITAL_TYPES.HEART_RATE]: "bpm",
  [VITAL_TYPES.SPO2]: "%",
  [VITAL_TYPES.BLOOD_SUGAR]: "mg/dL",
  [VITAL_TYPES.HEMOGLOBIN]: "g/dL",
  [VITAL_TYPES.CHOLESTEROL]: "mg/dL",
} as const;

export const VITAL_LABELS = {
  [VITAL_TYPES.BLOOD_PRESSURE]: "Blood Pressure",
  [VITAL_TYPES.HEART_RATE]: "Heart Rate",
  [VITAL_TYPES.SPO2]: "SpO2",
  [VITAL_TYPES.BLOOD_SUGAR]: "Blood Sugar",
  [VITAL_TYPES.HEMOGLOBIN]: "Hemoglobin",
  [VITAL_TYPES.CHOLESTEROL]: "Cholesterol",
} as const;

export const FILE_TYPES = {
  PDF: "pdf",
  IMAGE: "image",
} as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
