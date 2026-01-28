<script lang="ts">
	import type { RoomState } from '$lib/room';

	let { roomState, socketId, onNext } = $props<{
		roomState: RoomState,
		socketId: string,
		onNext: () => void
	}>();

	let me = $derived(roomState.players.find((p: { id: any; }) => p.id === socketId));
	let isMeLiar = $derived(me?.isLiar ?? false);
</script>

<div class="flex flex-col items-center justify-center p-8 space-y-10 min-h-[80vh] animate-bounce-in">
	<div class="text-center space-y-4">
		<h2 class="text-3xl font-bold text-gray-800">당신의 역할은?</h2>
		<div class={`text-7xl p-8 rounded-full bg-white shadow-2xl inline-block border-8 ${isMeLiar ? 'border-orange-400' : 'border-green-400'}`}>
			{isMeLiar ? '🕵️‍♂️' : '🎨'}
		</div>
		<h1 class={`text-5xl font-game ${isMeLiar ? 'text-orange-500' : 'text-green-500'}`}>
			{isMeLiar ? '라이어' : '시민'}
		</h1>
	</div>

	<div class="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center border-4 border-indigo-50">
		<p class="text-gray-500 mb-2 font-bold uppercase tracking-widest">제시어 카테고리: {roomState.category}</p>
		<div class="text-4xl font-black text-indigo-600 py-4 px-6 bg-indigo-50 rounded-2xl">
			{isMeLiar ? '???' : roomState.keyword}
		</div>
		<p class="mt-6 text-sm text-gray-400 leading-relaxed">
			{isMeLiar 
				? '제시어를 모르는 상태에서 눈치껏 그림을 완성하세요! 다른 사람들이 당신을 라이어라고 의심하지 않게 주의해야 합니다.' 
				: `당신은 제시어를 알고 있습니다. 라이어가 눈치채지 못하게 조심하면서, 다른 시민들과 협력해 그림을 완성하세요.`}
		</p>
	</div>

	<button
		onclick={onNext}
		class="px-10 py-4 bg-indigo-600 text-white rounded-full font-bold text-xl shadow-lg hover:bg-indigo-700 transition-all"
	>
		알겠어요!
	</button>
</div>
