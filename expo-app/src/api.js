// Shared API config for the Expo app.
// apiBaseUrl comes from app.json → expo.extra (override per build/profile).

import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const extra = Constants.expoConfig?.extra || {};

export const API_BASE = 'https://odyssey-iua-2026-1.onrender.com';

const DEVICE_KEY = 'jg_device_id';
let _deviceId = null;

export async function getDeviceId() {
  if (_deviceId) return _deviceId;
  try {
    let id = await AsyncStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = `mob-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      await AsyncStorage.setItem(DEVICE_KEY, id);
    }
    _deviceId = id;
  } catch {
    _deviceId = `mob-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
  return _deviceId;
}

export function getDeviceIdSync() {
  return _deviceId || '';
}

let _accessToken = null;
export function setAccessToken(token) { _accessToken = token; }
export function getAccessToken() { return _accessToken; }

export function authHeaders(extraHeaders = {}) {
  const headers = { 'ngrok-skip-browser-warning': '1', ...extraHeaders };
  if (_deviceId) headers['X-Device-Id'] = _deviceId;
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`;
  return headers;
}
