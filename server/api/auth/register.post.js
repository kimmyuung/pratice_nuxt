import bcrypt from 'bcrypt';
import { getDbPool } from '../../utils/db';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    
    // 입력값 검증
    if (!body.userid || !body.name || !body.password || !body.email) {
      return {
        success: false,
        error: '필수 항목을 모두 입력해주세요.'
      };
    }
    
    const pool = getDbPool();
    
    // 중복 아이디 체크
    const [existing] = await pool.query(
      'SELECT userid FROM tbl_user WHERE userid = ?',
      [body.userid]
    );
    
    if (existing.length > 0) {
      return {
        success: false,
        error: '이미 사용중인 아이디입니다.'
      };
    }
    
    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(body.password, 10);
    
    // 취미 배열을 문자열로 변환
    const hobbies = Array.isArray(body.hobbies) ? body.hobbies.join(',') : body.hobbies;
    
    // 회원 등록
    await pool.query(
      'INSERT INTO tbl_user (userid, name, password, email, job, hobbies, gender) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [body.userid, body.name, hashedPassword, body.email, body.job, hobbies, body.gender]
    );
    
    return {
      success: true,
      message: '회원가입이 완료되었습니다.'
    };
  } catch (error) {
    console.error('Register error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});