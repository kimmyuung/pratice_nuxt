
export default defineEventHandler((event) => {
    // auth.global.js 미들웨어에서 이미 토큰 검증 후 user를 context에 넣어둠
    const user = event.context.user;

    if (!user) {
        throw createError({
            statusCode: 401,
            message: '로그인이 필요합니다.'
        });
    }

    return {
        success: true,
        user: user
    };
});
