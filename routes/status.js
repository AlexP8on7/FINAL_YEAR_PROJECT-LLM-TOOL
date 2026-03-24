const express = require('express');
const router = express.Router();
const { getKubectlInfo } = require('../lib/aiClient');

router.get('/', async (req, res) => {
    try {
        const clusterInfo = await getKubectlInfo();
        res.json(clusterInfo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
