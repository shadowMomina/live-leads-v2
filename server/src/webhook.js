const express = require('express');
const crypto = require('crypto');
const config = require('./config');
const leads = require('./leads');

function isValidSignature(req) {
    const header = req.get('X-Hub-Signature-256') || '';
    const expected =
        'sha256=' +
        crypto.createHmac('sha256', config.appSecret).update(req.rawBody || '').digest('hex');
    const a = Buffer.from(header);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function createWebhookRouter(onLead) {
    const router = express.Router();

    // Meta's one-time address check
    router.get('/', (req, res) => {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        if (mode === 'subscribe' && token === config.verifyToken) {
            console.log('webhook verified');
            return res.status(200).send(challenge);
        }
        return res.sendStatus(403);
    });

    // A lead notification
    router.post('/', (req, res) => {
        if (!isValidSignature(req)) return res.sendStatus(403);
        res.sendStatus(200); // answer fast so Meta doesn't retry

        for (const entry of req.body.entry || []) {
            for (const change of entry.changes || []) {
                if (change.field !== 'leadgen') continue;
                const id = change.value && change.value.leadgen_id;
                if (!id || !leads.isNew(id)) continue;

                leads.markSeen(id);
                leads
                    .fetchLead(id)
                    .then((lead) => {
                        leads.save(lead);
                        onLead(lead);
                    })
                    .catch((err) => {
                        console.error('could not fetch lead:', err.message);
                        leads.forget(id);
                    });
            }
        }
    });

    return router;
}

module.exports = { createWebhookRouter };