import { getDbPool } from '../../utils/db';

export default defineEventHandler(async (event) => {
  try {
    const id = event.context.params.id;
    const user = event.context.user;
    
    const pool = getDbPool();
    
    // 작성자 확인
    const [rows] = await pool.query(
      'SELECT userid FROM tbl_board WHERE bno = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return {
        success: false,
        error: '게시물을 찾을 수 없습니다.'
      };
    }
    
    if (rows[0].userid !== user.userid) {
      return {
        success: false,
        error: '삭제 권한이 없습니다.'
      };
    }
    
    // 게시물 삭제
    await pool.query(
      'DELETE FROM tbl_board WHERE bno = ?',
      [id]
    );
    
    return {
      success: true,
      message: '게시물이 삭제되었습니다.'
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});