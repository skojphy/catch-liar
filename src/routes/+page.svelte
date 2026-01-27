<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getSocket } from '$lib/socket';

	let connectionStatus: 'disconnected' | 'connected' | 'error' = 'disconnected';
	let socketId = '';

	let nickname = '';
	let roomCode = '';

	let lastPong = '';
	let errorMsg = '';

	const socket = getSocket();

	const connect = () => {
		if (!socket.connected) socket.connect();
	};

	const disconnect = () => {
		socket.disconnect();
		connectionStatus = 'disconnected';
		socketId = '';
	};

	const ping = () => {
		errorMsg = '';
		socket.emit('ping');
	};

	const createRoom = () => {
		errorMsg = '';
		const trimmed = nickname.trim();
		if (!trimmed) return (errorMsg = '닉네임을 입력해 주세요.');
		if (!socket.connected) return (errorMsg = '소켓이 아직 연결되지 않았습니다.');

		socket.emit('room:create', { nickname: trimmed }, (res: { roomId: string }) => {
			window.localStorage.setItem('nickname', trimmed);
			goto(`/room/${res.roomId}`);
		});
	};

	const joinRoom = () => {
		errorMsg = '';
		const trimmed = nickname.trim();
		const code = roomCode.trim().toUpperCase();

		if (!trimmed) return (errorMsg = '닉네임을 입력해 주세요.');
		if (!code) return (errorMsg = '방 코드를 입력해 주세요.');
		if (!socket.connected) return (errorMsg = '소켓이 아직 연결되지 않았습니다.');

		socket.emit(
			'room:join',
			{ roomId: code, nickname: trimmed },
			(res: { ok: boolean; error?: string }) => {
				if (!res.ok) {
					errorMsg = res.error ?? 'JOIN_FAILED';
					return;
				}
				window.localStorage.setItem('nickname', trimmed);
				goto(`/room/${code}`);
			}
		);
	};

	onMount(() => {
		nickname = window.localStorage.getItem('nickname') ?? '';
		connect();

		socket.on('connect', () => {
			socketId = socket.id ?? '';
			connectionStatus = 'connected';
			errorMsg = '';
		});

		socket.on('disconnect', () => {
			connectionStatus = 'disconnected';
			socketId = '';
		});

		socket.on('connect_error', (err) => {
			connectionStatus = 'error';
			errorMsg = err?.message ?? 'connect_error';
		});

		socket.on('pong', () => {
			lastPong = new Date().toLocaleTimeString();
		});
	});

	onDestroy(() => {
		// IMPORTANT: do not disconnect here (we want the socket to persist across navigation)
		socket.off('connect');
		socket.off('disconnect');
		socket.off('connect_error');
		socket.off('pong');
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

			<button class="btn" on:click={ping} disabled={!socket.connected}>ping</button>
			<button class="btn" on:click={disconnect} disabled={!socket.connected}>disconnect</button>
			<button class="btn" on:click={connect} disabled={socket.connected}>connect</button>
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
				<button class="btn primary" on:click={createRoom} disabled={!socket.connected}
					>방 만들기</button
				>
				<button class="btn" on:click={joinRoom} disabled={!socket.connected}>방 참가</button>
			</div>

			<p class="hint">방 만들기/참가 성공 시 자동으로 /room/{'{roomId}'} 로 이동합니다.</p>
		</div>
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
