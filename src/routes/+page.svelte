<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { io, type Socket } from 'socket.io-client';

	type Phase = 'lobby' | 'drawing' | 'voting' | 'result';
	type Player = {
		id: string;
		nickname: string;
		isHost: boolean;
		connected: boolean;
	};
	type Stroke = { playerId: string; d: string };
	type RoomState = {
		id: string;
		phase: Phase;
		players: Player[];
		turnIndex: number;
		strokes: Stroke[];
	};

	const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3001';

	let socket: Socket | null = null;

	let connectionStatus: 'disconnected' | 'connected' | 'error' = 'disconnected';
	let socketId = '';

	let nickname = '';
	let roomCode = '';

	let room: RoomState | null = null;

	let lastPong = '';
	let errorMsg = '';

	const connect = () => {
		if (socket) return;

		socket = io(SOCKET_URL, { transports: ['websocket'] });

		socket.on('connect', () => {
			socketId = socket?.id ?? '';
			connectionStatus = 'connected';
			errorMsg = '';
		});

		socket.on('disconnect', () => {
			connectionStatus = 'disconnected';
			socketId = '';
			room = null;
		});

		socket.on('connect_error', (err) => {
			connectionStatus = 'error';
			errorMsg = err?.message ?? 'connect_error';
		});

		socket.on('pong', () => {
			lastPong = new Date().toLocaleTimeString();
		});

		socket.on('room:state', (nextRoom: RoomState) => {
			room = nextRoom;
			roomCode = nextRoom.id;
		});
	};

	const disconnect = () => {
		socket?.disconnect();
		socket = null;
		connectionStatus = 'disconnected';
		socketId = '';
		room = null;
	};

	const ping = () => {
		errorMsg = '';
		socket?.emit('ping');
	};

	const createRoom = () => {
		errorMsg = '';
		if (!socket) return (errorMsg = '소켓이 연결되지 않았습니다.');
		if (!nickname.trim()) return (errorMsg = '닉네임을 입력해 주세요.');

		socket.emit('room:create', { nickname: nickname.trim() }, (res: { roomId: string }) => {
			roomCode = res.roomId;
		});
	};

	const joinRoom = () => {
		errorMsg = '';
		if (!socket) return (errorMsg = '소켓이 연결되지 않았습니다.');
		if (!nickname.trim()) return (errorMsg = '닉네임을 입력해 주세요.');
		if (!roomCode.trim()) return (errorMsg = '방 코드를 입력해 주세요.');

		socket.emit(
			'room:join',
			{ roomId: roomCode.trim().toUpperCase(), nickname: nickname.trim() },
			(res: { ok: boolean; error?: string }) => {
				if (!res.ok) errorMsg = res.error ?? 'JOIN_FAILED';
			}
		);
	};

	const copyRoomCode = async () => {
		errorMsg = '';
		if (!room?.id) return;
		try {
			await navigator.clipboard.writeText(room.id);
		} catch {
			errorMsg = '클립보드 복사에 실패했어요. 수동으로 복사해 주세요.';
		}
	};

	const amIHost = () => !!room?.players.find((p) => p.id === socketId)?.isHost;
	const isMe = (id: string) => id === socketId;

	onMount(() => {
		connect();
	});

	onDestroy(() => {
		socket?.off('connect');
		socket?.off('disconnect');
		socket?.off('connect_error');
		socket?.off('pong');
		socket?.off('room:state');
		socket?.disconnect();
		socket = null;
	});
</script>

