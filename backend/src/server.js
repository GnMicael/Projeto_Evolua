import 'dotenv/config';
import app from './app.js';
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '0.0.0.0';
app.listen(port, host, () => {
    console.log(`Evolua API listening on http://${host}:${port}`);
});
