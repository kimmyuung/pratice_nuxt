import { connectDB } from '../../../utils/mongoose';
import { User } from '../../../models/User';
import { generateToken } from '../../../utils/jwt';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const code = query.code;

    if (!code) {
        return sendRedirect(event, '/?error=no_code');
    }

    const config = useRuntimeConfig();
    const KAKAO_CLIENT_ID = config.kakaoClientId || process.env.KAKAO_CLIENT_ID;
    const KAKAO_CLIENT_SECRET = config.kakaoClientSecret || process.env.KAKAO_CLIENT_SECRET;

    console.log('[Kakao Callback] Config Check:', {
        hasClientId: !!KAKAO_CLIENT_ID,
        hasClientSecret: !!KAKAO_CLIENT_SECRET,
        clientIdPrefix: KAKAO_CLIENT_ID ? KAKAO_CLIENT_ID.substring(0, 5) : 'N/A'
    });
    const REDIRECT_URI = config.public?.baseUrl
        ? `${config.public.baseUrl}/api/auth/kakao/callback`
        : 'http://localhost:3000/api/auth/kakao/callback';

    try {
        // 1. 액세스 토큰 요청
        const tokenResponse = await $fetch('https://kauth.kakao.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: KAKAO_CLIENT_ID,
                client_secret: KAKAO_CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                code: code
            }).toString()
        });

        const accessToken = tokenResponse.access_token;

        // 2. 사용자 정보 요청
        const userInfo = await $fetch('https://kapi.kakao.com/v2/user/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const kakaoId = userInfo.id.toString();
        const nickname = userInfo.kakao_account?.profile?.nickname || `kakao_${kakaoId}`;
        const email = userInfo.kakao_account?.email || `${kakaoId}@kakao.user`;

        await connectDB();

        // 3. 기존 사용자 확인 또는 신규 생성
        let user = await User.findOne({ provider: 'kakao', providerId: kakaoId });

        if (!user) {
            user = await User.create({
                userid: `kakao_${kakaoId}`,
                name: nickname,
                email: email,
                provider: 'kakao',
                providerId: kakaoId
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
        console.error('[Kakao Callback] Login Error Detail:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?._data || error.message
        });
        return sendRedirect(event, '/?error=kakao_login_failed');
    }
});
