// ============================================
// Chatwoot API Client
// REST client for Chatwoot v1 API
// ============================================

const ChatwootAPI = (() => {
    const CONFIG_KEY = 'crm_chatwoot_config';

    // ---- Config Management ----
    function getConfig() {
        try {
            const raw = localStorage.getItem(CONFIG_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch { return null; }
    }

    function saveConfig(config) {
        localStorage.setItem(CONFIG_KEY, JSON.stringify({
            baseUrl: (config.baseUrl || '').replace(/\/+$/, ''),
            accountId: config.accountId || '',
            apiToken: config.apiToken || ''
        }));
    }

    function isConfigured() {
        const c = getConfig();
        return !!(c && c.baseUrl && c.accountId && c.apiToken);
    }

    // ---- HTTP helpers ----
    function apiUrl(path) {
        const c = getConfig();
        if (!c) throw new Error('Chatwoot not configured');
        // Use local proxy to avoid CORS
        return `/chatwoot-api/api/v1/accounts/${c.accountId}${path}`;
    }

    function headers() {
        const c = getConfig();
        return {
            'Content-Type': 'application/json',
            'api_access_token': c?.apiToken || ''
        };
    }

    async function request(method, path, body = null) {
        const url = apiUrl(path);
        const opts = { method, headers: headers() };
        if (body) opts.body = JSON.stringify(body);

        try {
            const resp = await fetch(url, opts);
            if (!resp.ok) {
                const errText = await resp.text().catch(() => '');
                throw new Error(`HTTP ${resp.status}: ${errText}`);
            }
            return await resp.json();
        } catch (err) {
            console.error(`[CW API] ${method} ${path} failed:`, err);
            throw err;
        }
    }

    // ---- Contacts ----
    async function searchContacts(query) {
        const data = await request('GET', `/contacts/search?q=${encodeURIComponent(query)}&page=1`);
        return data.payload || [];
    }

    async function getContact(contactId) {
        return await request('GET', `/contacts/${contactId}`);
    }

    async function createContact(contactData) {
        return await request('POST', '/contacts', contactData);
    }

    async function updateContact(contactId, contactData) {
        return await request('PUT', `/contacts/${contactId}`, contactData);
    }

    // ---- Conversations ----
    async function getContactConversations(contactId) {
        const data = await request('GET', `/contacts/${contactId}/conversations`);
        return data.payload || [];
    }

    async function getConversation(conversationId) {
        return await request('GET', `/conversations/${conversationId}`);
    }

    async function getMessages(conversationId, before = null) {
        let path = `/conversations/${conversationId}/messages`;
        if (before) path += `?before=${before}`;
        const data = await request('GET', path);
        return data.payload || [];
    }

    async function sendMessage(conversationId, content, isPrivate = false) {
        return await request('POST', `/conversations/${conversationId}/messages`, {
            content,
            message_type: isPrivate ? 'outgoing' : 'outgoing',
            private: isPrivate
        });
    }

    // ---- Labels ----
    async function addLabel(conversationId, labels) {
        return await request('POST', `/conversations/${conversationId}/labels`, { labels });
    }

    // ---- Test Connection ----
    async function testConnection() {
        try {
            const c = getConfig();
            if (!c) return { ok: false, error: 'Não configurado' };
            // Use local proxy to avoid CORS
            const resp = await fetch(`/chatwoot-api/api/v1/profile`, {
                headers: { 'api_access_token': c.apiToken }
            });
            if (resp.ok) {
                const profile = await resp.json();
                return { ok: true, agent: profile.name || profile.email || 'Connected' };
            }
            return { ok: false, error: `HTTP ${resp.status}` };
        } catch (err) {
            return { ok: false, error: err.message };
        }
    }

    // ---- Find contact by phone ----
    async function findContactByPhone(phone) {
        if (!phone) return null;
        const normalized = phone.replace(/[^\d+]/g, '');
        // Try searching with different formats
        const queries = [normalized, phone];
        if (normalized.startsWith('+55')) {
            queries.push(normalized.substring(3)); // without country code
        }

        for (const q of queries) {
            try {
                const results = await searchContacts(q);
                if (results.length > 0) {
                    // Find exact match by phone
                    const match = results.find(c => {
                        const cPhone = (c.phone_number || '').replace(/[^\d+]/g, '');
                        return cPhone === normalized || cPhone.endsWith(normalized.slice(-9));
                    });
                    if (match) return match;
                    // Return first result if close enough
                    if (results.length === 1) return results[0];
                }
            } catch { /* try next query */ }
        }
        return null;
    }

    // ---- Public API ----
    return {
        getConfig,
        saveConfig,
        isConfigured,
        testConnection,
        searchContacts,
        getContact,
        createContact,
        updateContact,
        getContactConversations,
        getConversation,
        getMessages,
        sendMessage,
        addLabel,
        findContactByPhone
    };
})();
