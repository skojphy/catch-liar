<script lang="ts">
	import type { RoomState } from '$lib/room';

	let { roomState, onReset, onHome } = $props<{
		roomState: RoomState,
		onReset: () => void,
		onHome: () => void
	}>();

	let isCitizenWin = $derived(roomState.winningTeam === 'CITIZEN');
	let liar = $derived(roomState.players.find((p: { isLiar: any; }) => p.isLiar));
</script>

<div class="flex flex-col items-center justify-center p-8 space-y-10 min-h-[90vh] animate-fade-in">
	<div class="text-center">
		<h1 class={`text-6xl font-game mb-4 drop-shadow-lg ${isCitizenWin ? 'text-green-500' : 'text-orange-500'}`}>
			{isCitizenWin ? '시민 승리!' : '라이어 승리!'}
		</h1>
		<p class="text-gray-500 font-bold text-lg">
			{isCitizenWin ? '라이어가 제시어를 맞추지 못했습니다.' : '라이어가 제시어를 맞췄거나 투표를 피했습니다!'}
		</p>
	</div>

	<div class="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
		<div class="bg-indigo-600 p-4 text-center text-white font-bold">게임 결과 요약</div>
		<div class="p-6 space-y-4">
			<div class="flex justify-between items-center pb-4 border-b">
				<span class="text-gray-400 font-bold">카테고리</span>
				<span class="font-bold text-gray-800">{roomState.category}</span>
			</div>
			<div class="flex justify-between items-center pb-4 border-b">
				<span class="text-gray-400 font-bold">제시어</span>
				<span class="text-2xl font-black text-indigo-600">{roomState.keyword}</span>
			</div>
			<div class="flex justify-between items-center">
				<span class="text-gray-400 font-bold">진짜 라이어</span>
				<div class="flex items-center space-x-2">
					<span class="text-xl">{liar?.avatar}</span>
					<span class="font-bold text-orange-500">{liar?.nickname}</span>
				</div>
			</div>
		</div>
	</div>

	<div class="w-full max-w-sm grid grid-cols-2 gap-4">
		<button
			onclick={onHome}
			class="py-4 bg-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-300 transition-all"
		>
			홈으로
		</button>
		<button
			onclick={onReset}
			class="py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all"
		>
			다시 한 판!
		</button>
	</div>
</div>
