// Import required modules
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const COOKIE_FILE = path.join(__dirname, 'cookie.txt');
const ADMIN_PASSWORD = 'admin'; // Change this to a strong password

// Middleware to parse JSON and URL-encoded data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Utility function to read the current cookie
const getCookie = () => {
    try {
        return fs.readFileSync(COOKIE_FILE, 'utf8').trim();
    } catch (err) {
        return null;
    }
};

// Utility function to save a new cookie
const saveCookie = (cookie) => {
    fs.writeFileSync(COOKIE_FILE, cookie.trim(), 'utf8');
};

// Route to display the cookie management dashboard
app.get('/manage-cookie', (req, res) => {
    const currentCookie = getCookie();
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Cookie Manager</title>
        </head>
        <body>
            <h1>Cookie Manager</h1>
            <p>Current Cookie: ${currentCookie || 'None'}</p>
            <form method="POST" action="/manage-cookie">
                <input type="password" name="password" placeholder="Admin Password" required />
                <input type="text" name="new_cookie" placeholder="New Cookie" />
                <button type="submit">Add Cookie</button>
            </form>
            <form method="POST" action="/delete-cookie">
                <input type="password" name="password" placeholder="Admin Password" required />
                <button type="submit">Delete Cookie</button>
            </form>
        </body>
        </html>
    `);
});

// Route to handle adding or updating the cookie
app.post('/manage-cookie', (req, res) => {
    const { password, new_cookie } = req.body;

    if (password !== ADMIN_PASSWORD) {
        return res.status(403).send('Unauthorized');
    }

    if (new_cookie) {
        saveCookie(new_cookie);
        return res.redirect('/manage-cookie');
    }

    res.status(400).send('No cookie provided');
});

// Route to handle deleting the cookie
app.post('/delete-cookie', (req, res) => {
    const { password } = req.body;

    if (password !== ADMIN_PASSWORD) {
        return res.status(403).send('Unauthorized');
    }

    if (fs.existsSync(COOKIE_FILE)) {
        fs.unlinkSync(COOKIE_FILE);
    }

    res.redirect('/manage-cookie');
});

// Route for the main API call
app.get('/api', async (req, res) => {
    const phoneNumber = req.query.number;

    if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required', Dev: 'pikachufrombd.t.me' });
    }

    const cookie = getCookie();
    if (!cookie) {
        return res.status(400).json({ error: 'No cookie found. Please add a cookie first.', Dev: 'pikachufrombd.t.me' });
    }

    const url = `https://channel.mynagad.com:20010/api/customer/detail/${phoneNumber}`;
    const headers = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'sec-ch-ua-platform': '"Android"',
        'sec-ch-ua': '"Chromium";v="130", "Android WebView";v="130", "Not?A_Brand";v="99"',
        'sec-ch-ua-mobile': '?1',
        'X-Requested-With': 'mark.via.gp',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
        'Referer': 'https://channel.mynagad.com:20010/ui/dms/',
        'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'Cookie': cookie
    };

    try {
        const response = await axios.get(url, { headers });
        const data = response.data;
        data.Dev = 'pikachufrombd.t.me';
        res.json(data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json({ error: error.message, Dev: 'pikachufrombd.t.me' });
        } else {
            res.status(500).json({ error: 'Internal Server Error', Dev: 'pikachufrombd.t.me' });
        }
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
