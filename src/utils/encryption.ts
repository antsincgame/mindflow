import EncryptedStorage from 'react-native-encrypted-storage';
import { v4 as uuidv4 } from 'uuid';

const ENCRYPTION_KEY_STORAGE = 'mindflow_encryption_key';
const SHARE_LINKS_STORAGE = 'mindflow_share_links';
const BASE_SHARE_URL = 'https://mindflow.app/shared';

interface ShareLinkData {
  id: string;
  token: string;
  createdAt: string;
  expiresAt: string | null;
  recipientLabel: string;
  isActive: boolean;
  encryptedPayload: string;
}

interface ShareableProgress {
  heatmapData: Record<string, number>;
  stressChart: number[];
  sleepChart: number[];
  sessionsChart: number[];
  totalSessions: number;
  currentStreak: number;
  period: string;
}

interface EncryptedData {
  data: string;
  iv: string;
  timestamp: number;
}

const base64Encode = (input: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  const bytes = Array.from(input).map((c) => c.charCodeAt(0));

  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;

    result += chars[b1 >> 2];
    result += chars[((b1 & 3) << 4) | (b2 >> 4)];
    result += i + 1 < bytes.length ? chars[((b2 & 15) << 2) | (b3 >> 6)] : '=';
    result += i + 2 < bytes.length ? chars[b3 & 63] : '=';
  }

  return result;
};

const base64Decode = (input: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const cleanInput = input.replace(/=+$/, '');
  let result = '';
  const bytes: number[] = [];

  for (let i = 0; i < cleanInput.length; i++) {
    bytes.push(chars.indexOf(cleanInput[i]));
  }

  for (let i = 0; i < bytes.length; i += 4) {
    const b1 = bytes[i];
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const b4 = i + 3 < bytes.length ? bytes[i + 3] : 0;

    result += String.fromCharCode((b1 << 2) | (b2 >> 4));
    if (i + 2 < bytes.length) {
      result += String.fromCharCode(((b2 & 15) << 4) | (b3 >> 2));
    }
    if (i + 3 < bytes.length) {
      result += String.fromCharCode(((b3 & 3) << 6) | b4);
    }
  }

  return result;
};

const generateRandomHex = (length: number): string => {
  const hexChars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += hexChars[Math.floor(Math.random() * 16)];
  }
  return result;
};

const xorCipher = (text: string, key: string): string => {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return result;
};

const getOrCreateEncryptionKey = async (): Promise<string> => {
  try {
    const existingKey = await EncryptedStorage.getItem(ENCRYPTION_KEY_STORAGE);
    if (existingKey) {
      return existingKey;
    }
  } catch {
    // Key doesn't exist yet
  }

  const newKey = uuidv4() + '-' + generateRandomHex(32);
  await EncryptedStorage.setItem(ENCRYPTION_KEY_STORAGE, newKey);
  return newKey;
};

export const encryptData = async (data: string): Promise<string> => {
  try {
    const key = await getOrCreateEncryptionKey();
    const iv = generateRandomHex(16);
    const combinedKey = key + iv;

    const encrypted = xorCipher(data, combinedKey);
    const encodedData = base64Encode(encrypted);

    const encryptedPayload: EncryptedData = {
      data: encodedData,
      iv,
      timestamp: Date.now(),
    };

    return JSON.stringify(encryptedPayload);
  } catch (error) {
    console.error('[Encryption] Failed to encrypt data:', error);
    throw new Error('Encryption failed');
  }
};

export const decryptData = async (encryptedString: string): Promise<string> => {
  try {
    const key = await getOrCreateEncryptionKey();
    const encryptedPayload: EncryptedData = JSON.parse(encryptedString);

    const combinedKey = key + encryptedPayload.iv;
    const decodedData = base64Decode(encryptedPayload.data);
    const decrypted = xorCipher(decodedData, combinedKey);

    return decrypted;
  } catch (error) {
    console.error('[Encryption] Failed to decrypt data:', error);
    throw new Error('Decryption failed');
  }
};

export const encryptSensitiveValue = async (
  key: string,
  value: unknown
): Promise<void> => {
  try {
    const jsonString = JSON.stringify(value);
    const encrypted = await encryptData(jsonString);
    await EncryptedStorage.setItem(key, encrypted);
  } catch (error) {
    console.error('[Encryption] Failed to store encrypted value:', error);
    throw error;
  }
};

export const decryptSensitiveValue = async <T = unknown>(
  key: string
): Promise<T | null> => {
  try {
    const encrypted = await EncryptedStorage.getItem(key);
    if (!encrypted) {
      return null;
    }

    const decrypted = await decryptData(encrypted);
    return JSON.parse(decrypted) as T;
  } catch (error) {
    console.error('[Encryption] Failed to retrieve encrypted value:', error);
    return null;
  }
};

export const removeSensitiveValue = async (key: string): Promise<void> => {
  try {
    await EncryptedStorage.removeItem(key);
  } catch (error) {
    console.error('[Encryption] Failed to remove encrypted value:', error);
  }
};

