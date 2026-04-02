// pages/api/auth.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth } from '../../src/config/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { action } = req.query;

  try {
    switch (action) {

      // ─── VERIFY ID TOKEN (called from client after Firebase sign-in) ───
      // Usage: GET /api/auth?action=verify
      // Header: Authorization: Bearer <idToken>
      case 'verify': {
        const token = req.headers.authorization?.split('Bearer ')[1];

        if (!token) {
          return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = await adminAuth.verifyIdToken(token);

        return res.status(200).json({
          uid: decoded.uid,
          email: decoded.email,
          emailVerified: decoded.email_verified,
        });
      }

      // ─── GET USER PROFILE by UID ───
      // Usage: GET /api/auth?action=user&uid=xxx
      case 'user': {
        const { uid } = req.query;
        if (!uid || typeof uid !== 'string') {
          return res.status(400).json({ error: 'UID required' });
        }
        const user = await adminAuth.getUser(uid);
        return res.status(200).json({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
        });
      }

      // ─── SET CUSTOM CLAIMS (e.g. role: admin/agent/viewer) ───
      // Usage: POST /api/auth?action=setRole
      // Body: { uid, role }
      // Note: Protect this endpoint — only allow calls from verified admins
      case 'setRole': {
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'POST required' });
        }

        // Verify the caller is an authenticated admin
        const callerToken = req.headers.authorization?.split('Bearer ')[1];
        if (!callerToken) return res.status(401).json({ error: 'Unauthorized' });

        const caller = await adminAuth.verifyIdToken(callerToken);
        if (caller.role !== 'admin') {
          return res.status(403).json({ error: 'Forbidden — admin only' });
        }

        const { uid, role } = req.body as { uid: string; role: string };
        if (!uid || !role) return res.status(400).json({ error: 'uid and role required' });

        const validRoles = ['admin', 'agent', 'viewer'];
        if (!validRoles.includes(role)) {
          return res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}` });
        }

        await adminAuth.setCustomUserClaims(uid, { role });
        return res.status(200).json({ message: `Role "${role}" set for ${uid}` });
      }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error: any) {
    console.error('Auth Error:', error);
    return res.status(500).json({ error: error.message || 'Authentication failed' });
  }
}
