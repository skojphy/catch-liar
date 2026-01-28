<script lang="ts">
	import type { RoomState } from '$lib/room';
	import DrawingCanvas from './DrawingCanvas.svelte';

	let { roomState, socketId, onVote } = $props<{
		roomState: RoomState,
		socketId: string,
		onVote: (targetId: string) => void
	}>();

	let me = $derived(roomState.players.find((p: { id: any; }) => p.id === socketId));
	let hasVotedLocally = $state(false);

	const handleVote = (id: string) => {
		if (hasVotedLocally) return;
		onVote(id);
		hasVotedLocally = true;
	};
</script>

<div class="flex flex-col items-center p-6 space-y-6 w-full max-w-md mx-auto">
	<div class="text-center space-y-2">
		<h1 class="text-3xl font-game text-indigo-600">누가 라이어인가요?</h1>
		<p class="text-gray-500 font-medium">가장 의심스러운 사람에게 투표하세요!</p>
	</div>

	<div class="w-full aspect-square bg-white rounded-3xl p-4 shadow-xl border-4 border-indigo-100">
		<DrawingCanvas strokes={roomState.strokes} isMyTurn={false} onStrokeComplete={() => {}} disabled />
	</div>

	<div class="grid grid-cols-2 gap-4 w-full">
		{#each roomState.players as p (p.id)}
			<button
				onclick={() => handleVote(p.id)}
				disabled={hasVotedLocally}
				class={`group flex flex-col items-center p-4 bg-white rounded-3xl shadow-md border-2 border-transparent hover:border-indigo-500 transition-all transform hover:-translate-y-1 ${hasVotedLocally ? 'opacity-50 cursor-not-allowed' : ''}`}
			>
				<span class="text-4xl mb-2 group-hover:scale-110 transition-transform">{p.avatar}</span>
				<span class="font-bold text-gray-700">{p.nickname}</span>
			</button>
		{/each}
	</div>
	{#if hasVotedLocally}
		<p class="text-indigo-600 font-bold animate-pulse">투표 완료! 결과를 기다리는 중...</p>
	{/if}
</div>
