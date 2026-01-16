export default defineEventHandler((event) => {
    const config = useRuntimeConfig();

    const KAKAO_CLIENT_ID = config.kakaoClientId || process.env.KAKAO_CLIENT_ID;
    const REDIRECT_URI = config.public?.baseUrl
        ? `${config.public.baseUrl}/api/auth/kakao/callback`
        : 'http://localhost:3000/api/auth/kakao/callback';

    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`;

    return sendRedirect(event, kakaoAuthUrl);
});
