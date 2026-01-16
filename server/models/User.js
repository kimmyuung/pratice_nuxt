import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    userid: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: function () {
            return !this.provider; // 소셜 로그인이 아닌 경우만 필수
        }
    },
    email: {
        type: String,
        required: true
    },
    job: String,
    hobbies: String,
    gender: String,
    // OAuth 관련 필드
    provider: {
        type: String,
        enum: ['local', 'kakao', 'naver'],
        default: 'local'
    },
    providerId: String
}, {
    timestamps: true
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
