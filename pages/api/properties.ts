import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../src/config/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy
} from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    switch (method) {

      // 📥 GET PROPERTIES
      case 'GET': {
        let q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'));

        const snapshot = await getDocs(q);

        const properties = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        return res.status(200).json(properties);
      }

      // ➕ ADD PROPERTY
      case 'POST': {
        const data = sanitizeInput(req.body);

        if (!data.title || !data.type || !data.price) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const docRef = await addDoc(collection(db, 'properties'), {
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        return res.status(201).json({ id: docRef.id, ...data });
      }

      // ✏️ UPDATE PROPERTY
      case 'PUT': {
        const { id } = req.query;
        const updates = sanitizeInput(req.body);

        if (!id) {
          return res.status(400).json({ error: 'Property ID required' });
        }

        await updateDoc(doc(db, 'properties', id as string), {
          ...updates,
          updatedAt: new Date().toISOString(),
        });

        return res.status(200).json({ message: 'Updated successfully' });
      }

      // ❌ DELETE PROPERTY
      case 'DELETE': {
        const { id } = req.query;

        if (!id) {
          return res.status(400).json({ error: 'Property ID required' });
        }

        await deleteDoc(doc(db, 'properties', id as string));

        return res.status(200).json({ message: 'Deleted successfully' });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// 🔒 Sanitization (keep this — it's good)
function sanitizeInput(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = value
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}