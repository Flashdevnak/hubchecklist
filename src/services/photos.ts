import type { PhotoType, PhotoUploadStatus, VehiclePhoto, VehicleRecord } from '../types';
import { getVehicleRecordById, getRequiredPhotosForChecklist, updateVehicleRecord } from './vehicleRecords';

const VEHICLE_PHOTOS_KEY = 'hubchecklist.vehiclePhotos';
const SIGNED_UPLOAD_ENDPOINT = import.meta.env.VITE_R2_SIGNED_UPLOAD_ENDPOINT?.trim();
const R2_PUBLIC_BASE_URL = import.meta.env.VITE_R2_PUBLIC_BASE_URL?.trim();

export const PHOTO_TYPE_LABELS: Record<PhotoType, string> = {
  loadingPhoto: 'รูปถ่ายการบรรทุก',
  dropPhotoAfterDeparture: 'รูป Drop หลังปล่อยรถ',
  branchDropPhoto1: 'รูปสาขาที่พ่วง 1',
  branchDropPhoto2: 'รูปสาขาที่พ่วง 2',
};

export function getRequiredPhotoTypes(record: VehicleRecord): PhotoType[] {
  return getRequiredPhotosForChecklist(record.checklistType) as PhotoType[];
}

export function listPhotosForRecord(recordId: string): VehiclePhoto[] {
  return readPhotos().filter((photo) => photo.recordId === recordId && !photo.deletedAt);
}

export function getPhotoByType(recordId: string, photoType: PhotoType): VehiclePhoto | null {
  return listPhotosForRecord(recordId).find((photo) => photo.photoType === photoType) ?? null;
}

export async function savePhotoLocal(record: VehicleRecord, photoType: PhotoType, file: File): Promise<VehiclePhoto> {
  const compressed = await compressPhoto(file);
  const now = new Date().toISOString();
  const photoId = createId();
  const localStorageKey = `hubchecklist.vehiclePhotoBlob.${photoId}`;
  const previous = getPhotoByType(record.id, photoType);
  const uploadStatus: PhotoUploadStatus = getPhotoStorageMode().mode === 'r2_signed_upload' ? 'PENDING_UPLOAD' : 'LOCAL_ONLY';
  const photo: VehiclePhoto = {
    id: photoId,
    recordId: record.id,
    vehicleBarcode: record.vehicleBarcode,
    workDate: record.workDate,
    branch: record.branch,
    responsibleEmployeeCode: record.responsibleEmployeeCode,
    responsibleDisplayName: record.responsibleDisplayName,
    photoType,
    localObjectUrl: compressed.dataUrl,
    localStorageKey,
    fileName: compressed.fileName,
    mimeType: compressed.mimeType,
    sizeBytes: compressed.sizeBytes,
    originalSizeBytes: file.size,
    width: compressed.width,
    height: compressed.height,
    capturedAt: now,
    capturedBy: record.responsibleEmployeeCode,
    uploadStatus,
    backedUp: false,
    cloudDeleted: false,
    createdAt: now,
    updatedAt: now,
    replacedPhotoId: previous?.id,
  };

  window.localStorage.setItem(localStorageKey, compressed.dataUrl);
  upsertPhoto(photo);
  updateRecordStatusFromPhotos(record.id);

  if (uploadStatus === 'PENDING_UPLOAD') {
    uploadPhotoToR2(photo).catch(() => undefined);
  }

  return photo;
}

export async function compressPhoto(file: File, options: {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/webp';
} = {}) {
  const image = await loadImage(file);
  const maxWidth = options.maxWidth ?? 1600;
  const maxHeight = options.maxHeight ?? 1600;
  const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('ไม่สามารถบีบอัดรูปได้');
  context.drawImage(image, 0, 0, width, height);

  let quality = options.quality ?? 0.74;
  const mimeType = options.mimeType ?? 'image/jpeg';
  let dataUrl = canvas.toDataURL(mimeType, quality);
  while (dataUrlToBytes(dataUrl) > 500 * 1024 && quality > 0.42) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL(mimeType, quality);
  }

  return {
    dataUrl,
    fileName: file.name.replace(/\.[^.]+$/, '') + (mimeType === 'image/webp' ? '.webp' : '.jpg'),
    mimeType,
    sizeBytes: dataUrlToBytes(dataUrl),
    width,
    height,
  };
}

