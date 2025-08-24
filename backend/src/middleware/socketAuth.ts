import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User'; // Assure-toi que IUser existe dans ton modèle

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

export async function authenticateSocket(socket: AuthenticatedSocket, next: (err?: Error) => void) {
  try {
    // Récupérer le token depuis handshake.auth ou header Authorization
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Vérifie et décode le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
    };

    // Cherche l'utilisateur en DB
    const user = (await User.findById(decoded.userId).select(
      '-password'
    )) as IUser | null;

    if (!user) {
      return next(new Error('Invalid token'));
    }

    // Ajoute les infos sur le socket
    socket.userId = user._id.toString();
    socket.username = user.username;

    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
}
