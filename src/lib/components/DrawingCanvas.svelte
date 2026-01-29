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
	let animationFrameId: number;

	const drawStroke = (context: CanvasRenderingContext2D, stroke: any) => {
		if (stroke.points && stroke.points.length > 0) {
			if (stroke.points.length < 2) {
				// Draw a dot if only 1 point
				context.fillStyle = stroke.color;
				context.beginPath();
				context.arc(stroke.points[0].x, stroke.points[0].y, stroke.width / 2, 0, Math.PI * 2);
				context.fill();
				return;
			}
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

		// Grid
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

		// Networked strokes
		strokes.forEach((s: any) => drawStroke(ctx!, s));

		// Local active stroke
		if (currentPoints.length > 0) {
			drawStroke(ctx!, {
				points: currentPoints,
				color: '#4F46E5',
				width: 4
			});
		}
		
		animationFrameId = requestAnimationFrame(render);
	};

	onMount(() => {
		ctx = canvas.getContext('2d');
		// Start render loop
		render();
		
		return () => cancelAnimationFrame(animationFrameId);
	});

	// Better coordinate calculation accounting for scale
	const getCoordinates = (e: MouseEvent | TouchEvent) => {
		if (!canvas) return { x: 0, y: 0 };
		const rect = canvas.getBoundingClientRect();
		// Account for CSS scaling (displayed size vs actual canvas resolution)
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		
		const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
		const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
		
		return {
			x: (clientX - rect.left) * scaleX,
			y: (clientY - rect.top) * scaleY
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
		currentPoints.push(coords); // Push directly to avoid spread overhead in loop
	};

	const handleEnd = () => {
		if (!isDrawing) return;
		isDrawing = false;
		if (currentPoints.length > 0) {
			const d = `M ${currentPoints[0].x} ${currentPoints[0].y} ` + 
					  currentPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');

			onStrokeComplete({
				points: [...currentPoints], // copy
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
		width={800} 
		height={800}
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
