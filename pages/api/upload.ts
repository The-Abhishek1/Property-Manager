// pages/api/upload.ts
// Handles image + video uploads to Cloudinary via server-side signed upload.
// FIX: wraps formidable's callback-based parse in a Promise so the API handler
// returns that Promise — otherwise Next.js closes the response before the
// Cloudinary upload finishes, producing the "resolved without sending a response" error.

import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File as FFile } from 'formidable';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

export const config = {
  api: {
    bodyParser: false, // Required for formidable to parse multipart
  },
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB — covers videos

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];

// ─── KEY FIX ─────────────────────────────────────────────────────────────────
// formidable uses callbacks internally. If we just call form.parse() and return
// void, Next.js marks the handler as resolved (no pending Promise) before the
// Cloudinary upload finishes — hence the 500 / "resolved without sending" error.
// Wrapping in a Promise keeps the handler "pending" until res.status().json() fires.
// ─────────────────────────────────────────────────────────────────────────────
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return Promise.resolve();
  }

  const form = formidable({ maxFileSize: MAX_FILE_SIZE });

  return new Promise((resolve) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.status(500).json({ error: 'File parsing failed: ' + err.message });
        return resolve();
      }

      try {
        const file = (Array.isArray(files.file) ? files.file[0] : files.file) as FFile | undefined;
        const propertyId = Array.isArray(fields.propertyId) ? fields.propertyId[0] : fields.propertyId;
        const resourceTypeHint = Array.isArray(fields.type) ? fields.type[0] : fields.type;

        if (!file) {
          res.status(400).json({ error: 'No file uploaded' });
          return resolve();
        }

        const mime = file.mimetype || '';
        const isVideo = ALLOWED_VIDEO_TYPES.includes(mime) || resourceTypeHint === 'video';
        const isImage = ALLOWED_IMAGE_TYPES.includes(mime);

        if (!isImage && !isVideo) {
          res.status(400).json({ error: `Unsupported file type: ${mime}` });
          return resolve();
        }

        const folder = `property-nexus/${propertyId || 'general'}`;
        const resourceType: 'image' | 'video' = isVideo ? 'video' : 'image';

        const result = await cloudinary.uploader.upload(file.filepath, {
          folder,
          resource_type: resourceType,
          public_id: `${Date.now()}_${(file.originalFilename || 'file').replace(/\s+/g, '_')}`,
          ...(resourceType === 'image' && {
            quality: 'auto',
            fetch_format: 'auto',
          }),
          ...(resourceType === 'video' && {
            eager: [{ format: 'mp4', quality: 'auto' }],
            eager_async: true,
          }),
        });

        // Clean up temp file (fire-and-forget; don't await)
        fs.unlink(file.filepath, () => {});

        res.status(200).json({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          format: result.format,
          width: result.width,
          height: result.height,
          thumbnailUrl:
            resourceType === 'video'
              ? cloudinary.url(result.public_id + '.jpg', {
                  resource_type: 'video',
                  width: 400,
                  crop: 'scale',
                })
              : null,
          name: file.originalFilename,
        });
      } catch (error: any) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'Upload failed: ' + (error.message || 'unknown error') });
      }

      resolve();
    });
  });
}
