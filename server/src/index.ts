import http from 'http';
import { Server, Socket } from 'socket.io';

type Phase = 'lobby' | 'role_reveal' | 'drawing' | 'voting' | 'liar_guess' | 'result';

type Player = {
	id: string; // socket.id
	nickname: string;
	avatar: string;
	isHost: boolean;
	isLiar: boolean;
	connected: boolean;
	voteCount: number;
};

type Stroke = {
	playerId: string;
	d: string; // SVG path
	color: string;
	width: number;
	points?: {x: number, y: number}[];
};

type RoomState = {
	id: string;
	phase: Phase;
	players: Player[];
	category: string;
	keyword: string;
	liarId: string;
	round: number;
	turnIndex: number;
	strokes: Stroke[];
	winningTeam: 'CITIZEN' | 'LIAR' | null;
};

const CATEGORIES = ['동물', '음식', '직업', '물건', '장소', '인물'];
const AVATARS = ['🐶', '🐱', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨'];
const KEYWORDS: Record<string, string[]> = {
	'동물': ['고양이', '강아지', '오리', '호랑이', '판다', '기린'],
	'음식': ['햄버거', '피자', '치킨', '떡볶이', '라면', '김밥'],
	'직업': ['의사', '선생님', '요리사', '경찰', '소방관', '가수'],
	'물건': ['안경', '시계', '컴퓨터', '전화기', '우산', '가방'],
	'장소': ['학교', '병원', '공원', '바다', '우주', '집'],
	'인물': ['아이유', '세종대왕', '이순신', '손흥민', 'BTS', '봉준호']
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
						avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
						isHost: true,
						isLiar: false,
						connected: true,
						voteCount: 0
					}
				],
				
				category: '동물',
				keyword: '',
				liarId: '',
				round: 1,

				turnIndex: 0,
				strokes: [],
				winningTeam: null
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
					avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
					isHost: false,
					isLiar: false,
					connected: true,
					voteCount: 0
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
	 * game:start
	 * ====================== */
	socket.on('game:start', ({}, cb?: (res: { ok: boolean }) => void) => {
		const roomId = socket.data.roomId;
		if (!roomId) return;
		const room = rooms.get(roomId);
		if (!room || room.players[0].id !== socket.id) return;

		const category = room.category;
		const keywords = KEYWORDS[category] || KEYWORDS['동물'];
		room.keyword = keywords[Math.floor(Math.random() * keywords.length)];

		const liarIndex = Math.floor(Math.random() * room.players.length);
		room.players.forEach((p, idx) => {
			p.isLiar = idx === liarIndex;
			p.voteCount = 0;
		});
		room.liarId = room.players[liarIndex].id;

		room.phase = 'role_reveal';
		room.strokes = [];
		room.turnIndex = 0;
		room.round = 1;
		room.winningTeam = null;

		broadcastRoom(io, roomId);
		cb?.({ ok: true });
	});

	/* ======================
	 * game:change_category
	 * ====================== */
	socket.on('game:change_category', ({ category }: { category: string }) => {
		const roomId = socket.data.roomId;
		if (!roomId) return;
		const room = rooms.get(roomId);
		if (!room || room.players[0].id !== socket.id) return;
		
		if (CATEGORIES.includes(category)) {
			room.category = category;
			broadcastRoom(io, roomId);
		}
	});

	/* ======================
	 * game:next_phase (e.g. role_reveal -> drawing)
	 * ====================== */
	socket.on('game:next_phase', ({ phase }: { phase: Phase }) => {
		const roomId = socket.data.roomId;
		if (!roomId) return;
		const room = rooms.get(roomId);
		if (!room) return;
		// Normally host controls, but for role reveal -> drawing anyone clicking "Ok" is just local UI, 
		// but here we want to sync. Let's make it so host starts drawing, or auto-start? 
		// Simplify: Host triggers 'drawing' start.
		
		if (phase === 'drawing') {
			room.phase = 'drawing';
			broadcastRoom(io, roomId);
		}
	});

	/* ======================
	 * stroke:commit
	 * ====================== */
	socket.on('stroke:commit', ({ d, color, width, points }: { d: string, color?: string, width?: number, points?: any[] }, cb) => {
		const roomId = socket.data.roomId;
		if (!roomId) return;
		const room = rooms.get(roomId);
		if (!room) return;
		
		// Validate turn
		const currentPlayer = room.players[room.turnIndex];
		if (currentPlayer.id !== socket.id) {
			cb?.({ ok: false, error: 'NOT_YOUR_TURN' });
			return;
		}

		room.strokes.push({
			playerId: socket.id,
			d,
			color: color || '#000',
			width: width || 4,
			points
		});

		// Next turn
		room.turnIndex = (room.turnIndex + 1) % room.players.length;
		
		// Check round completion
		if (room.turnIndex === 0) {
			room.round++; // simple increment for now
			// If we want 1 round only (everyone drew once):
			room.phase = 'voting';
		}

		cb?.({ ok: true });
		broadcastRoom(io, roomId);
	});

	/* ======================
	 * game:vote
	 * ====================== */
	socket.on('game:vote', ({ targetId }: { targetId: string }) => {
		const roomId = socket.data.roomId;
		if (!roomId) return;
		const room = rooms.get(roomId);
		if (!room) return;

		// Prevent duplicate voting if we want? For now simple count
		const player = room.players.find(p => p.id === socket.id);
		// if (player?.hasVoted) return; 

		const target = room.players.find(p => p.id === targetId);
		if (target) {
			target.voteCount++;
		}
		
		// Check if everyone voted
		const totalVotes = room.players.reduce((acc, p) => acc + p.voteCount, 0);
		if (totalVotes >= room.players.length) {
			// Calculate results
			const sorted = [...room.players].sort((a, b) => b.voteCount - a.voteCount);
			const topVoter = sorted[0];
			
			if (topVoter.id === room.liarId) {
				room.phase = 'liar_guess';
			} else {
				room.winningTeam = 'LIAR';
				room.phase = 'result';
			}
		}

		broadcastRoom(io, roomId);
	});

	/* ======================
	 * game:liar_guess
	 * ====================== */
	socket.on('game:liar_guess', ({ keyword }: { keyword: string }) => {
		const roomId = socket.data.roomId;
		if (!roomId) return;
		const room = rooms.get(roomId);
		if (!room) return;
		
		if (socket.id !== room.liarId) return;

		if (keyword.trim() === room.keyword) {
			room.winningTeam = 'LIAR';
		} else {
			room.winningTeam = 'CITIZEN';
		}
		room.phase = 'result';
		broadcastRoom(io, roomId);
	});

	/* ======================
	 * game:reset
	 * ====================== */
	socket.on('game:reset', () => {
		const roomId = socket.data.roomId;
		if (!roomId) return;
		const room = rooms.get(roomId);
		if (!room) return;
		
		room.phase = 'lobby';
		room.players.forEach(p => {
			p.voteCount = 0;
			p.isLiar = false;
		});
		room.strokes = [];
		broadcastRoom(io, roomId);
	});

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
