import 'dotenv/config';
import app from './app.js';

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '0.0.0.0';

const server = app.listen(port, host, () => {
    console.log(`Evolua API listening on http://${host}:${port}`);
});

server.on('error', (error) => {
    console.error(`Falha ao iniciar o servidor em ${host}:${port}:`, error.message);
    process.exit(1);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => server.close(() => process.exit(0)));
}
