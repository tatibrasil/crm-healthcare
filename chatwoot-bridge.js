// ============================================
// Chatwoot Dashboard App Bridge
// Handles communication between the CRM (iframe)
// and the Chatwoot parent window.
// ============================================

const ChatwootBridge = (() => {
    let _isEmbedded = false;
    let _currentContact = null;
    let _currentConversation = null;
    let _currentAgent = null;
    let _listeners = {};
    let _ready = false;

    // ---- Detection ----
    function isEmbedded() {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    }

    // ---- Event System ----
    function on(event, callback) {
        if (!_listeners[event]) _listeners[event] = [];
        _listeners[event].push(callback);
    }

    function off(event, callback) {
        if (!_listeners[event]) return;
        _listeners[event] = _listeners[event].filter(cb => cb !== callback);
    }

    function emit(event, data) {
        if (!_listeners[event]) return;
        _listeners[event].forEach(cb => {
            try { cb(data); } catch (e) { console.error(`[CW Bridge] Error in listener for ${event}:`, e); }
        });
    }

    // ---- JSON Validation ----
    function isJSONValid(str) {
        if (typeof str !== 'string') return false;
        try { JSON.parse(str); return true; } catch (e) { return false; }
    }

    // ---- Message Handler ----
    function handleMessage(event) {
        if (!isJSONValid(event.data)) return;

        let eventData;
        try { eventData = JSON.parse(event.data); } catch (e) { return; }

        if (eventData.event === 'appContext') {
            const data = eventData.data || {};

            // Extract contact
            if (data.contact) {
                const prev = _currentContact;
                _currentContact = {
                    id: data.contact.id,
                    name: data.contact.name || '',
                    email: data.contact.email || '',
                    phone: normalizePhone(data.contact.phone_number || ''),
                    phoneRaw: data.contact.phone_number || '',
                    thumbnail: data.contact.thumbnail || '',
                    customAttributes: data.contact.custom_attributes || {},
                    additionalAttributes: data.contact.additional_attributes || {}
                };

                // Emit only if contact changed
                if (!prev || prev.id !== _currentContact.id) {
                    emit('contact-changed', _currentContact);
                }
            }

            // Extract conversation
            if (data.conversation) {
                _currentConversation = {
                    id: data.conversation.id,
                    status: data.conversation.status || '',
                    inboxId: data.conversation.inbox_id,
                    labels: data.conversation.labels || [],
                    unreadCount: data.conversation.unread_count || 0,
                    messages: (data.conversation.messages || []).map(msg => ({
                        id: msg.id,
                        content: msg.content || '',
                        type: msg.message_type, // 0=incoming, 1=outgoing, 2=activity
                        createdAt: msg.created_at,
                        private: msg.private || false,
                        sender: msg.sender ? {
                            id: msg.sender.id,
                            name: msg.sender.name || '',
                            type: msg.sender.type || ''
                        } : null
                    }))
                };
                emit('conversation-changed', _currentConversation);
            }

            // Extract current agent
            if (data.currentAgent) {
                _currentAgent = {
                    id: data.currentAgent.id,
                    name: data.currentAgent.name || '',
                    email: data.currentAgent.email || ''
                };
            }

            if (!_ready) {
                _ready = true;
                emit('ready', { contact: _currentContact, conversation: _currentConversation, agent: _currentAgent });
            }

            emit('context-updated', {
                contact: _currentContact,
                conversation: _currentConversation,
                agent: _currentAgent
            });
        }
    }

    // ---- Phone normalization (for matching) ----
    function normalizePhone(phone) {
        if (!phone) return '';
        return phone.replace(/[^\d+]/g, '');
    }

    // ---- Request context on-demand ----
    function requestContext() {
        if (!_isEmbedded) return;
        try {
            window.parent.postMessage('chatwoot-dashboard-app:fetch-info', '*');
        } catch (e) {
            console.warn('[CW Bridge] Failed to request context:', e);
        }
    }

    // ---- Init ----
    function init() {
        _isEmbedded = isEmbedded();
        console.log(`[CW Bridge] Mode: ${_isEmbedded ? 'EMBEDDED (Chatwoot iframe)' : 'STANDALONE'}`);

        if (_isEmbedded) {
            window.addEventListener('message', handleMessage);
            // Request initial context
            setTimeout(requestContext, 500);
        }

        return _isEmbedded;
    }

    // ---- Public API ----
    return {
        init,
        on,
        off,
        emit,
        requestContext,
        isEmbedded: () => _isEmbedded,
        getContact: () => _currentContact,
        getConversation: () => _currentConversation,
        getAgent: () => _currentAgent,
        normalizePhone
    };
})();
