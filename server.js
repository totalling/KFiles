const express = require('express');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const compression = require('compression');
const cluster = require('cluster');
const os = require('os');
const NodeCache = require('node-cache');

const apiCache = new NodeCache({ stdTTL: 300 });
const app = express();

app.use(compression());
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/view/:id', async (req, res) => {
    const id = req.params.id;
    const cacheKey = `view-${id}`;
    const cachedData = apiCache.get(cacheKey);
    if (cachedData) {
        return res.render('embed', cachedData);
    }

    try {
        const response = await axios.get(`https://krakenfiles.com/view/${id}/file.html`, {
            timeout: 5000,
        });
        const $ = cheerio.load(response.data);
        const token = $('input[name="token"]').val();
        const fileName = $('.coin-name').text().trim();
        const data = { id, token, fileName };

        apiCache.set(cacheKey, data);
        res.render('embed', data);
    } catch {
        res.status(500).send('Error fetching the KrakenFiles page');
    }
});

app.post('/download/:id', async (req, res) => {
    const id = req.params.id;
    const token = req.body.token;
    const cacheKey = `download-${id}`;
    const cachedUrl = apiCache.get(cacheKey);
    if (cachedUrl) {
        return res.json({ url: cachedUrl });
    }

    try {
        const response = await axios.post(`https://krakenfiles.com/download/${id}`, `token=${token}`, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            timeout: 5000,
        });

        const downloadData = response.data;

        if (downloadData.status === 'ok' && downloadData.url) {
            apiCache.set(cacheKey, downloadData.url);
            res.json({ url: downloadData.url });
        } else {
            res.status(500).json({ message: 'Error retrieving download URL' });
        }
    } catch {
        res.status(500).json({ message: 'Error sending the download request' });
    }
});

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', () => {
        cluster.fork();
    });
} else {
    const port = process.env.PORT || 3000;
    app.listen(port);
};