<main class="wrap">
	<header class="header">
		<h1 class="title">Catch Liar - Lobby</h1>

		<div class="conn">
			<span class="pill">status: <strong>{connectionStatus}</strong></span>
			<span class="pill">socketId: <span class="mono">{socketId || '-'}</span></span>
			<span class="pill">last pong: <span class="mono">{lastPong || '-'}</span></span>

			<div class="spacer"></div>

			<button class="btn" on:click={ping} disabled={!socket}>ping</button>
			<button class="btn" on:click={disconnect} disabled={!socket}>disconnect</button>
			<button class="btn" on:click={connect} disabled={!!socket}>connect</button>
		</div>

		{#if errorMsg}
			<p class="error">{errorMsg}</p>
		{/if}
	</header>

	<section class="panel">
		<h2 class="h2">Enter</h2>

		<div class="grid">
			<label class="field">
				<span class="field__label">닉네임</span>
				<input class="input" bind:value={nickname} placeholder="예: nickname" />
			</label>

			<label class="field">
				<span class="field__label">방 코드</span>
				<input class="input mono" bind:value={roomCode} placeholder="예: A1B2C3" />
			</label>

			<div class="row">
				<button class="btn primary" on:click={createRoom} disabled={!socket}>방 만들기</button>
				<button class="btn" on:click={joinRoom} disabled={!socket}>방 참가</button>
			</div>
		</div>
	</section>

	<section class="panel">
		<h2 class="h2">Room State</h2>

		{#if room}
			<div class="roomHead">
				<span class="pill">room: <span class="mono">{room.id}</span></span>
				<span class="pill">phase: <strong>{room.phase}</strong></span>
				<span class="pill">turnIndex: <strong>{room.turnIndex}</strong></span>
				<button class="btn" on:click={copyRoomCode}>코드 복사</button>
				<span class="pill">host?: <strong>{amIHost() ? 'HOST' : 'NOT HOST'}</strong></span>
			</div>

			<div class="list">
				{#each room.players as p (p.id)}
					<div class="player {isMe(p.id) ? 'me' : ''}">
						<div class="left">
							<div class="name">
								{p.nickname}
								{#if p.isHost}<span class="tag">HOST</span>{/if}
								{#if isMe(p.id)}<span class="tag">ME</span>{/if}
							</div>
							<div class="meta mono">{p.id}</div>
						</div>
						<div class="right">
							<span class="tag">{p.connected ? 'online' : 'offline'}</span>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<p class="hint">아직 방에 들어가지 않았어요. 위에서 방을 만들거나 참가해 주세요.</p>
		{/if}
	</section>
</main>

<style>
	.wrap {
		max-width: 900px;
		margin: 0 auto;
		padding: 24px 16px 56px;
		display: grid;
		gap: 16px;
		font-family:
			system-ui,
			-apple-system,
			Segoe UI,
			Roboto,
			sans-serif;
	}

	.header {
		display: grid;
		gap: 10px;
	}

	.title {
		margin: 0;
		font-size: 24px;
		font-weight: 800;
		letter-spacing: -0.02em;
	}

	.conn {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
	}

	.spacer {
		flex: 1;
	}

	.panel {
		border: 1px solid rgba(0, 0, 0, 0.12);
		border-radius: 12px;
		padding: 16px;
		background: rgba(255, 255, 255, 0.75);
	}

	.h2 {
		margin: 0 0 12px;
		font-size: 16px;
		font-weight: 800;
	}

	.grid {
		display: grid;
		gap: 12px;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.field {
		display: grid;
		gap: 6px;
	}

	.field__label {
		font-size: 12px;
		opacity: 0.75;
	}

	.input {
		width: 100%;
		padding: 10px 12px;
		border-radius: 10px;
		border: 1px solid rgba(0, 0, 0, 0.2);
		background: white;
		outline: none;
	}

	.btn {
		padding: 10px 12px;
		border-radius: 10px;
		border: 1px solid rgba(0, 0, 0, 0.2);
		background: white;
		cursor: pointer;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn.primary {
		font-weight: 800;
	}

	.pill {
		display: inline-flex;
		gap: 6px;
		align-items: center;
		border: 1px solid rgba(0, 0, 0, 0.12);
		padding: 6px 10px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.85);
	}

	.mono {
		font-family:
			ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
		font-size: 12px;
	}

	.roomHead {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
		margin-bottom: 12px;
	}

	.list {
		display: grid;
		gap: 8px;
	}

	.player {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		border: 1px solid rgba(0, 0, 0, 0.12);
		border-radius: 12px;
		padding: 10px 12px;
		background: rgba(255, 255, 255, 0.9);
	}

	.player.me {
		border-color: rgba(0, 0, 0, 0.28);
	}

	.name {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		align-items: center;
		font-weight: 800;
	}

	.meta {
		opacity: 0.75;
		margin-top: 4px;
		word-break: break-all;
	}

	.tag {
		display: inline-flex;
		align-items: center;
		padding: 2px 8px;
		border-radius: 999px;
		font-size: 11px;
		border: 1px solid rgba(0, 0, 0, 0.12);
		background: rgba(0, 0, 0, 0.04);
	}

	.hint {
		margin: 12px 0 0;
		opacity: 0.8;
		font-size: 13px;
		line-height: 1.4;
	}

	.error {
		margin: 0;
		color: #b42318;
		font-weight: 800;
	}
</style>
