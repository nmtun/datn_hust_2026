import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';

let ioInstance = null;

const extractToken = (socket) => {
    const fromAuth = socket.handshake?.auth?.token;
    const fromQuery = socket.handshake?.query?.token;
    const fromHeader = socket.handshake?.headers?.authorization;

    const rawToken = fromAuth || fromQuery || fromHeader;
    if (!rawToken) return null;

    if (typeof rawToken === 'string' && rawToken.startsWith('Bearer ')) {
        return rawToken.split(' ')[1];
    }

    if (Array.isArray(rawToken)) {
        return rawToken[0] || null;
    }

    return rawToken;
};

export const setupSocketServer = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || '*',
            methods: ['GET', 'POST']
        }
    });

    io.use((socket, next) => {
        try {
            const token = extractToken(socket);
            if (!token) {
                return next(new Error('Authentication token is required'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (error) {
            next(new Error('Invalid authentication token'));
        }
    });

    io.on('connection', (socket) => {
        const userId = Number(socket.user?.user_id ?? socket.user?.userId);

        if (userId) {
            socket.join(`user:${userId}`);
        }

        socket.on('disconnect', () => {
            // Socket.IO will automatically leave all rooms on disconnect.
        });
    });

    ioInstance = io;
    return io;
};

export const getSocketServer = () => ioInstance;

export const emitToUser = (userId, event, payload) => {
    if (!ioInstance || !userId) return;
    ioInstance.to(`user:${Number(userId)}`).emit(event, payload);
};

export const emitToUsers = (userIds = [], event, payload) => {
    if (!ioInstance || !Array.isArray(userIds)) return;

    const uniqueIds = [...new Set(userIds.map((id) => Number(id)).filter((id) => id > 0))];
    uniqueIds.forEach((id) => {
        ioInstance.to(`user:${id}`).emit(event, payload);
    });
};
