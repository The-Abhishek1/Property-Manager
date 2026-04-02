// pages/api/upload.ts
// Handles image + video uploads to Cloudinary via server-side signed upload.
// Signing uploads server-side keeps your api_secret safe (never exposed to the client).

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

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({ maxFileSize: MAX_FILE_SIZE });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'File parsing failed: ' + err.message });
    }

    try {
      const file = (Array.isArray(files.file) ? files.file[0] : files.file) as FFile | undefined;
      const propertyId = Array.isArray(fields.propertyId) ? fields.propertyId[0] : fields.propertyId;
      const resourceTypeHint = Array.isArray(fields.type) ? fields.type[0] : fields.type; // 'image' | 'video'

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const mime = file.mimetype || '';
      const isVideo = ALLOWED_VIDEO_TYPES.includes(mime) || resourceTypeHint === 'video';
      const isImage = ALLOWED_IMAGE_TYPES.includes(mime);

      if (!isImage && !isVideo) {
        return res.status(400).json({ error: `Unsupported file type: ${mime}` });
      }

      const folder = `property-nexus/${propertyId || 'general'}`;
      const resourceType: 'image' | 'video' = isVideo ? 'video' : 'image';

      // Upload directly from temp file path — avoids loading large files into memory
      const result = await cloudinary.uploader.upload(file.filepath, {
        folder,
        resource_type: resourceType,
        // Auto-generate a unique public_id based on original filename
        public_id: `${Date.now()}_${(file.originalFilename || 'file').replace(/\s+/g, '_')}`,
        // For images: auto-optimize quality
        ...(resourceType === 'image' && {
          quality: 'auto',
          fetch_format: 'auto',
        }),
        // For videos: generate a thumbnail + transcode
        ...(resourceType === 'video' && {
          eager: [{ format: 'mp4', quality: 'auto' }],
          eager_async: true,
        }),
      });

      // Clean up temp file
      fs.unlink(file.filepath, () => {});

      return res.status(200).json({
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format,
        width: result.width,
        height: result.height,
        // For videos, Cloudinary can generate a thumbnail at the same public_id with .jpg extension
        thumbnailUrl: resourceType === 'video'
          ? cloudinary.url(result.public_id + '.jpg', { resource_type: 'video', width: 400, crop: 'scale' })
          : null,
        name: file.originalFilename,
      });

    } catch (error: any) {
      console.error('Upload Error:', error);
      return res.status(500).json({ error: 'Upload failed: ' + (error.message || 'unknown error') });
    }
  });
}
