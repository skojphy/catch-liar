export const KAKAO_CONFIG = {
    REST_API_KEY: import.meta.env.VITE_KAKAO_REST_API_KEY,
    REDIRECT_URI: 'http://localhost:5173/auth/kakao/callback'
};

export const getKakaoAuthUrl = () => {
    return `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CONFIG.REST_API_KEY}&redirect_uri=${encodeURIComponent(KAKAO_CONFIG.REDIRECT_URI)}&response_type=code`;
};
