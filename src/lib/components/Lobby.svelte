<script lang="ts">
	import type { RoomState } from '$lib/room';

	const CATEGORIES = ['동물', '음식', '직업', '물건', '장소', '인물'];

	let { roomState, socketId, onStart, onChangeCategory } = $props<{
		roomState: RoomState,
		socketId: string,
		onStart: () => void,
		onChangeCategory: (cat: string) => void
	}>();

	let isHost = $derived(roomState.players.find((p: { id: any; }) => p.id === socketId)?.isHost ?? false);
	
	$effect(() => {
		console.log('[Lobby] State Updated:', { 
			socketId, 
			isHost, 
			players: roomState.players.map((p: { nickname: any; isHost: any; id: any; }) => ({ n: p.nickname, h: p.isHost, id: p.id })) 
		});
	});
</script>

<div class="flex flex-col items-center justify-center p-6 space-y-8 animate-fade-in">
	<div class="text-center">
		<h1 class="text-5xl font-game text-indigo-600 mb-2">Picture Liar</h1>
		<p class="text-gray-500 font-medium">대기실: <span class="text-indigo-600 font-bold">{roomState.id}</span></p>
	</div>

	<div class="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl border-4 border-white">
		<div class="flex justify-between items-center mb-4">
			<h2 class="text-xl font-bold text-gray-800">참가자 ({roomState.players.length}/8)</h2>
			{#if isHost}
				<span class="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-bold">HOST</span>
			{/if}
		</div>
		<div class="grid grid-cols-2 gap-4">
			{#each roomState.players as p (p.id)}
				<div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
					<span class="text-2xl">{p.avatar || '😀'}</span>
					<span class="font-bold text-gray-700 truncate">{p.nickname}</span>
				</div>
			{/each}
		</div>
	</div>

	{#if isHost}
		<div class="w-full max-w-md space-y-4">
			<div class="bg-white rounded-2xl p-4 shadow-sm">
				<span class="block text-sm font-bold text-gray-500 mb-2">카테고리 선택</span>
				<div class="flex flex-wrap gap-2">
					{#each CATEGORIES as cat}
						<button
							onclick={() => onChangeCategory(cat)}
							class={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
								roomState.category === cat 
								? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105' 
								: 'bg-gray-100 text-gray-500 hover:bg-gray-200'
							}`}
						>
							{cat}
						</button>
					{/each}
				</div>
			</div>
			<button
				onclick={onStart}
				class="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xl shadow-xl shadow-indigo-100 transform active:scale-95 transition-all"
			>
				게임 시작!
			</button>
		</div>
	{:else}
		<div class="text-center text-gray-400 font-bold animate-pulse">
			호스트가 게임을 시작하기를 기다리는 중...
		</div>
	{/if}

	<div class="flex flex-wrap gap-2 justify-center mt-4">
		<div class="text-xs text-gray-400">
			Current Category: <strong>{roomState.category}</strong>
		</div>
	</div>
</div>
