export default defineNuxtConfig({
  devtools: { enabled: true },

  runtimeConfig: {
    // 서버 전용 (클라이언트에 노출되지 않음)
    kakaoClientId: process.env.KAKAO_CLIENT_ID,
    kakaoClientSecret: process.env.KAKAO_CLIENT_SECRET,
    naverClientId: process.env.NAVER_CLIENT_ID,
    naverClientSecret: process.env.NAVER_CLIENT_SECRET,

    // 공개 설정
    public: {
      baseUrl: process.env.BASE_URL || 'http://localhost:3000'
    }
  }
})