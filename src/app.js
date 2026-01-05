const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.send('Slack-lite Backend is Running!');
});

app.listen(PORT, () => {
    console.log(`✅ 서버가 정상적으로 실행되었습니다: http://localhost:${PORT}`);
});