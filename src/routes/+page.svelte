<script lang="ts">
	import { goto } from '$app/navigation';
	import { getSocket } from '$lib/socket';

	let nickname = $state('');
	let roomCode = $state('');
	let loading = $state(false);
	let activeTab = $state<'create' | 'join'>('create');
	
	const s = getSocket();

	$effect(() => {
		const saved = window.localStorage.getItem('nickname');
		if (saved) nickname = saved;
	});

	const handleAction = () => {
		if (!nickname.trim()) {
			alert('닉네임을 입력해주세요!');
			return;
		}

		if (activeTab === 'join' && !roomCode.trim()) {
			alert('방 코드를 입력해주세요!');
			return;
		}
		
		loading = true;
		window.localStorage.setItem('nickname', nickname);
		
		if (!s.connected) {
			s.connect();
		}

		const onConnect = () => {
			if (activeTab === 'create') {
				s.emit('room:create', { nickname }, (res: { roomId: string }) => {
					loading = false;
					if (res.roomId) {
						goto(`/room/${res.roomId}`);
					}
				});
			} else {
				s.emit('room:join', { roomId: roomCode.toUpperCase(), nickname }, (res: { ok: boolean; error?: string }) => {
					loading = false;
					if (res.ok) {
						goto(`/room/${roomCode.toUpperCase()}`);
					} else {
						alert(res.error === 'ROOM_NOT_FOUND' ? '방을 찾을 수 없습니다.' : 
							  res.error === 'ROOM_ALREADY_STARTED' ? '이미 게임이 시작되었습니다.' : 
							  '방 입장에 실패했습니다.');
					}
				});
			}
			s.off('connect', onConnect);
		};

		if (s.connected) {
			onConnect();
		} else {
			s.on('connect', onConnect);
		}
	};
</script>

<div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 space-y-10 animate-fade-in relative overflow-hidden">
	<div class="absolute inset-0 pointer-events-none opacity-50">
		<div class="absolute top-20 left-20 text-6xl opacity-20 rotate-12">🎨</div>
		<div class="absolute bottom-20 right-20 text-6xl opacity-20 -rotate-12">🕵️‍♂️</div>
		<div class="absolute top-1/2 left-1/4 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
		<div class="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
	</div>

	<div class="z-10 text-center space-y-2">
		<h1 class="text-7xl font-game text-indigo-600 mb-2 drop-shadow-xl tracking-wide">Picture Liar</h1>
		<p class="text-xl text-gray-500 font-bold">그림 속에 숨은 라이어를 찾아라!</p>
	</div>

	<div class="z-10 w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border-4 border-white transform transition-all duration-300">
		<div class="flex p-1 bg-gray-100 rounded-2xl mb-6">
			<button 
				class={`flex-1 py-3 px-4 rounded-xl text-lg font-bold transition-all ${activeTab === 'create' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
				onclick={() => activeTab = 'create'}
			>
				방 만들기
			</button>
			<button 
				class={`flex-1 py-3 px-4 rounded-xl text-lg font-bold transition-all ${activeTab === 'join' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
				onclick={() => activeTab = 'join'}
			>
				코드 입력
			</button>
		</div>

		<div class="space-y-6">
			<div>
				<label for="nickname" class="block text-sm font-bold text-gray-500 mb-2 ml-1">닉네임</label>
				<input
					id="nickname"
					type="text"
					bind:value={nickname}
					placeholder="사용할 닉네임을 입력하세요"
					onkeydown={(e) => e.key === 'Enter' && handleAction()}
					class="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xl font-bold text-center focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-gray-300"
				/>
			</div>

			{#if activeTab === 'join'}
				<div class="animate-fade-in">
					<label for="roomCode" class="block text-sm font-bold text-gray-500 mb-2 ml-1">방 코드</label>
					<input
						id="roomCode"
						type="text"
						bind:value={roomCode}
						placeholder="입장 코드를 입력하세요"
						onkeydown={(e) => e.key === 'Enter' && handleAction()}
						class="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xl font-bold text-center focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-gray-300 uppercase"
					/>
				</div>
			{/if}

			<button
				onclick={handleAction}
				disabled={loading || !nickname.trim() || (activeTab === 'join' && !roomCode.trim())}
				class={`w-full py-5 text-white rounded-2xl font-bold text-xl shadow-xl transform active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 group relative overflow-hidden ${activeTab === 'create' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' : 'bg-gray-800 hover:bg-gray-900 shadow-gray-200'}`}
			>
				<span class="relative z-10 flex items-center justify-center gap-2">
					{#if loading}
						<svg class="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						{activeTab === 'create' ? '방 만드는 중...' : '입장 중...'}
					{:else}
						{#if activeTab === 'create'}
							<i class="fa-solid fa-gamepad"></i> 새로운 방 만들기
						{:else}
							<i class="fa-solid fa-door-open"></i> 방 입장하기
						{/if}
					{/if}
				</span>
			</button>
		</div>
	</div>

	<footer class="z-10 text-gray-400 font-medium text-sm text-center">
		<p>© 2026 Picture Liar by seohey</p>
	</footer>
</div>

<style>
	@keyframes blob {
		0% { transform: translate(0px, 0px) scale(1); }
		33% { transform: translate(30px, -50px) scale(1.1); }
		66% { transform: translate(-20px, 20px) scale(0.9); }
		100% { transform: translate(0px, 0px) scale(1); }
	}
	.animate-blob {
		animation: blob 7s infinite;
	}
	.animation-delay-2000 {
		animation-delay: 2s;
	}
</style>
