import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

/**
 * Auth socket permissif:
 * - Accepte le token depuis handshake.auth.token, handshake.query.token, ou Authorization: Bearer
 * - Si pas de token ou token invalide => on laisse passer (anonyme), au lieu de couper la connexion
 *   (utile pour les viewers publics). Mets STRICT=true si tu veux bloquer sans token.
 */
const STRICT = false;

export async function authenticateSocket(socket: AuthenticatedSocket, next: (err?: Error) => void) {
  try {
    const fromAuth  = (socket.handshake as any)?.auth?.token as string | undefined;
    // @ts-ignore
    const fromQuery = socket.handshake?.query?.token as string | undefined;
    const authHeader = socket.handshake.headers?.authorization as string | undefined;

    let token = fromAuth || fromQuery;
    if (!token && authHeader?.startsWith('Bearer ')) token = authHeader.slice('Bearer '.length);

    if (!token) {
      if (STRICT) return next(new Error('Authentication token required'));
      return next(); // anonyme ok
    }

    const secret = process.env.JWT_SECRET!;
    const decoded = jwt.verify(token, secret) as any;

    // optionnel: hydrate user pour username propre
    const user = await User.findById(decoded.userId).select('username').lean();
    socket.userId = decoded.userId;
    socket.username = user?.username || decoded.username || decoded.email || '';

    return next();
  } catch (err) {
    if (STRICT) return next(new Error('Authentication failed'));
    return next(); // anonyme ok
  }
}
