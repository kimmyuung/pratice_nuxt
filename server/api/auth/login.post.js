import bcrypt from 'bcrypt';
import { getDbPool } from '../../utils/db';
import { generateToken } from '../../utils/jwt';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    
    if (!body.userid || !body.password) {
      return {
        success: false,
        error: '아이디와 비밀번호를 입력해주세요.'
      };
    }
    
    const pool = getDbPool();
    
    // 사용자 조회
    const [users] = await pool.query(
      'SELECT userid, name, password FROM tbl_user WHERE userid = ?',
      [body.userid]
    );
    
    if (users.length === 0) {
      return {
        success: false,
        error: '아이디 또는 비밀번호가 일치하지 않습니다.'
      };
    }
    
    const user = users[0];
    
    // 비밀번호 확인
    const isValid = await bcrypt.compare(body.password, user.password);
    
    if (!isValid) {
      return {
        success: false,
        error: '아이디 또는 비밀번호가 일치하지 않습니다.'
      };
    }
    
    // JWT 토큰 생성
    const token = generateToken({
      userid: user.userid,
      name: user.name
    });
    
    // 쿠키에 토큰 저장
    setCookie(event, 'auth_token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 24시간
      path: '/'
    });
    
    // 사용자 정보 쿠키 저장
    setCookie(event, 'user_name', user.name, {
      maxAge: 60 * 60 * 24,
      path: '/'
    });
    
    setCookie(event, 'user_id', user.userid, {
      maxAge: 60 * 60 * 24,
      path: '/'
    });
    
    return {
      success: true,
      user: {
        userid: user.userid,
        name: user.name
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});