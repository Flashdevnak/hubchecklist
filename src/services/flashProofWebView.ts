import { Capacitor, registerPlugin } from '@capacitor/core';
import type { FlashProofPluginResponse, FlashProofResult } from '../types';

interface FlashProofWebViewPlugin {
  openFlashProof(options: {
    url: string;
    phone: string;
    vehicleBarcode: string;
  }): Promise<FlashProofPluginResponse>;
  closeFlashProof(): Promise<{ success: boolean; status: string; message: string }>;
  getLastFlashProofResult(): Promise<FlashProofPluginResponse>;
  isFlashProofWebViewAvailable(): Promise<{ available: boolean; status: string; message: string }>;
}

const FlashProofWebView = registerPlugin<FlashProofWebViewPlugin>('FlashProofWebViewPlugin');

export function isNativeFlashWebViewAvailable(): boolean {
  return Capacitor.getPlatform() === 'android' && Capacitor.isNativePlatform();
}

export async function checkFlashProofWebViewAvailability() {
  if (!isNativeFlashWebViewAvailable()) {
    return {
      available: false,
      status: 'web_fallback',
      message: 'โหมดเว็บไม่สามารถกรอกเบอร์ในหน้า Flash อัตโนมัติได้ กรุณาคัดลอกเบอร์และเปิดลิงก์เอง',
    };
  }

  try {
    return await FlashProofWebView.isFlashProofWebViewAvailable();
  } catch {
    return {
      available: false,
      status: 'plugin_unavailable',
      message: 'ไม่พบ Android FlashProofWebViewPlugin ในแอปนี้',
    };
  }
}

export async function openFlashProofInWebView(options: {
  sourceUrl: string;
  vehicleBarcode: string;
  driverPhone: string;
}): Promise<FlashProofPluginResponse> {
  if (!isNativeFlashWebViewAvailable()) {
    return {
      success: false,
      status: 'unavailable',
      message: 'โหมดเว็บไม่สามารถกรอกเบอร์ในหน้า Flash อัตโนมัติได้ กรุณาคัดลอกเบอร์และเปิดลิงก์เอง',
    };
  }

  try {
    return await FlashProofWebView.openFlashProof({
      url: options.sourceUrl,
      phone: options.driverPhone,
      vehicleBarcode: options.vehicleBarcode,
    });
  } catch (error) {
    return {
      success: false,
      status: 'error',
      message: error instanceof Error ? error.message : 'เปิด Flash WebView ไม่สำเร็จ',
    };
  }
}

export async function getLastFlashProofResult(): Promise<FlashProofPluginResponse> {
  if (!isNativeFlashWebViewAvailable()) {
    return {
      success: false,
      status: 'unavailable',
      message: 'ไม่มีผลลัพธ์จาก Android WebView ในโหมดเว็บ',
    };
  }

  try {
    return await FlashProofWebView.getLastFlashProofResult();
  } catch {
    return {
      success: false,
      status: 'error',
      message: 'อ่านผลลัพธ์ล่าสุดจาก Flash WebView ไม่สำเร็จ',
    };
  }
}

export async function closeFlashProofWebView() {
  if (!isNativeFlashWebViewAvailable()) {
    return { success: false, status: 'unavailable', message: 'ไม่มี WebView ให้ปิดในโหมดเว็บ' };
  }

  return FlashProofWebView.closeFlashProof();
}

export function createUnavailableFlashResult(options: {
  sourceUrl: string;
  vehicleBarcode: string;
  driverPhone: string;
  message: string;
}): FlashProofResult {
  return {
    sourceUrl: options.sourceUrl,
    vehicleBarcode: options.vehicleBarcode,
    driverPhone: options.driverPhone,
    routeRows: [],
    rawText: '',
    status: 'unavailable',
    message: options.message,
    flashPageStatus: 'web_fallback',
    extractedAt: new Date().toISOString(),
  };
}
