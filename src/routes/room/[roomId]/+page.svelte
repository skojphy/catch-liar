<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import { getSocket } from '$lib/socket';
	import { roomStore, errorStore, setError, type RoomState } from '$lib/room';

	let socketId = '';
	let nickname = '';
	let roomId = '';

	const s = getSocket();

	let drawing = false;
	let points: Array<{ x: number; y: number }> = [];
	let myPathD = '';
	let hasCommitted = false;

	const toPathD = (pts: Array<{ x: number; y: number }>) => {
		if (pts.length < 2) return '';
		return (
			`M ${pts[0].x} ${pts[0].y} ` +
			pts
				.slice(1)
				.map((p) => `L ${p.x} ${p.y}`)
				.join(' ')
		);
	};

	const getLocalPoint = (e: PointerEvent) => {
		const el = e.currentTarget as SVGSVGElement;
		const rect = el.getBoundingClientRect();
		return { x: Math.round(e.clientX - rect.left), y: Math.round(e.clientY - rect.top) };
	};

	const onPointerDown = (e: PointerEvent) => {
		setError('');
		if (hasCommitted) return;
		drawing = true;
		points = [getLocalPoint(e)];
		myPathD = toPathD(points);
	};

	const onPointerMove = (e: PointerEvent) => {
		if (!drawing) return;
		points = [...points, getLocalPoint(e)];
		myPathD = toPathD(points);
	};

	const onPointerUp = () => {
		if (!drawing) return;
		drawing = false;

		const d = myPathD;
		if (!d) return;

		// 서버로 커밋
		s.emit('stroke:commit', { roomId, d }, (res: { ok: boolean; error?: string }) => {
			if (!res.ok) setError(res.error ?? 'STROKE_COMMIT_FAILED');
			else hasCommitted = true;
		});
	};

	onMount(() => {
		roomId = get(page).params.roomId ?? '';

		// 닉네임이 없으면 임시로 입력받기 (MVP)
		nickname = window.localStorage.getItem('nickname') ?? '';
		if (!nickname) {
			nickname = window.prompt('닉네임을 입력해 주세요') ?? '';
			nickname = nickname.trim();
			if (nickname) window.localStorage.setItem('nickname', nickname);
		}

		s.on('connect', () => {
			socketId = s.id ?? '';
			// 방 자동 join
			s.emit('room:join', { roomId, nickname }, (res: { ok: boolean; error?: string }) => {
				if (!res.ok) setError(res.error ?? 'JOIN_FAILED');
			});
		});

		s.on('room:state', (nextRoom: RoomState) => {
			roomStore.set(nextRoom);
			// 새 라운드/상태 변화 시 “한 획 제한” 리셋하고 싶으면 여기서 조건 걸면 됨
			// (예: nextRoom.phase 바뀔 때 hasCommitted=false)
		});

		// 이미 연결돼 있으면 connect 이벤트 안 기다리고 join
		if (s.connected) {
			socketId = s.id ?? '';
			s.emit('room:join', { roomId, nickname }, (res: { ok: boolean; error?: string }) => {
				if (!res.ok) setError(res.error ?? 'JOIN_FAILED');
			});
		}
	});

	onDestroy(() => {
		s.off('connect');
		s.off('room:state');
	});
</script>

<main class="wrap">
	<header class="header">
		<h1 class="title">Room: {roomId}</h1>
		{#if $errorStore}<p class="error">{$errorStore}</p>{/if}
	</header>

	{#if $roomStore}
		<section class="panel">
			<div class="row">
				<span class="pill">phase: <strong>{$roomStore.phase}</strong></span>
				<span class="pill">me: <span class="mono">{socketId}</span></span>
				<span class="pill">one-stroke: <strong>{hasCommitted ? 'USED' : 'READY'}</strong></span>
			</div>

			<div class="list">
				{#each $roomStore.players as p (p.id)}
					<div class="player">
						<span><strong>{p.nickname}</strong> {p.isHost ? '(HOST)' : ''}</span>
						<span class="mono">{p.id}</span>
					</div>
				{/each}
			</div>
		</section>

		<section class="panel">
			<h2 class="h2">Drawing</h2>

			<svg
				class="board"
				viewBox="0 0 800 450"
				on:pointerdown={onPointerDown}
				on:pointermove={onPointerMove}
				on:pointerup={onPointerUp}
				on:pointerleave={onPointerUp}
				role="img"
			>
				{#each $roomStore.strokes as st, idx (idx)}
					<path
						d={st.d}
						fill="none"
						stroke="black"
						stroke-width="4"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				{/each}

				{#if myPathD && drawing}
					<path
						d={myPathD}
						fill="none"
						stroke="black"
						stroke-width="4"
						stroke-linecap="round"
						stroke-linejoin="round"
						opacity="0.35"
					/>
				{/if}
			</svg>

			<p class="hint">한 획만 가능: 마우스(또는 터치)로 한 번 그어서 떼면 커밋됩니다.</p>
		</section>
	{:else}
		<p class="hint">방 상태를 기다리는 중…</p>
	{/if}
</main>

<style>
	.wrap {
		max-width: 980px;
		margin: 0 auto;
		padding: 24px 16px 56px;
		display: grid;
		gap: 16px;
	}
	.header {
		display: grid;
		gap: 8px;
	}
	.title {
		margin: 0;
		font-size: 22px;
		font-weight: 900;
	}
	.panel {
		border: 1px solid rgba(0, 0, 0, 0.12);
		border-radius: 12px;
		padding: 16px;
		background: rgba(255, 255, 255, 0.75);
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
		margin-bottom: 12px;
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
	.list {
		display: grid;
		gap: 8px;
	}
	.player {
		display: flex;
		justify-content: space-between;
		gap: 10px;
		border: 1px solid rgba(0, 0, 0, 0.12);
		border-radius: 10px;
		padding: 10px 12px;
		background: rgba(255, 255, 255, 0.9);
	}
	.h2 {
		margin: 0 0 10px;
		font-size: 16px;
		font-weight: 900;
	}
	.board {
		width: 100%;
		height: auto;
		border: 1px solid rgba(0, 0, 0, 0.14);
		border-radius: 12px;
		background: white;
		touch-action: none;
	}
	.hint {
		margin: 10px 0 0;
		opacity: 0.75;
	}
	.error {
		margin: 0;
		color: #b42318;
		font-weight: 900;
	}
</style>
