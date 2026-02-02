<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { saveUserProfile } from '$lib/user';

	let kakaoId = '';
	let nickname = '';
	let avatar = '🐶';
	let loading = false;

	const AVATARS = ['🐶', '🐱', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷'];

	onMount(() => {
		kakaoId = $page.url.searchParams.get('kakaoId') || '';
		if (!kakaoId) {
			alert('잘못된 접근입니다.');
			goto('/');
		}
	});

	const handleRegister = async () => {
		if (!nickname.trim()) {
			alert('닉네임을 입력해주세요.');
			return;
		}

		loading = true;
		try {
			const res = await fetch('http://localhost:3000/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ kakaoId, nickname, avatar })
			});

			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error || '회원가입 실패');
			}

			saveUserProfile({
				userId: data.user.kakaoId, // Use kakaoId as userId for consistency
				nickname: data.user.nickname,
				avatar: data.user.avatar,
				isKakao: true
			});

			alert('회원가입이 완료되었습니다!');
			goto('/');
		} catch (e: any) {
			console.error(e);
			alert(`오류: ${e.message}`);
		} finally {
			loading = false;
		}
	};
</script>

<div
	class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 space-y-8 animate-fade-in"
>
	<div class="text-center space-y-2">
		<h1 class="text-3xl font-bold text-gray-800">회원가입</h1>
		<p class="text-gray-500">닉네임과 프로필을 설정해주세요.</p>
	</div>

	<div class="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border-4 border-white">
		<div class="mb-6 text-center">
			<span class="block text-sm font-bold text-gray-500 mb-2">캐릭터 선택</span>
			<div
				class="text-6xl mb-4 p-4 bg-gray-50 rounded-full inline-block border-2 border-indigo-100"
			>
				{avatar}
			</div>
			<div class="grid grid-cols-6 gap-2">
				{#each AVATARS as a}
					<button
						class={`text-2xl p-2 rounded-xl transition-all ${avatar === a ? 'bg-indigo-100 scale-110 shadow-md' : 'hover:bg-gray-100'}`}
						on:click={() => (avatar = a)}
					>
						{a}
					</button>
				{/each}
			</div>
		</div>

		<div class="mb-8">
			<label for="nickname" class="block text-sm font-bold text-gray-500 mb-2 ml-1">닉네임</label>
			<input
				id="nickname"
				type="text"
				bind:value={nickname}
				placeholder="닉네임을 입력하세요"
				class="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xl font-bold text-center focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-gray-300"
			/>
		</div>

		<button
			on:click={handleRegister}
			disabled={loading || !nickname.trim()}
			class="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xl shadow-xl shadow-indigo-100 transform active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
		>
			{loading ? '가입 중...' : '가입 완료'}
		</button>
	</div>
</div>
