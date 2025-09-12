const express = require('express');
const cors = require('cors');
const path = require('path');
const oracledb = require('oracledb');

const app = express();
app.use(cors());

// ejs 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '.')); // .은 경로

const config = {
  user: 'SYSTEM',
  password: 'test1234',
  connectString: 'localhost:1521/xe'
};

// Oracle 데이터베이스와 연결을 유지하기 위한 전역 변수
let connection;

// 데이터베이스 연결 설정
async function initializeDatabase() {
  try {
    connection = await oracledb.getConnection(config);
    console.log('Successfully connected to Oracle database');
  } catch (err) {
    console.error('Error connecting to Oracle database', err);
  }
}

initializeDatabase();

// 엔드포인트
app.get('/', (req, res) => {
  res.send('Hello World');
});

app.get('/emp/list', async (req, res) => {
  const { deptNo } = req.query;
  let query = `SELECT EMPNO, ENAME, JOB, SAL, DNAME `
            + `FROM EMP E `
            + `INNER JOIN DEPT D ON E.DEPTNO = D.DEPTNO `
            + `ORDER BY SAL DESC `;
  if(deptNo != "" && deptNo != null) {
    query = `SELECT EMPNO, ENAME, JOB, SAL, DNAME `
            + `FROM EMP E `
            + `INNER JOIN DEPT D ON E.DEPTNO = D.DEPTNO `
            + `WHERE E.DEPTNO = ${deptNo} `
            + `ORDER BY SAL DESC `;
  }
  try {
    const result = await connection.execute(query);
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    // 리턴
    res.json({
        result : "success",
        empList : rows // EMP 테이블 조회 결과
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/emp/delete', async (req, res) => {
  const { empNo } = req.query;

  try {
    await connection.execute(
      `DELETE FROM EMP WHERE EMPNO = :empNo`,
      [empNo], // 여기 넣어줌으로서 바로 윗줄에서 :입력이 가능하다
      { autoCommit: true }
    );
    res.json({
        result : "success"
    });
  } catch (error) {
    console.error('Error executing insert', error);
    res.status(500).send('Error executing insert');
  }
});

app.get('/emp/deleteAll', async (req, res) => {
  const { removeList } = req.query;
  console.log(removeList);
  let query = "DELETE FROM EMP WHERE EMPNO IN (";
  for(let i=0; i<removeList.length; i++) {
    query += removeList[i];
    if(removeList.length-1 != i) {
      query += ",";
    }
  }
  query += ")";
  console.log(query);

  try {
    await connection.execute(
      query,
      [], // 여기 넣어줌으로서 바로 윗줄에서 :입력이 가능하다
      { autoCommit: true }
    );
    res.json({
        result : "success"
    });
  } catch (error) {
    console.error('Error executing insert', error);
    res.status(500).send('Error executing insert');
  }
});

app.get('/emp/insert', async (req, res) => {
  const { empNo, eName, job, sal, selectDept } = req.query;

  try {
    await connection.execute(
      `INSERT INTO EMP(EMPNO, ENAME, JOB, SAL, DEPTNO) VALUES(:empNo, :eName, :job, :sal, :selectDept)`,
      [empNo, eName, job, sal, selectDept], // 여기 넣어줌으로서 바로 윗줄에서 :입력이 가능하다
      // 여기 넣지 않으면 PROFNO = ${profNo}
      { autoCommit: true }
    );
    res.json({
        result : "success"
    });
  } catch (error) {
    console.error('Error executing delete', error);
    res.status(500).send('Error executing delete');
  }
});

app.get('/emp/info', async (req, res) => {
  const { empNo } = req.query;
  let query = `SELECT E.*, EMPNO "empNo", ENAME "eName", JOB "job", SAL "sal", E.DEPTNO "selectDept", DNAME `
            + `FROM EMP E `
            + `INNER JOIN DEPT D ON E.DEPTNO = D.DEPTNO `
            + `WHERE EMPNO = ${empNo}`
  try {
    const result = await connection.execute(query);
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    // 리턴
    res.json({
        result : "success",
        info : rows[0]
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/emp/update', async (req, res) => {
  const { empNo, eName, job, sal, selectDept } = req.query;
  try {
    await connection.execute(
      `UPDATE EMP SET ENAME = :eName, JOB = :job, SAL = :sal, DEPTNO = :selectDept WHERE EMPNO = :empNo`,
      [eName, job, sal, selectDept, empNo], // 여기 넣어줌으로서 쿼리에서 :입력이 가능하다 // 순서는 쿼리문의 등장 순서와 동일해야함
      // 여기 넣지 않으면 PROFNO = ${profNo}
      { autoCommit: true }
    );
    res.json({
        result : "success"
    });
  } catch (error) {
    console.error('Error executing delete', error);
    res.status(500).send('Error executing delete');
  }
});


app.get('/prof/list', async (req, res) => {
  const { } = req.query;
  let query = `SELECT PROFNO, NAME, ID, POSITION, PAY `
            + `FROM PROFESSOR`;
  try {
    const result = await connection.execute(query);
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    // 리턴
    res.json({
        result : "success",
        profList : rows
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/prof/delete', async (req, res) => {
  const { profNo } = req.query;

  try {
    await connection.execute(
      `DELETE FROM PROFESSOR WHERE PROFNO = :profNo`,
      [profNo], // 여기 넣어줌으로서 바로 윗줄에서 :입력이 가능하다
      // 여기 넣지 않으면 PROFNO = ${profNo}
      { autoCommit: true }
    );
    res.json({
        result : "success"
    });
  } catch (error) {
    console.error('Error executing delete', error);
    res.status(500).send('Error executing delete');
  }
});

app.get('/prof/deleteAll', async (req, res) => {
  const { removeList } = req.query;
  console.log(removeList);
  let query = "DELETE FROM PROFESSOR WHERE PROFNO IN (";
  for(let i=0; i<removeList.length; i++) {
    query += removeList[i];
    if(removeList.length-1 != i) {
      query += ",";
    }
  }
  query += ")";
  console.log(query);

  try {
    await connection.execute(
      query,
      [], // 여기 넣어줌으로서 바로 윗줄에서 :입력이 가능하다
      { autoCommit: true }
    );
    res.json({
        result : "success"
    });
  } catch (error) {
    console.error('Error executing insert', error);
    res.status(500).send('Error executing insert');
  }
});

app.get('/prof/insert', async (req, res) => {
  const { profNo, profName, profId, selectPosition, pay } = req.query;

  try {
    await connection.execute(
      `INSERT INTO PROFESSOR(PROFNO, NAME, ID, POSITION, PAY) VALUES(:profNo, :profName, :profId, :selectPosition, :pay)`,
      [profNo, profName, profId, selectPosition, pay], // 여기 넣어줌으로서 바로 윗줄에서 :입력이 가능하다
      // 여기 넣지 않으면 PROFNO = ${profNo}
      { autoCommit: true }
    );
    res.json({
        result : "success"
    });
  } catch (error) {
    console.error('데이터 삽입 오류 발생:', error.message);
    console.error('Error executing delete', error);
    res.status(500).send('Error executing delete');
  }
});

app.get('/prof/info', async (req, res) => {
  const { profNo } = req.query;
  let query = `SELECT P.*, PROFNO "profNo", NAME "profName", ID "profId", POSITION "selectPosition", PAY "pay" FROM PROFESSOR P WHERE PROFNO = ${profNo}`
  try {
    const result = await connection.execute(query);
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    // 리턴
    res.json({
        result : "success",
        info : rows[0]
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/prof/update', async (req, res) => {
  const { profNo, profName, profId, selectPosition, pay } = req.query;
  try {
    await connection.execute(
      `UPDATE PROFESSOR SET NAME = :profName, ID = :profId, POSITION = : selectPosition, PAY = :pay WHERE PROFNO = :profNo`,
      [profName, profId, selectPosition, pay, profNo], // 여기 넣어줌으로서 쿼리에서 :입력이 가능하다 // 순서는 쿼리문의 등장 순서와 동일해야함
      // 여기 넣지 않으면 PROFNO = ${profNo}
      { autoCommit: true }
    );
    res.json({
        result : "success"
    });
  } catch (error) {
    console.error('Error executing delete', error);
    res.status(500).send('Error executing delete');
  }
});



app.get('/lib/login', async (req, res) => {
  const { userId, pwd } = req.query;
  let query = `SELECT * FROM LIB_USERS WHERE USERID = '${userId}' AND PASSWORD = '${pwd}'`
  try {
    const result = await connection.execute(query);
    const columnNames = result.metaData.map(column => column.name);

    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    res.json(rows);
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/lib/checkId', async (req, res) => {
  const { userId } = req.query;
  let query = `SELECT COUNT(*) AS COUNT FROM LIB_USERS WHERE USERID = '${userId}'`
  try {
    const result = await connection.execute(query);
    const columnNames = result.metaData.map(column => column.name);

    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    
    // 중복 여부 확인 (COUNT가 0보다 크면 중복)
    const isDuplicate = rows[0].COUNT > 0;
    
    // 클라이언트에 중복 여부 전송
    res.json({ duplicate : isDuplicate });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/lib/join', async (req, res) => {
  const { userId, password, name, email, phone, address } = req.query;
  
  try {
    // Oracle에서는 바인딩 변수를 :1, :2 형식이나 객체 형태로 전달해야 함
    const query = `INSERT INTO LIB_USERS (USERID, PASSWORD, NAME, EMAIL, PHONE, ADDRESS)
      VALUES (:1, :2, :3, :4, :5, :6)`;
    
    // 빈 값 처리를 위해 삼항 연산자 사용
    const emailValue = email || '';
    const phoneValue = phone || '';
    const addressValue = address || '';
    
    await connection.execute(
      query, 
      [userId, password, name, emailValue, phoneValue, addressValue],
      { autoCommit: true }
    );
    
    res.json({ success: true, message: "회원가입이 완료되었습니다." });
  } catch (error) {
    console.error('Error executing query', error);
    if (error.message && error.message.includes('ORA-00001')) {
      res.json({ success: false, message: "이미 사용 중인 아이디입니다." });
    } else {
      res.status(500).json({ success: false, message: "회원가입 중 오류가 발생했습니다." });
    }
  }
});

app.get('/lib/findId', async (req, res) => {
  const { name, email } = req.query;
  
  try {
    // 이름과 이메일로 사용자 아이디 조회
    const query = `SELECT USERID FROM LIB_USERS WHERE NAME = :name AND EMAIL = :email`;
    
    const result = await connection.execute(query, [name, email]);
    
    if (result.rows && result.rows.length > 0) {
      // 아이디 찾기 성공
      res.json({ userId: result.rows[0][0] });
    } else {
      // 일치하는 정보 없음
      res.json({ userId: null });
    }
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

app.get('/lib/resetPwd', async (req, res) => {
  const { userId, name, email } = req.query;

  console.log('비밀번호 찾기 요청 데이터:', { userId, name, email });

  try {
    // 사용자 정보 확인
    const query = `SELECT COUNT(*) AS COUNT FROM LIB_USERS WHERE USERID = :userId AND NAME = :name AND EMAIL = :email`;
    
    console.log('실행 쿼리:', query);
    console.log('바인딩 값:', [userId, name, email]);

    const result = await connection.execute(query, [userId, name, email]);

    console.log('쿼리 결과 (result.rows):', result.rows);
    console.log('COUNT 값 (result.rows[0][0]):', result.rows[0][0]);
    
    // 사용자 정보가 일치하는지 확인
    if (result.rows[0][0] > 0) {
      // 임시 비밀번호 생성 (영문 소문자 + 숫자 조합 8자리)
      const tempPassword = generateTempPassword();
      
      // 비밀번호 업데이트
      const updateQuery = `UPDATE LIB_USERS SET PASSWORD = :tempPassword WHERE USERID = :userId`;
      
      await connection.execute(updateQuery, [tempPassword, userId], { autoCommit: true });
      
      // 임시 비밀번호 응답
      res.json({ tempPassword: tempPassword });
    } else {
      // 일치하는 정보 없음
      res.json({ tempPassword: null });
    }
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 임시 비밀번호 생성 함수
function generateTempPassword() {
const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
let password = '';

// 영문자 최소 1개 포함
password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];

// 숫자 최소 1개 포함
password += '0123456789'[Math.floor(Math.random() * 10)];

// 나머지 6자리 랜덤 생성
for (let i = 0; i < 6; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
}

// 문자열 섞기
return password.split('').sort(() => 0.5 - Math.random()).join('');
}

// 사용자 정보 조회 (Read)
app.get('/lib/userInfo', async (req, res) => {
  const { userId } = req.query; // 클라이언트에서 넘겨준 userId

  try {
    const query = `SELECT USERID, NAME, EMAIL, PHONE, ADDRESS FROM LIB_USERS WHERE USERID = :1`;
    const result = await connection.execute(query, [userId]);

    if (result.rows.length > 0) {
      // 결과가 있다면 첫 번째 행을 JSON 객체로 변환하여 응답
      const columnNames = result.metaData.map(col => col.name);
      const userData = {};
      columnNames.forEach((name, index) => {
        userData[name] = result.rows[0][index];
      });
      res.json(userData);
    } else {
      // 해당 userId의 사용자 정보가 없을 경우
      res.json(null);
    }
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ error: '사용자 정보 조회 중 오류가 발생했습니다.' });
  }
});

// 사용자 정보 업데이트 (Update)
app.get('/lib/updateUserInfo', async (req, res) => {
  // currentPassword 와 newPassword 를 추가로 받습니다.
  const { userId, name, email, phone, address, currentPassword, newPassword } = req.query;

  try {
    // 1. 기존 비밀번호 일치 여부 확인
    const checkPwdQuery = `SELECT PASSWORD FROM LIB_USERS WHERE USERID = :1`;
    const checkPwdResult = await connection.execute(checkPwdQuery, [userId]);

    if (checkPwdResult.rows.length === 0 || checkPwdResult.rows[0][0] !== currentPassword) {
      // 기존 비밀번호 불일치 또는 사용자 없음
      return res.json({ success: false, message: '기존 비밀번호가 일치하지 않습니다.' });
    }

    // 2. 업데이트할 쿼리 준비 (새 비밀번호가 있다면 포함)
    let updateQuery;
    let bindParams;

    if (newPassword && newPassword.trim() !== '') {
      // 새 비밀번호가 입력된 경우, 비밀번호 포함하여 업데이트
      updateQuery = `
        UPDATE LIB_USERS
        SET NAME = :1, EMAIL = :2, PHONE = :3, ADDRESS = :4, PASSWORD = :5
        WHERE USERID = :6
      `;
      bindParams = [name, email, phone, address, newPassword, userId];
    } else {
      // 새 비밀번호가 없는 경우, 기본 정보만 업데이트
      updateQuery = `
        UPDATE LIB_USERS
        SET NAME = :1, EMAIL = :2, PHONE = :3, ADDRESS = :4
        WHERE USERID = :5
      `;
      bindParams = [name, email, phone, address, userId];
    }
    
    // 3. 업데이트 쿼리 실행
    const result = await connection.execute(
      updateQuery,
      bindParams,
      { autoCommit: true } // 업데이트 후 자동 커밋
    );

    if (result.rowsAffected && result.rowsAffected > 0) {
      res.json({ success: true, message: '회원 정보가 성공적으로 수정되었습니다.' });
    } else {
      res.json({ success: false, message: '회원 정보 수정에 실패했습니다. 사용자 정보를 확인해주세요.' });
    }
  } catch (error) {
    console.error('Error updating user info:', error);
    res.status(500).json({ success: false, message: '회원 정보 수정 중 오류가 발생했습니다.' });
  }
});
    
// 회원 탈퇴 처리
app.get('/lib/withdraw', async (req, res) => {
  const { userId, password } = req.query;
  
  try {
    // 1. 비밀번호 확인
    const checkPwdQuery = `SELECT COUNT(*) FROM LIB_USERS WHERE USERID = :1 AND PASSWORD = :2`;
    const checkResult = await connection.execute(checkPwdQuery, [userId, password]);
    
    // 비밀번호 불일치
    if (checkResult.rows[0][0] === 0) {
      return res.json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
    }
    
    // 2. 회원 정보 삭제
    // 참고: 실제 서비스에서는 완전히 삭제하기보다 상태값을 변경하는 것이 권장됩니다
    const deleteQuery = `DELETE FROM LIB_USERS WHERE USERID = :1`;
    const result = await connection.execute(deleteQuery, [userId], { autoCommit: true });
    
    if (result.rowsAffected && result.rowsAffected > 0) {
      res.json({ success: true, message: '회원 탈퇴가 완료되었습니다.' });
    } else {
      res.json({ success: false, message: '회원 탈퇴 처리에 실패했습니다.' });
    }
    
  } catch (error) {
    console.error('Error during user withdrawal:', error);
    res.status(500).json({ success: false, message: '회원 탈퇴 중 오류가 발생했습니다.' });
  }
});


app.get('/board/list', async (req, res) => {
  const { pageSize, offset } = req.query;
  
  try {
    const result = await connection.execute(
      `SELECT B.*, TO_CHAR(CDATETIME, 'YYYY-MM-DD') AS CDATE FROM TBL_BOARD B `
      + `OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY`
    );
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });

    const count = await connection.execute(
      `SELECT COUNT(*) FROM TBL_BOARD`
    );
    // console.log(count.rows[0][0]); // rows 확인. 게시글이 총 몇개인지

    // 리턴
    res.json({
        result : "success",
        boardList : rows,
        count : count.rows[0][0]
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

app.get('/board/add', async (req, res) => {
  const { title, contents, userId, kind } = req.query;

  try {
    await connection.execute(
      `INSERT INTO TBL_BOARD VALUES(B_SEQ.NEXTVAL, :title, :contents, :userId, 0, 0, :kind, SYSDATE, SYSDATE)`,
      [title, contents, userId, kind], // 여기 넣어줌으로서 바로 윗줄에서 :입력이 가능하다
      { autoCommit: true }
    );
    res.json({
        result : "success"
    });
  } catch (error) {
    console.error('데이터 삽입 오류 발생:', error.message);
    console.error('Error executing delete', error);
    res.status(500).send('Error executing delete');
  }
});

app.get('/board/view', async (req, res) => {
  const { boardNo } = req.query;
  
  try {
    const result = await connection.execute(
      `SELECT B.*, TO_CHAR(CDATETIME, 'YYYY-MM-DD') AS CDATE FROM TBL_BOARD B `
      + `WHERE BOARDNO = ${boardNo}`
    );
    const columnNames = result.metaData.map(column => column.name);
    // 쿼리 결과를 JSON 형태로 변환
    const rows = result.rows.map(row => {
      // 각 행의 데이터를 컬럼명에 맞게 매핑하여 JSON 객체로 변환
      const obj = {};
      columnNames.forEach((columnName, index) => {
        obj[columnName] = row[index];
      });
      return obj;
    });
    // 리턴
    res.json({
        result : "success",
        info : rows[0]
    });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  }
});

// 서버 시작
app.listen(3009, () => {
  console.log('Server is running on port 3009');
});
