const config = require('./config');

const MAX_LEADS = 50;
const leads = [];
const seen = new Set();

const isNew = (id) => !seen.has(id);
const markSeen = (id) => seen.add(id);
const forget = (id) => seen.delete(id);
const all = () => leads;

function save(lead) {
    leads.unshift(lead);
    if (leads.length > MAX_LEADS) leads.pop();
}

async function fetchLead(leadgenId) {
    const url =
        `https://graph.facebook.com/${config.graphVersion}/${leadgenId}` +
        `?access_token=${encodeURIComponent(config.pageToken)}`;
    const response = await fetch(url);
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Graph API returned ${response.status}: ${body.slice(0, 200)}`);
    }
    const data = await response.json();

    const fields = {};
    for (const item of data.field_data || []) {
        fields[item.name] = (item.values || [])[0];
    }

    return {
        id: data.id || leadgenId,
        name:
            fields.full_name ||
            [fields.first_name, fields.last_name].filter(Boolean).join(' ') ||
            'Unknown',
        email: fields.email || 'no email',
        createdAt: data.created_time || new Date().toISOString(),
    };
}

module.exports = { isNew, markSeen, forget, all, save, fetchLead };