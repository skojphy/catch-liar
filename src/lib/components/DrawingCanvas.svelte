<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Stroke } from '$lib/room';

	let { 
		strokes, 
		isMyTurn, 
		onStrokeComplete, 
		disabled = false 
	} = $props<{
		strokes: Stroke[],
		isMyTurn: boolean,
		onStrokeComplete: (stroke: any) => void,
		disabled?: boolean
	}>();

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let isDrawing = false;
	let currentPoints: { x: number; y: number }[] = [];

	const drawStroke = (context: CanvasRenderingContext2D, stroke: any) => {
		if (stroke.points && stroke.points.length > 0) {
			// Points based drawing
			if (stroke.points.length < 2) return;
			context.beginPath();
			context.moveTo(stroke.points[0].x, stroke.points[0].y);
			stroke.points.forEach((point: any, i: number) => {
				if (i > 0) context.lineTo(point.x, point.y);
			});
			context.strokeStyle = stroke.color;
			context.lineWidth = stroke.width;
			context.lineCap = 'round';
			context.lineJoin = 'round';
			context.stroke();
		} else if (stroke.d) {
			// SVG path based drawing (legacy support if needed, or if we convert points to path)
			const p = new Path2D(stroke.d);
			context.strokeStyle = stroke.color || '#000';
			context.lineWidth = stroke.width || 4;
			context.lineCap = 'round';
			context.lineJoin = 'round';
			context.stroke(p);
		}
	};

	const render = () => {
		if (!ctx || !canvas) return;
		
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.strokeStyle = '#E5E7EB';
		ctx.lineWidth = 1;
		ctx.beginPath();
		for (let i = 0; i < canvas.width; i += 20) {
			ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height);
		}
		for (let j = 0; j < canvas.height; j += 20) {
			ctx.moveTo(0, j); ctx.lineTo(canvas.width, j);
		}
		ctx.stroke();

		strokes.forEach((s: any) => drawStroke(ctx!, s));

		if (currentPoints.length > 1) {
			drawStroke(ctx!, {
				points: currentPoints,
				color: '#4F46E5',
				width: 4
			});
		}
	};

	$effect(() => {
		render(); 
		if (strokes) {};
		if (currentPoints) {};
	});

	onMount(() => {
		ctx = canvas.getContext('2d');
		render();
	});

	const getCoordinates = (e: MouseEvent | TouchEvent) => {
		if (!canvas) return { x: 0, y: 0 };
		const rect = canvas.getBoundingClientRect();
		const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
		const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
		return {
			x: clientX - rect.left,
			y: clientY - rect.top
		};
	};

	const handleStart = (e: MouseEvent | TouchEvent) => {
		if (!isMyTurn || disabled) return;
		e.preventDefault();
		isDrawing = true;
		const coords = getCoordinates(e);
		currentPoints = [coords];
	};

	const handleMove = (e: MouseEvent | TouchEvent) => {
		if (!isDrawing || !isMyTurn || disabled) return;
		e.preventDefault();
		const coords = getCoordinates(e);
		currentPoints = [...currentPoints, coords];
	};

	const handleEnd = () => {
		if (!isDrawing) return;
		isDrawing = false;
		if (currentPoints.length > 1) {
			const d = `M ${currentPoints[0].x} ${currentPoints[0].y} ` + 
					  currentPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');

			onStrokeComplete({
				points: currentPoints,
				d,
				color: '#4F46E5',
				width: 4
			});
		}
		currentPoints = [];
	};

</script>

<div class="relative w-full aspect-square bg-white rounded-3xl shadow-inner border-4 border-indigo-100 overflow-hidden touch-none">
	<canvas
		bind:this={canvas}
		width={400}
		height={400}
		class="w-full h-full cursor-crosshair"
		onmousedown={handleStart}
		onmousemove={handleMove}
		onmouseup={handleEnd}
		onmouseleave={handleEnd}
		ontouchstart={handleStart}
		ontouchmove={handleMove}
		ontouchend={handleEnd}
	></canvas>
	
	{#if !isMyTurn && !disabled}
		<div class="absolute inset-0 bg-black/5 flex items-center justify-center pointer-events-none">
			<p class="bg-white/90 px-4 py-2 rounded-full text-sm font-bold text-gray-500 shadow-sm border border-gray-100">
				상대방의 차례를 기다리는 중...
			</p>
		</div>
	{/if}
</div>
