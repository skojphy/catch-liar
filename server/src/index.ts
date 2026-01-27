import http from 'http';
import { Server, Socket } from 'socket.io';

type Phase = 'lobby' | 'drawing' | 'voting' | 'result';

type Player = {
	id: string; // socket.id
	nickname: string;
	isHost: boolean;
	connected: boolean;
};

type Stroke = {
	playerId: string;
	d: string; // SVG path
};

type RoomState = {
	id: string;
	phase: Phase;
	players: Player[];

	// 게임 단계용 (아직 기본값만)
	turnIndex: number;
	strokes: Stroke[];
};

const rooms = new Map<string, RoomState>();

const makeRoomId = () => {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	let id = '';
	for (let i = 0; i < 6; i++) {
		id += chars[Math.floor(Math.random() * chars.length)];
	}
	return id;
};

const broadcastRoom = (io: Server, roomId: string) => {
	const room = rooms.get(roomId);
	if (!room) return;
	io.to(roomId).emit('room:state', room);
};

const PORT = Number(process.env.PORT ?? 3001);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

const server = http.createServer((req, res) => {
	if (req.url === '/health') {
		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('ok');
		return;
	}
	res.writeHead(404);
	res.end();
});

const io = new Server(server, {
	cors: {
		origin: CLIENT_ORIGIN,
		credentials: true
	}
});

/* ======================
 * Socket.IO
 * ====================== */

io.on('connection', (socket: Socket) => {
	console.log('✅ connected:', socket.id);

	/* ----- ping 테스트 ----- */
	socket.on('ping', () => {
		socket.emit('pong');
	});

	/* ======================
	 * room:create
	 * ====================== */
	socket.on(
		'room:create',
		({ nickname }: { nickname: string }, cb?: (res: { roomId: string }) => void) => {
			const roomId = makeRoomId();

			const room: RoomState = {
				id: roomId,
				phase: 'lobby',
				players: [
					{
						id: socket.id,
						nickname,
						isHost: true,
						connected: true
					}
				],
				turnIndex: 0,
				strokes: []
			};

			rooms.set(roomId, room);
			socket.join(roomId);
			socket.data.roomId = roomId;

			console.log(`🏠 room created: ${roomId}`);

			cb?.({ roomId });
			broadcastRoom(io, roomId);
		}
	);

	/* ======================
	 * room:join
	 * ====================== */
	socket.on(
		'room:join',
		(
			{ roomId, nickname }: { roomId: string; nickname: string },
			cb?: (res: { ok: boolean; error?: string }) => void
		) => {
			const room = rooms.get(roomId);

			if (!room) {
				cb?.({ ok: false, error: 'ROOM_NOT_FOUND' });
				return;
			}

			if (room.phase !== 'lobby') {
				cb?.({ ok: false, error: 'ROOM_ALREADY_STARTED' });
				return;
			}

			const exists = room.players.find((p) => p.id === socket.id);

			if (!exists) {
				room.players.push({
					id: socket.id,
					nickname,
					isHost: false,
					connected: true
				});
			}

			socket.join(roomId);
			socket.data.roomId = roomId;

			console.log(`➕ join room ${roomId}: ${socket.id}`);

			cb?.({ ok: true });
			broadcastRoom(io, roomId);
		}
	);

	/* ======================
	 * disconnect
	 * ====================== */
	socket.on('disconnect', (reason) => {
		const roomId = socket.data.roomId as string | undefined;
		if (!roomId) return;

		const room = rooms.get(roomId);
		if (!room) return;

		room.players = room.players.filter((p) => p.id !== socket.id);

		// 호스트 위임
		if (room.players.length > 0 && !room.players.some((p) => p.isHost)) {
			room.players[0].isHost = true;
		}

		// 방 비면 삭제
		if (room.players.length === 0) {
			rooms.delete(roomId);
			console.log(`🗑 room removed: ${roomId}`);
			return;
		}

		broadcastRoom(io, roomId);
		console.log('❌ disconnected:', socket.id, reason);
	});
});

/* ======================
 * listen
 * ====================== */

server.listen(PORT, () => {
	console.log(`🚀 socket server on http://localhost:${PORT}`);
});
