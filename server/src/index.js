const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const config = require('./config');
const leads = require('./leads');
const { createWebhookRouter } = require('./webhook');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// keep the raw body so Meta's signature can be checked
app.use(
    express.json({
        verify: (req, res, buf) => {
            req.rawBody = buf;
        },
    }),
);

function broadcastLead(lead) {
    io.emit('newLead', lead);
}

io.on('connection', (socket) => {
    console.log('client connected:', socket.id);
    socket.emit('initialLeads', leads.all()); // catch up on leads already received
    socket.on('disconnect', () => console.log('client disconnected:', socket.id));
});

app.get('/', (req, res) => res.send('Backend is running'));
app.use('/webhook', createWebhookRouter(broadcastLead));

// development only: push a fake lead without Meta
let counter = 0;
app.get('/test-lead', (req, res) => {
    counter += 1;
    const lead = {
        id: `test-${Date.now()}-${counter}`,
        name: `Test Lead ${counter}`,
        email: `test${counter}@example.com`,
        createdAt: new Date().toISOString(),
    };
    leads.save(lead);
    broadcastLead(lead);
    res.send(`Sent ${lead.id}`);
});

server.listen(config.port, () => console.log(`Server running on port ${config.port}`));