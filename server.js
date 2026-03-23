const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/api/status',    require('./routes/status'));
app.use('/api/analyze',   require('./routes/analyze'));
app.use('/api/zap-attack',require('./routes/zap'));
app.use('/api/hydra-scan',require('./routes/hydra'));
app.use('/api/nvd-scan',  require('./routes/nvd'));
app.use('/api/code-scan', require('./routes/codeScan'));
app.use('/api/metrics',   require('./routes/metrics'));
app.use('/api/chat',      require('./routes/chat'));

app.listen(PORT, () => {
    console.log(`Kubernetes AI Monitor API running at http://localhost:${PORT}`);
});
