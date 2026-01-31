/**
 * SQLite DB에서 중복 표시명 정리
 * 각 중복 그룹에서 id가 가장 작은 사용자만 표시명 유지, 나머지는 null로 설정
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'crew.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('DB 연결 실패:', err.message);
    process.exit(1);
  }
});

db.serialize(() => {
  // 1. 중복 표시명 확인
  db.all(
    `SELECT displayName, COUNT(*) as cnt, GROUP_CONCAT(id) as ids
     FROM users
     WHERE displayName IS NOT NULL AND displayName != ''
     GROUP BY displayName
     HAVING cnt > 1`,
    (err, duplicates) => {
      if (err) {
        console.error('중복 조회 실패:', err.message);
        db.close();
        process.exit(1);
      }

      if (!duplicates || duplicates.length === 0) {
        console.log('중복 표시명이 없습니다.');
        db.close();
        process.exit(0);
        return;
      }

      console.log(`중복 표시명 ${duplicates.length}건 발견:`);
      duplicates.forEach((d) => console.log(`  - "${d.displayName}": ${d.cnt}명 (ids: ${d.ids})`));

      // 2. 각 중복 그룹에서 id가 가장 작은 것만 유지, 나머지 null 처리
      // (id는 UUID이므로 문자열 정렬 사용 - 먼저 가입한 사용자 우선 유지)
      const idsToNullify = [];
      duplicates.forEach((d) => {
        const ids = d.ids.split(',').map((x) => x.trim()).sort();
        ids.slice(1).forEach((id) => idsToNullify.push(id)); // 첫 번째만 유지
      });

      if (idsToNullify.length === 0) {
        db.close();
        process.exit(0);
        return;
      }

      const placeholders = idsToNullify.map(() => '?').join(',');
      const sql = `UPDATE users SET displayName = NULL WHERE id IN (${placeholders})`;

      db.run(sql, idsToNullify, function (err) {
        if (err) {
          console.error('업데이트 실패:', err.message);
          db.close();
          process.exit(1);
        }
        console.log(`${this.changes}명의 표시명을 null로 정리했습니다.`);
        db.close();
      });
    },
  );
});
