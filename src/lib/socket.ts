import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'wss://catch-liar.seohey.co.kr';

let socket: Socket | null = null;

export const getSocket = () => {
	if (!socket) {
		socket = io(SOCKET_URL, { transports: ['websocket'] });
	}
	return socket;
};

export const resetSocket = () => {
	socket?.disconnect();
	socket = null;
};
