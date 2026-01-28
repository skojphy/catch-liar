<script lang="ts">
	import type { RoomState, Stroke } from '$lib/room';
	import DrawingCanvas from './DrawingCanvas.svelte';

	let { roomState, socketId, onStrokeComplete } = $props<{
		roomState: RoomState,
		socketId: string,
		onStrokeComplete: (stroke: any) => void
	}>();

	let currentPlayer = $derived(roomState.players[roomState.turnIndex]);
	let isMyTurn = $derived(currentPlayer?.id === socketId);
	let me = $derived(roomState.players.find((p: { id: any; }) => p.id === socketId));
	let isMeLiar = $derived(me?.isLiar ?? false);
</script>

<div class="flex flex-col items-center p-4 space-y-6 w-full max-w-lg mx-auto">
	<div class="w-full flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
		<div class="flex items-center space-x-3">
			<span class="text-3xl">{currentPlayer?.avatar}</span>
			<div>
				<p class="text-xs text-gray-400 font-bold uppercase">Drawing Now</p>
				<p class="font-bold text-gray-800">{currentPlayer?.nickname}</p>
			</div>
		</div>
		<div class="text-right">
			<p class="text-xs text-gray-400 font-bold">ROUND</p>
			<p class="font-game text-indigo-600 text-xl">{roomState.round}/1</p>
		</div>
	</div>

	<div class="w-full bg-indigo-600 text-white py-3 px-6 rounded-2xl text-center shadow-lg animate-pulse">
		<p class="text-sm font-medium opacity-80">제시어</p>
		<h2 class="text-2xl font-black">{isMeLiar ? '???' : roomState.keyword}</h2>
	</div>

	<DrawingCanvas 
		strokes={roomState.strokes}
		isMyTurn={isMyTurn}
		onStrokeComplete={onStrokeComplete}
	/>

	<div class="w-full grid grid-cols-2 gap-4">
		<div class="bg-white p-4 rounded-2xl shadow-sm flex flex-col items-center">
			<p class="text-[10px] text-gray-400 font-bold mb-1">STROKE LIMIT</p>
			<div class="flex space-x-1">
				<div class={`w-6 h-2 rounded-full ${isMyTurn ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
			</div>
		</div>
		<div class="bg-white p-4 rounded-2xl shadow-sm flex flex-col items-center">
			<p class="text-[10px] text-gray-400 font-bold mb-1">REMAINING</p>
			<p class="font-bold text-gray-700">{roomState.players.length - roomState.turnIndex}명</p>
		</div>
	</div>
</div>
