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
  const { userId, pwd, name, email, phone, address } = req.query;
  // 아이디 중복 확인
  let query = ``
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
