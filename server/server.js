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
  const { } = req.query;
  let query = `SELECT EMPNO, ENAME, JOB, SAL, DNAME `
            + `FROM EMP E `
            + `INNER JOIN DEPT D ON E.DEPTNO = D.DEPTNO `
            + `ORDER BY SAL DESC`;
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
  let query = `SELECT E.*, EMPNO "empNo", ENAME "eName", JOB "job", SAL "sal", DEPTNO "selectDept" `
            + `FROM EMP E `
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



// 서버 시작
app.listen(3009, () => {
  console.log('Server is running on port 3009');
});
