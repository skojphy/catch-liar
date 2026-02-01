import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const { code } = await request.json();
    const REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;
    const CLIENT_SECRET = import.meta.env.VITE_KAKAO_CLIENT_SECRET;
    const REDIRECT_URI = 'http://localhost:5173/auth/kakao/callback'; 

    if (!code) {
        return json({ error: 'No code provided' }, { status: 400 });
    }

    try {
        const payload: Record<string, string> = {
            grant_type: 'authorization_code',
            client_id: REST_API_KEY,
            redirect_uri: REDIRECT_URI,
            code: code
        };

        if (CLIENT_SECRET) {
            payload.client_secret = CLIENT_SECRET;
        }

        const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            },
            body: new URLSearchParams(payload)
        });

        const tokenData = await tokenResponse.json();
        
        if (tokenData.error) {
            console.error('Kakao Token Error:', tokenData);
            return json({ error: tokenData.error_description || 'Token Error' }, { status: 400 });
        }

        const accessToken = tokenData.access_token;

        const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            },
        });

        const userData = await userResponse.json();
        
        return json({
            token: accessToken,
            user: {
                id: userData.id,
                nickname: userData.properties?.nickname || userData.kakao_account?.profile?.nickname,
                avatar: userData.properties?.profile_image || userData.kakao_account?.profile?.profile_image_url
            }
        });

    } catch (e) {
        console.error('Kakao API Error:', e);
        return json({ error: 'Internal Server Error' }, { status: 500 });
    }
};
