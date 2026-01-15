import { getDbPool } from '../utils/db';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const pool = getDbPool();
    
    // 전체 게시글 수 조회
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM tbl_board'
    );
    const totalCount = countResult[0].total;
    
    // 페이지별 데이터 조회 (번호는 내림차순으로 계산)
    const [rows] = await pool.query(
      `SELECT 
        bno, 
        userid, 
        writer, 
        title, 
        hitno, 
        regDate,
        (SELECT COUNT(*) FROM tbl_board) - (
          SELECT COUNT(*) FROM tbl_board AS b2 WHERE b2.bno > tbl_board.bno
        ) AS rownum
      FROM tbl_board 
      ORDER BY bno DESC 
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    return {
      success: true,
      data: rows,
      pagination: {
        currentPage: page,
        totalCount: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        limit: limit
      }
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});