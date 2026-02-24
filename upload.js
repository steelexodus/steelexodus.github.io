import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-storage.js";

import { storage } from "./firebase-config.js";

const MAX_SIZE_MB = 25;
const ALLOWED_TYPES = [
  "image/png", "image/jpeg", "image/gif", "image/webp",
  "application/pdf",
  "text/plain", "text/csv",
  "application/zip",
  "video/mp4", "video/webm",
  "audio/mpeg", "audio/wav", "audio/ogg"
];

/**
 * Upload a single file to Firebase Storage.
 * @param {File} file
 * @param {string} channelId  — used as folder path
 * @param {string} userId
 * @param {function} onProgress  — called with 0–100
 * @returns {Promise<{url, name, type, size}>}
 */
export function uploadFile(file, channelId, userId, onProgress) {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return reject(new Error(`File type "${file.type}" is not allowed.`));
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return reject(new Error(`File exceeds ${MAX_SIZE_MB} MB limit.`));
    }

    const path = `uploads/${channelId}/${userId}/${Date.now()}_${file.name}`;
    const ref  = storageRef(storage, path);
    const task = uploadBytesResumable(ref, file);

    task.on(
      "state_changed",
      snap => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        onProgress?.(pct);
      },
      err => reject(err),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({
          url,
          name: file.name,
          type: file.type,
          size: file.size
        });
      }
    );
  });
}

/** Upload multiple files and return array of attachment objects */
export async function uploadFiles(files, channelId, userId, onProgress) {
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const result = await uploadFile(
      files[i], channelId, userId,
      pct => onProgress?.(i, files.length, pct)
    );
    results.push(result);
  }
  return results;
}

/** Returns true if the MIME type is an image */
export function isImage(type) {
  return type?.startsWith("image/");
}

/** Human-readable file size */
export function fmtSize(bytes) {
  if (bytes < 1024)       return bytes + " B";
  if (bytes < 1048576)    return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}
