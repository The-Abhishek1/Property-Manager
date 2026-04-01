// pages/api/upload.ts
// File upload handler for images and documents
// Uses Firebase Storage in production

import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// Allowed file types for security
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const ALLOWED_DOC_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // In production with Firebase Storage:
    // import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
    // import { storage } from '../../src/config/firebase';
    //
    // 1. Validate file type
    // const { file, type, propertyId } = req.body;
    // const allowedTypes = type === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_DOC_TYPES;
    // if (!allowedTypes.includes(file.type)) {
    //   return res.status(400).json({ error: 'Invalid file type' });
    // }
    //
    // 2. Validate file size
    // if (file.size > MAX_FILE_SIZE) {
    //   return res.status(400).json({ error: 'File too large (max 10MB)' });
    // }
    //
    // 3. Upload to Firebase Storage
    // const storageRef = ref(storage, `properties/${propertyId}/${Date.now()}_${file.name}`);
    // const snapshot = await uploadBytes(storageRef, file);
    // const downloadURL = await getDownloadURL(snapshot.ref);
    //
    // 4. Auto-compress images (use sharp library)
    // if (type === 'image') {
    //   const sharp = require('sharp');
    //   const compressed = await sharp(file.buffer)
    //     .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
    //     .jpeg({ quality: 80 })
    //     .toBuffer();
    // }
    //
    // 5. Auto-watermark (optional)
    // const watermarked = await sharp(compressed)
    //   .composite([{ input: watermarkBuffer, gravity: 'southeast' }])
    //   .toBuffer();
    //
    // return res.status(200).json({ url: downloadURL, name: file.name });

    return res.status(200).json({ message: 'Upload endpoint - Connect Firebase Storage' });
  } catch (error) {
    console.error('Upload Error:', error);
    return res.status(500).json({ error: 'Upload failed' });
  }
}
