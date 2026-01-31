/**
 * SQLite channels 테이블에서 name 컬럼의 unique 제약 제거
 * SQLite는 ALTER COLUMN을 지원하지 않아 테이블을 재생성함
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
  db.run('PRAGMA foreign_keys = OFF', (err) => {
    if (err) {
      console.error('foreign_keys OFF 실패:', err.message);
      db.close();
      process.exit(1);
    }

    // 1. 현재 channels 테이블 구조 확인 후 새 테이블 생성 (name에 unique 없음)
    db.run(
      `CREATE TABLE channels_new (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        isPublic INTEGER DEFAULT 1,
        isDM INTEGER DEFAULT 0,
        password TEXT,
        createdBy TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      (err) => {
        if (err) {
          console.error('channels_new 생성 실패:', err.message);
          db.run('PRAGMA foreign_keys = ON');
          db.close();
          process.exit(1);
        }

        // 2. 데이터 복사
        db.run('INSERT INTO channels_new SELECT id, name, description, isPublic, isDM, password, createdBy, createdAt, updatedAt FROM channels', (err) => {
          if (err) {
            console.error('데이터 복사 실패:', err.message);
            db.run('DROP TABLE channels_new');
            db.run('PRAGMA foreign_keys = ON');
            db.close();
            process.exit(1);
          }

          // 3. 기존 테이블 삭제
          db.run('DROP TABLE channels', (err) => {
            if (err) {
              console.error('channels 삭제 실패:', err.message);
              db.run('PRAGMA foreign_keys = ON');
              db.close();
              process.exit(1);
            }

            // 4. 새 테이블 이름 변경
            db.run('ALTER TABLE channels_new RENAME TO channels', (err) => {
              if (err) {
                console.error('테이블 이름 변경 실패:', err.message);
                db.run('PRAGMA foreign_keys = ON');
                db.close();
                process.exit(1);
              }

              db.run('PRAGMA foreign_keys = ON', () => {
                console.log('channels.name의 unique 제약이 제거되었습니다.');
                db.close();
              });
            });
          });
        });
      },
    );
  });
});
