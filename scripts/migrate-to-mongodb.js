/**
 * MySQL → MongoDB 데이터 마이그레이션 스크립트
 * 
 * 사용법:
 * 1. .env 파일에 MONGODB_URI 설정
 * 2. MySQL 연결 정보 확인 (아래 config 수정)
 * 3. node scripts/migrate-to-mongodb.js 실행
 */

import mysql from 'mysql2/promise';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// MongoDB 모델 (인라인 정의)
const userSchema = new mongoose.Schema({
    userid: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: String,
    email: { type: String, required: true },
    job: String,
    hobbies: String,
    gender: String,
    provider: { type: String, enum: ['local', 'kakao', 'naver'], default: 'local' },
    providerId: String
}, { timestamps: true });

const boardSchema = new mongoose.Schema({
    userid: { type: String, required: true },
    writer: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    hitno: { type: Number, default: 0 }
}, { timestamps: { createdAt: 'regDate', updatedAt: 'updatedAt' } });

const User = mongoose.model('User', userSchema);
const Board = mongoose.model('Board', boardSchema);

// MySQL 설정 (기존 db.js 참조)
const mysqlConfig = {
    host: 'localhost',
    user: 'user',
    password: '1234',
    database: 'boarddev'
};

// MongoDB 설정
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/boarddev';

async function migrate() {
    console.log('🚀 마이그레이션 시작...\n');

    // MySQL 연결
    console.log('📦 MySQL 연결 중...');
    const mysqlPool = mysql.createPool(mysqlConfig);

    // MongoDB 연결
    console.log('📦 MongoDB 연결 중...');
    await mongoose.connect(mongoUri);
    console.log('✅ 데이터베이스 연결 완료\n');

    try {
        // 1. 사용자 마이그레이션
        console.log('👤 사용자 데이터 마이그레이션...');
        const [users] = await mysqlPool.query('SELECT * FROM tbl_user');
        console.log(`   발견된 사용자: ${users.length}명`);

        let userCount = 0;
        for (const user of users) {
            const exists = await User.findOne({ userid: user.userid });
            if (!exists) {
                await User.create({
                    userid: user.userid,
                    name: user.name,
                    password: user.password,
                    email: user.email,
                    job: user.job,
                    hobbies: user.hobbies,
                    gender: user.gender,
                    provider: 'local'
                });
                userCount++;
            }
        }
        console.log(`   ✅ ${userCount}명 마이그레이션 완료\n`);

        // 2. 게시글 마이그레이션
        console.log('📝 게시글 데이터 마이그레이션...');
        const [boards] = await mysqlPool.query('SELECT * FROM tbl_board');
        console.log(`   발견된 게시글: ${boards.length}개`);

        let boardCount = 0;
        for (const board of boards) {
            await Board.create({
                userid: board.userid,
                writer: board.writer,
                title: board.title,
                content: board.content || '',
                hitno: board.hitno || 0,
                regDate: board.regDate
            });
            boardCount++;
        }
        console.log(`   ✅ ${boardCount}개 마이그레이션 완료\n`);

        console.log('🎉 마이그레이션 완료!');
        console.log(`   - 사용자: ${userCount}명`);
        console.log(`   - 게시글: ${boardCount}개`);

    } catch (error) {
        console.error('❌ 마이그레이션 오류:', error);
    } finally {
        await mysqlPool.end();
        await mongoose.disconnect();
    }
}

migrate();
