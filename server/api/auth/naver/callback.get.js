import { connectDB } from '../../../utils/mongoose';
import { User } from '../../../models/User';
import { generateToken } from '../../../utils/jwt';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const code = query.code;
    const state = query.state;

    // CSRF 검증
    const savedState = getCookie(event, 'naver_state');
    if (!state || state !== savedState) {
        return sendRedirect(event, '/?error=invalid_state');
    }

    // state 쿠키 삭제
    deleteCookie(event, 'naver_state');

    if (!code) {
        return sendRedirect(event, '/?error=no_code');
    }

    const config = useRuntimeConfig();
    const NAVER_CLIENT_ID = config.naverClientId || process.env.NAVER_CLIENT_ID;
    const NAVER_CLIENT_SECRET = config.naverClientSecret || process.env.NAVER_CLIENT_SECRET;

    console.log('[Naver Callback] Config Check:', {
        hasClientId: !!NAVER_CLIENT_ID,
        hasClientSecret: !!NAVER_CLIENT_SECRET,
        clientIdPrefix: NAVER_CLIENT_ID ? NAVER_CLIENT_ID.substring(0, 5) : 'N/A'
    });

    try {
        // 1. 액세스 토큰 요청
        const tokenResponse = await $fetch('https://nid.naver.com/oauth2.0/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: NAVER_CLIENT_ID,
                client_secret: NAVER_CLIENT_SECRET,
                code: code,
                state: state
            }).toString()
        });

        const accessToken = tokenResponse.access_token;

        // 2. 사용자 정보 요청
        const userInfoResponse = await $fetch('https://openapi.naver.com/v1/nid/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const userInfo = userInfoResponse.response;
        const naverId = userInfo.id;
        const nickname = userInfo.nickname || userInfo.name || `naver_${naverId}`;
        const email = userInfo.email || `${naverId}@naver.user`;

        await connectDB();

        // 3. 기존 사용자 확인 또는 신규 생성
        let user = await User.findOne({ provider: 'naver', providerId: naverId });

        if (!user) {
            user = await User.create({
                userid: `naver_${naverId}`,
                name: nickname,
                email: email,
                provider: 'naver',
                providerId: naverId
            });
        }

        // 4. JWT 토큰 생성
        const token = generateToken({
            userid: user.userid,
            name: user.name
        });

        // 5. 쿠키 설정
        setCookie(event, 'auth_token', token, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24,
            path: '/'
        });

        setCookie(event, 'user_name', user.name, {
            maxAge: 60 * 60 * 24,
            path: '/'
        });

        setCookie(event, 'user_id', user.userid, {
            maxAge: 60 * 60 * 24,
            path: '/'
        });

        // 6. 게시판으로 리다이렉트
        return sendRedirect(event, '/board/list');

    } catch (error) {
        console.error('[Naver Callback] Login Error Detail:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?._data || error.message
        });
        return sendRedirect(event, '/?error=naver_login_failed');
    }
});
