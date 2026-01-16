export default defineEventHandler((event) => {
    const config = useRuntimeConfig();

    const NAVER_CLIENT_ID = config.naverClientId || process.env.NAVER_CLIENT_ID;
    const REDIRECT_URI = config.public?.baseUrl
        ? `${config.public.baseUrl}/api/auth/naver/callback`
        : 'http://localhost:3000/api/auth/naver/callback';

    // CSRF 방지용 state 생성
    const state = Math.random().toString(36).substring(2, 15);

    setCookie(event, 'naver_state', state, {
        httpOnly: true,
        maxAge: 60 * 5, // 5분
        path: '/'
    });

    const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?client_id=${NAVER_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&state=${state}`;

    return sendRedirect(event, naverAuthUrl);
});
