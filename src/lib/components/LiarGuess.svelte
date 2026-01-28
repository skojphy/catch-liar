<script lang="ts">
	import type { RoomState } from '$lib/room';

	let { roomState, socketId, onGuess } = $props<{
		roomState: RoomState,
		socketId: string,
		onGuess: (keyword: string) => void
	}>();

	let guessInput = $state('');
	let loading = $state(false);
	
	let isLiar = $derived(roomState.liarId === socketId);

	const handleGuess = () => {
		if (!guessInput) return;
		loading = true;
		onGuess(guessInput);
	};
</script>

<div class="flex flex-col items-center justify-center p-8 space-y-8 min-h-[80vh] animate-fade-in">
	<div class="text-center space-y-4">
		<div class="text-7xl animate-bounce">🕵️‍♂️</div>
		<h1 class="text-4xl font-game text-orange-500">라이어 검거 완료!</h1>
		<p class="text-gray-600 font-medium">하지만 아직 끝이 아닙니다...<br/>라이어가 제시어를 맞추면 라이어의 승리입니다!</p>
	</div>

	{#if isLiar}
		<div class="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl border-4 border-orange-100">
			<label for="guess" class="block text-sm font-bold text-gray-400 mb-4 text-center">라이어의 마지막 추측</label>
			<input
				id="guess"
				type="text"
				bind:value={guessInput}
				placeholder="제시어는 무엇일까요?"
				class="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xl font-bold text-center focus:outline-none focus:border-orange-400 transition-colors"
			/>
			<button
				onclick={handleGuess}
				disabled={loading || !guessInput}
				class="w-full mt-6 py-4 bg-orange-500 text-white rounded-2xl font-bold text-xl shadow-lg hover:bg-orange-600 disabled:opacity-50"
			>
				{loading ? '제출 중...' : '제출하기'}
			</button>
		</div>
	{:else}
		<div class="text-xl font-bold text-gray-500 animate-pulse">
			라이어가 제시어를 맞추고 있습니다...
		</div>
	{/if}
</div>