export async function uploadPhotoToR2(photo: VehiclePhoto): Promise<VehiclePhoto> {
  if (!SIGNED_UPLOAD_ENDPOINT) {
    return markPhotoUploadFailed(photo.id, 'ยังไม่ได้ตั้งค่า signed upload');
  }

  const uploading = { ...photo, uploadStatus: 'UPLOADING' as PhotoUploadStatus, updatedAt: new Date().toISOString() };
  upsertPhoto(uploading);

  try {
    const signedResponse = await fetch(SIGNED_UPLOAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recordId: photo.recordId,
        photoType: photo.photoType,
        fileName: photo.fileName,
        mimeType: photo.mimeType,
      }),
    });
    if (!signedResponse.ok) throw new Error('signed upload endpoint failed');
    const signed = await signedResponse.json() as { uploadUrl?: string; objectKey?: string };
    if (!signed.uploadUrl || !signed.objectKey) throw new Error('signed upload response incomplete');
    const blob = dataUrlToBlob(photo.localObjectUrl ?? window.localStorage.getItem(photo.localStorageKey) ?? '');
    const uploadResponse = await fetch(signed.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': photo.mimeType },
      body: blob,
    });
    if (!uploadResponse.ok) throw new Error('R2 upload failed');
    return markPhotoUploaded(photo.id, signed.objectKey);
  } catch (error) {
    return markPhotoUploadFailed(photo.id, error instanceof Error ? error.message : 'R2 upload failed');
  }
}

export function markPhotoUploaded(photoId: string, objectKey: string): VehiclePhoto {
  const photo = getPhotoById(photoId);
  if (!photo) throw new Error('ไม่พบรูป');
  const updated: VehiclePhoto = {
    ...photo,
    objectKey,
    localObjectUrl: photo.localObjectUrl,
    uploadStatus: 'UPLOADED',
    uploadError: undefined,
    updatedAt: new Date().toISOString(),
  };
  if (R2_PUBLIC_BASE_URL) {
    updated.localObjectUrl = updated.localObjectUrl ?? `${R2_PUBLIC_BASE_URL.replace(/\/$/, '')}/${objectKey}`;
  }
  upsertPhoto(updated);
  return updated;
}

export function markPhotoUploadFailed(photoId: string, error: string): VehiclePhoto {
  const photo = getPhotoById(photoId);
  if (!photo) throw new Error('ไม่พบรูป');
  const updated = { ...photo, uploadStatus: 'UPLOAD_FAILED' as PhotoUploadStatus, uploadError: error, updatedAt: new Date().toISOString() };
  upsertPhoto(updated);
  return updated;
}

export function retakePhoto(record: VehicleRecord, photoType: PhotoType, file: File): Promise<VehiclePhoto> {
  return savePhotoLocal(record, photoType, file);
}

export function getPhotoCompletionStatus(record: VehicleRecord) {
  const required = getRequiredPhotoTypes(record);
  const photos = listPhotosForRecord(record.id);
  const completedTypes = required.filter((type) => photos.some((photo) => photo.photoType === type));
  const missingTypes = required.filter((type) => !completedTypes.includes(type));
  return {
    required,
    photos,
    completedTypes,
    missingTypes,
    completeCount: completedTypes.length,
    requiredCount: required.length,
    isComplete: missingTypes.length === 0,
  };
}

export function updateRecordStatusFromPhotos(recordId: string): VehicleRecord | null {
  const record = getVehicleRecordById(recordId);
  if (!record || record.status === 'VOIDED') return record;
  const completion = getPhotoCompletionStatus(record);
  return updateVehicleRecord(record.id, {
    status: completion.isComplete ? 'COMPLETE' : 'PENDING_PHOTO',
  }, 'photo completion status');
}

export function getPhotoStorageMode() {
  return SIGNED_UPLOAD_ENDPOINT
    ? { mode: 'r2_signed_upload' as const, message: 'ตั้งค่า signed upload endpoint แล้ว' }
    : { mode: 'local_only' as const, message: 'เก็บรูปในเครื่อง / ยังไม่ได้เชื่อม R2' };
}

function getPhotoById(photoId: string): VehiclePhoto | null {
  return readPhotos().find((photo) => photo.id === photoId) ?? null;
}

function upsertPhoto(photo: VehiclePhoto): void {
  const photos = readPhotos().filter((item) => item.id !== photo.id);
  photos.push(photo);
  window.localStorage.setItem(VEHICLE_PHOTOS_KEY, JSON.stringify(photos));
}

function readPhotos(): VehiclePhoto[] {
  const rawValue = window.localStorage.getItem(VEHICLE_PHOTOS_KEY);
  if (!rawValue) return [];
  try {
    return JSON.parse(rawValue) as VehiclePhoto[];
  } catch {
    return [];
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('อ่านรูปไม่สำเร็จ'));
    image.src = URL.createObjectURL(file);
  });
}

function dataUrlToBytes(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? '';
  return Math.round((base64.length * 3) / 4);
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mimeType = header.match(/data:(.*);base64/)?.[1] ?? 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

function createId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
