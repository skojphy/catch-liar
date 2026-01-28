<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import { getSocket } from '$lib/socket';
	import { roomStore, errorStore, setError, type RoomState } from '$lib/room';
	import Lobby from '$lib/components/Lobby.svelte';
	import RoleReveal from '$lib/components/RoleReveal.svelte';
	import DrawingPhase from '$lib/components/DrawingPhase.svelte';
	import Voting from '$lib/components/Voting.svelte';
	import LiarGuess from '$lib/components/LiarGuess.svelte';
	import Results from '$lib/components/Results.svelte';

	let socketId = $state('');
	let nickname = $state('');
	let roomId = $state('');

	const s = getSocket();

	const handleStartGame = () => {
		s.emit('game:start', {});
	};

	const handleChangeCategory = (category: string) => {
		s.emit('game:change_category', { category });
	};

	const handleNextPhase = () => {
		s.emit('game:next_phase', { phase: 'drawing' });
	};

	const handleStrokeComplete = (stroke: any) => {
		s.emit('stroke:commit', stroke);
	};

	const handleVote = (targetId: string) => {
		s.emit('game:vote', { targetId });
	};

	const handleLiarGuess = (keyword: string) => {
		s.emit('game:liar_guess', { keyword });
	};

	const handleReset = () => {
		s.emit('game:reset');
	};
	
	const handleHome = () => {
		window.location.href = '/';
	};

	onMount(() => {
		roomId = get(page).params.roomId ?? '';

		nickname = window.localStorage.getItem('nickname') ?? '';
		if (!nickname) {
			nickname = window.prompt('닉네임을 입력해 주세요') ?? '';
			nickname = nickname.trim();
			if (nickname) window.localStorage.setItem('nickname', nickname);
		}

		s.on('connect', () => {
			socketId = s.id ?? '';
			s.emit('room:join', { roomId, nickname }, (res: { ok: boolean; error?: string }) => {
				if (!res.ok) setError(res.error ?? 'JOIN_FAILED');
			});
		});

		s.on('room:state', (nextRoom: RoomState) => {
			roomStore.set(nextRoom);
		});

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

<div class="min-h-screen max-w-2xl mx-auto bg-gray-50 flex flex-col justify-center">
	{#if $errorStore}
		<div class="p-4 bg-red-100 text-red-700 text-center font-bold">
			{$errorStore}
		</div>
	{/if}

	{#if $roomStore}
		{#if $roomStore.phase === 'lobby'}
			<Lobby 
				roomState={$roomStore} 
				socketId={socketId}
				onStart={handleStartGame}
				onChangeCategory={handleChangeCategory}
			/>
		{:else if $roomStore.phase === 'role_reveal'}
			<RoleReveal 
				roomState={$roomStore} 
				socketId={socketId}
				onNext={handleNextPhase}
			/>
		{:else if $roomStore.phase === 'drawing'}
			<DrawingPhase 
				roomState={$roomStore} 
				socketId={socketId}
				onStrokeComplete={handleStrokeComplete}
			/>
		{:else if $roomStore.phase === 'voting'}
			<Voting 
				roomState={$roomStore} 
				socketId={socketId}
				onVote={handleVote}
			/>
		{:else if $roomStore.phase === 'liar_guess'}
			<LiarGuess 
				roomState={$roomStore} 
				socketId={socketId}
				onGuess={handleLiarGuess}
			/>
		{:else if $roomStore.phase === 'result'}
			<Results 
				roomState={$roomStore} 
				onReset={handleReset}
				onHome={handleHome}
			/>
		{/if}
	{:else}
		<div class="flex items-center justify-center min-h-[50vh]">
			<p class="text-gray-400 font-bold animate-pulse">방에 접속 중입니다...</p>
		</div>
	{/if}
</div>
