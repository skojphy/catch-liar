<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { saveUserProfile } from '$lib/user';

	let status = '카카오 로그인 중...';

	onMount(async () => {
		const code = $page.url.searchParams.get('code');
		if (!code) {
			status = '인가 코드가 없습니다.';
			setTimeout(() => goto('/'), 2000);
			return;
		}

		try {
			const res = await fetch('/api/kakao/token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code })
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || '카카오 로그인 실패');
			}

			const kakaoId = String(data.user.id);
			const userNickname = data.user.nickname;
			const userAvatar = data.user.avatar;

			const authRes = await fetch('http://localhost:3000/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ kakaoId })
			});

			const authData = await authRes.json();

			if (authData.exists) {
				saveUserProfile({
					userId: authData.user.kakaoId,
					nickname: authData.user.nickname,
					avatar: authData.user.avatar,
					isKakao: true
				});
				status = `환영합니다, ${authData.user.nickname}님!`;
				setTimeout(() => goto('/'), 1000);
			} else {
				status = '회원가입이 필요합니다.';
				setTimeout(() => goto(`/register?kakaoId=${kakaoId}`), 1000);
			}
		} catch (e: any) {
			console.error(e);
			status = `오류 발생: ${e.message}`;
			setTimeout(() => goto('/'), 3000);
		}
	});
</script>

<div class="flex items-center justify-center min-h-screen bg-yellow-400">
	<div class="bg-white p-8 rounded-2xl shadow-xl text-center">
		<h2 class="text-xl font-bold mb-2">Kakao Login</h2>
		<p class="text-gray-600 animate-pulse">{status}</p>
	</div>
</div>
