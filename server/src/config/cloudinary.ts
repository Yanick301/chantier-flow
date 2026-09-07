import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = file.originalname.split('.').pop();
    const isPdf = file.mimetype === 'application/pdf';
    return {
      folder: 'chantier-flow/justificatifs',
      resource_type: isPdf ? 'raw' : 'image',
      format: isPdf ? 'pdf' : ext,
      public_id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    };
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté'));
    }
  },
});

export function getCloudinaryUrl(filename: string): string {
  return filename;
}

export async function deleteCloudinaryFile(filename: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(filename, {
      resource_type: filename.endsWith('.pdf') ? 'raw' : 'image',
    });
  } catch (error) {
    console.error('Erreur delete Cloudinary:', error);
  }
}