export const generateShareToken = (): string => {
  const tokenParts = [
    uuidv4().replace(/-/g, ''),
    generateRandomHex(16),
    Date.now().toString(36),
  ];
  return tokenParts.join('');
};

export const generateShareKey = (): string => {
  return generateRandomHex(64);
};

const encryptSharePayload = (
  data: ShareableProgress,
  shareKey: string
): string => {
  const jsonString = JSON.stringify(data);
  const encrypted = xorCipher(jsonString, shareKey);
  return base64Encode(encrypted);
};

const decryptSharePayload = (
  encryptedPayload: string,
  shareKey: string
): ShareableProgress | null => {
  try {
    const decoded = base64Decode(encryptedPayload);
    const decrypted = xorCipher(decoded, shareKey);
    return JSON.parse(decrypted) as ShareableProgress;
  } catch {
    return null;
  }
};

const getStoredShareLinks = async (): Promise<ShareLinkData[]> => {
  try {
    const stored = await EncryptedStorage.getItem(SHARE_LINKS_STORAGE);
    if (stored) {
      return JSON.parse(stored) as ShareLinkData[];
    }
  } catch {
    // No stored links
  }
  return [];
};

const saveShareLinks = async (links: ShareLinkData[]): Promise<void> => {
  await EncryptedStorage.setItem(SHARE_LINKS_STORAGE, JSON.stringify(links));
};

export const createShareLink = async (
  progress: ShareableProgress,
  recipientLabel: string,
  expiresInDays: number | null = 30
): Promise<{ url: string; linkId: string }> => {
  const token = generateShareToken();
  const shareKey = generateShareKey();
  const encryptedPayload = encryptSharePayload(progress, shareKey);

  const linkId = uuidv4();
  const now = new Date();
  const expiresAt = expiresInDays
    ? new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const linkData: ShareLinkData = {
    id: linkId,
    token,
    createdAt: now.toISOString(),
    expiresAt,
    recipientLabel,
    isActive: true,
    encryptedPayload,
  };

  const existingLinks = await getStoredShareLinks();
  existingLinks.push(linkData);
  await saveShareLinks(existingLinks);

  const url = `${BASE_SHARE_URL}/${token}?k=${base64Encode(shareKey)}`;

  return { url, linkId };
};

export const getActiveShareLinks = async (): Promise<ShareLinkData[]> => {
  const links = await getStoredShareLinks();
  const now = new Date();

  return links.filter((link) => {
    if (!link.isActive) return false;
    if (link.expiresAt && new Date(link.expiresAt) < now) return false;
    return true;
  });
};

export const revokeShareLink = async (linkId: string): Promise<boolean> => {
  const links = await getStoredShareLinks();
  const linkIndex = links.findIndex((l) => l.id === linkId);

  if (linkIndex === -1) return false;

  links[linkIndex].isActive = false;
  await saveShareLinks(links);
  return true;
};

export const revokeAllShareLinks = async (): Promise<void> => {
  const links = await getStoredShareLinks();
  const updatedLinks = links.map((link) => ({ ...link, isActive: false }));
  await saveShareLinks(updatedLinks);
};

export const deleteShareLink = async (linkId: string): Promise<boolean> => {
  const links = await getStoredShareLinks();
  const filtered = links.filter((l) => l.id !== linkId);

  if (filtered.length === links.length) return false;

  await saveShareLinks(filtered);
  return true;
};

export const decodeShareLink = (
  encryptedPayload: string,
  encodedKey: string
): ShareableProgress | null => {
  try {
    const shareKey = base64Decode(encodedKey);
    return decryptSharePayload(encryptedPayload, shareKey);
  } catch {
    return null;
  }
};

export const isShareLinkValid = async (token: string): Promise<boolean> => {
  const links = await getStoredShareLinks();
  const link = links.find((l) => l.token === token);

  if (!link) return false;
  if (!link.isActive) return false;
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) return false;

  return true;
};

export const getShareLinkData = async (
  token: string
): Promise<ShareLinkData | null> => {
  const links = await getStoredShareLinks();
  return links.find((l) => l.token === token) ?? null;
};

export const updateShareLinkProgress = async (
  linkId: string,
  progress: ShareableProgress
): Promise<boolean> => {
  const links = await getStoredShareLinks();
  const linkIndex = links.findIndex((l) => l.id === linkId);

  if (linkIndex === -1) return false;

  const shareKey = generateShareKey();
  links[linkIndex].encryptedPayload = encryptSharePayload(progress, shareKey);
  await saveShareLinks(links);
  return true;
};

export const clearAllEncryptedData = async (): Promise<void> => {
  try {
    await EncryptedStorage.clear();
  } catch (error) {
    console.error('[Encryption] Failed to clear all encrypted data:', error);
  }
};

export const hashString = (input: string): string => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }

  const positiveHash = Math.abs(hash);
  return positiveHash.toString(36) + generateRandomHex(8);
};

export type { ShareLinkData, ShareableProgress, EncryptedData };