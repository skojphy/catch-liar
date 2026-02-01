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
                throw new Error(data.error || '로그인 실패');
            }

            saveUserProfile({
                userId: String(data.user.id),
                nickname: data.user.nickname,
                avatar: data.user.avatar,
                isKakao: true
            });

            status = '로그인 성공! 대기실로 이동합니다.';
            goto('/');
            
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
