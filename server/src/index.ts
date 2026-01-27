import http from 'http';
import { Server } from 'socket.io';

const PORT = Number(process.env.PORT ?? 3001);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

const server = http.createServer((req, res) => {
	// 헬스체크
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

io.on('connection', (socket) => {
	console.log('✅ connected:', socket.id);

	socket.on('ping', () => {
		socket.emit('pong');
	});

	socket.on('disconnect', (reason) => {
		console.log('❌ disconnected:', socket.id, reason);
	});
});

server.listen(PORT, () => {
	console.log(`🚀 socket server on http://localhost:${PORT}`);
});
