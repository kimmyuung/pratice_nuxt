import { getDbPool } from '../../utils/db';

export default defineEventHandler(async (event) => {
  try {
    const id = event.context.params.id;
    const body = await readBody(event);
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
        error: '수정 권한이 없습니다.'
      };
    }
    
    // 게시물 수정
    await pool.query(
      'UPDATE tbl_board SET title = ?, content = ? WHERE bno = ?',
      [body.title, body.content, id]
    );
    
    return {
      success: true,
      message: '게시물이 수정되었습니다.'
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});