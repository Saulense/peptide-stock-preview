/* Unified agent inbox design. Temporary fixtures only; the API app implements its own pages. */
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.PS || !window.ShopUI) return;
    const S = window.ShopUI;
    const inbox = S.inbox = { account: null, active: 'admin', filter: 'all', query: '', open: false, scroll: 0 };
    const ownCustomers = () => S.customers.filter(c => c.account === progressIndex());
    const customer = () => ownCustomers().find(c => c.id === inbox.active);
    const glyph = (name, initials) => `<span class="avatar purple">${initials ? icon(initials) : esc(name.split(/\s+/).slice(0, 2).map(n => n[0]).join(''))}</span>`;
    const action = (ico, attrs, label) => `<button type="button" class="icon-btn" ${attrs} aria-label="${esc(label)}" title="${esc(label)}">${icon(ico)}</button>`;
    const basePage = messagesPage, baseConversation = messageConversation, baseInbox = messageInbox;
    const baseRender = render, baseRead = messageReadVisible, baseUnread = messageTotalUnread;
    const baseRefreshInbox = messageRefreshInbox;
    let moreObserver;

    function context() {
      const account = progressIndex();
      if (inbox.account !== account) {
        Object.assign(inbox, { account, active: 'admin', filter: 'all', query: '', open: false, scroll: 0 });
        S.visible = 20; S.attachment = null;
      }
      if (inbox.active !== null && inbox.active !== 'admin' && !customer()) { inbox.active = null; inbox.open = false; }
      return inbox;
    }
    function adminThread() { return messageThreads().find(t => t.id === progressIndex()); }
    function preview(c) { return c.messages.at(-1)?.text || c.messages.at(-1)?.file?.name || 'Start a conversation'; }
    function thread(id, name, summary, unread, pinned, at) {
      return `<button class="chat-thread ${inbox.active === id ? 'active' : ''}" data-ai-thread="${esc(id)}">
        ${glyph(name, pinned ? 'users-round' : null)}<span class="chat-thread-copy"><strong>${esc(name)}</strong><span>${esc(summary)}</span><small>${pinned ? 'Shared · admin team' : 'Customer'}</small></span>
        <span class="chat-thread-meta">${pinned ? `<span class="ai-pinned" title="Pinned admin conversation">${icon('pin')}</span>` : at ? `<time>${esc(at)}</time>` : ''}${unread ? `<b class="chat-unread">${unread > 99 ? '99+' : unread}</b>` : ''}</span></button>`;
    }
    messageInbox = function () {
      if (state.role !== 'agent') return baseInbox();
      context(); const q = inbox.query.toLowerCase().trim(), t = adminThread(), adminUnread = t ? messageUnread(t) : 0;
      let html = '';
      if (inbox.filter !== 'customers' && (!q || ('admin ' + (t?.messages.at(-1)?.text || '')).toLowerCase().includes(q)) && (inbox.filter !== 'unread' || adminUnread)) {
        html += thread('admin', 'Admin', t?.messages.at(-1) ? messageSummary(t.messages.at(-1)) : 'Contact your admin team', adminUnread, true);
      }
      const list = inbox.filter === 'admin' ? [] : ownCustomers().filter(c => (!q || (c.name + ' ' + c.email + ' ' + preview(c)).toLowerCase().includes(q)) && (inbox.filter !== 'unread' || c.unread));
      html += list.slice(0, S.visible).map(c => thread(c.id, c.name, preview(c), c.unread, false, '')).join('');
      if (list.length > S.visible) html += `<div class="ai-load-more"><button class="btn small" data-ai-more>Load 20 more ${icon('chevron-down')}</button></div>`;
      return html || '<p class="empty">No conversations found.</p>';
    };
    messagesPage = function () {
      if (state.role !== 'agent') return basePage();
      context(); messaging.active = progressIndex(); messaging.mobileOpen = inbox.open;
      return `<h1 class="sr-only">Messages</h1><section class="chat-shell agent-inbox-shell ${inbox.open ? 'thread-open' : ''}" aria-label="Messaging workspace">
        <aside class="chat-inbox"><div class="chat-inbox-tools"><div class="chat-inbox-search">${action('arrow-left', 'data-chat-exit', 'Back to workspace')}<div class="search">${icon('search')}<input id="ai-inbox-search" type="search" placeholder="Search conversations…" aria-label="Search conversations" value="${esc(inbox.query)}"></div></div>
        <div class="tabs ai-inbox-tabs" aria-label="Conversation filter">${[['all', 'All'], ['unread', 'Unread'], ['admin', 'Admin'], ['customers', 'Customers']].map(([id, label]) => `<button data-ai-filter="${id}" class="${inbox.filter === id ? 'active' : ''}" aria-pressed="${inbox.filter === id}">${label}</button>`).join('')}</div></div>
        <div class="chat-thread-list" id="chat-threads">${messageInbox()}</div></aside><div class="chat-conversation" id="chat-conversation">${messageConversation()}</div></section>`;
    };
    function emptyConversation() { return `<div class="chat-empty">${icon('messages-square')}<h2>Your messages</h2><p>Choose Admin or a customer to get started.</p></div>`; }
    messageConversation = function () {
      if (state.role !== 'agent') return baseConversation();
      context();
      if (inbox.active === null) return emptyConversation();
      if (inbox.active === 'admin') {
        messaging.active = progressIndex();
        const host = document.createElement('div'); host.innerHTML = baseConversation();
        const back = host.querySelector('.chat-back');
        if (back) { back.removeAttribute('data-chat-exit'); back.setAttribute('data-ai-back', ''); back.setAttribute('aria-label', 'Back to conversations'); back.insertAdjacentHTML('afterend', glyph('Admin', 'users-round')); }
        host.querySelector('[data-chat-archive]')?.remove(); // The shared admin chat stays pinned and available.
        return host.innerHTML;
      }
      const c = customer(); if (!c) return emptyConversation(); S.chat = c.id;
      const draft = S.messageDrafts.get(c.id + 'agent') || '', attachment = S.attachment;
      return `<header class="chat-header">${action('arrow-left', 'data-ai-back', 'Back to conversations')}${glyph(c.name)}<div class="grow"><strong>${esc(c.name)}</strong></div></header>
        <div class="chat-messages" id="su-chat-log" role="log" aria-label="Conversation history" aria-live="polite">
          ${c.messages.length > (c.visible || 20) ? `<button class="btn small chat-older" data-shop-action="earlier-messages">Earlier messages ${icon('chevron-up')}</button>` : ''}
          ${c.messages.slice(-(c.visible || 20)).map(m => `<article class="chat-message ${m.by === 'agent' ? 'mine' : ''}"><div class="chat-bubble"><div class="chat-author">${esc(m.by === 'agent' ? accountPerson().name : c.name)}</div>${m.reply ? `<div class="chat-quote">${esc(m.reply)}</div>` : ''}${m.file?.type?.startsWith('image/') ? `<img class="su-chat-image" src="${esc(m.file.url)}" alt="Image attachment" loading="lazy">` : ''}${m.file ? `<a class="chat-file-link" download="${esc(m.file.name)}" href="${esc(m.file.url)}">${icon(m.file.type?.startsWith('image/') ? 'image' : 'file-text')}<span>${esc(m.file.name)}</span>${icon('download')}</a>` : ''}${m.text ? `<p>${esc(m.text)}</p>` : ''}<time>${esc(m.at)}</time></div></article>`).join('')}
          ${!c.messages.length ? `<div class="chat-empty">${icon('messages-square')}<h2>Start a conversation</h2></div>` : ''}</div>
        <form id="su-chat-form" class="chat-compose" data-side="agent"><div id="su-chat-attachment">${attachment ? `<div class="chat-draft-file">${icon('paperclip')}<span>${esc(attachment.name)}</span>${action('x', 'data-shop-action="remove-attachment"', 'Remove attachment')}</div>` : ''}</div>
          <div class="chat-compose-row"><details class="chat-attach-menu"><summary aria-label="Add attachment">${icon('plus')}</summary><div>${btn('Photo library', 'image', 'data-ai-pick="photos"')}${btn('Take photo', 'camera', 'data-ai-pick="camera"')}${btn('File', 'paperclip', 'data-ai-pick="files"')}${btn('Protocol', 'book-open', 'data-shop-action="chat-protocols"')}</div></details>
          <textarea id="su-chat-text" rows="1" placeholder="Message…" aria-label="Message" maxlength="2000">${esc(draft)}</textarea><button class="icon-btn chat-send" type="submit" aria-label="Send message" ${!draft.trim() && !attachment ? 'disabled' : ''}>${icon('send')}</button></div>
          <input id="su-chat-file" type="file" accept="image/*,.pdf,.txt" hidden></form>`;
    };
    messageReadVisible = function () {
      if (state.role !== 'agent') return baseRead();
      if (state.page !== 'messages' || !$('#chat-conversation')?.getClientRects().length || document.visibilityState === 'hidden') return;
      if (inbox.active === 'admin') baseRead(); else if (customer()) customer().unread = 0;
    };
    messageTotalUnread = function () { return baseUnread() + (state.role === 'agent' ? ownCustomers().reduce((n, c) => n + (c.unread || 0), 0) : 0); };
    function watchMore() {
      const list = $('#chat-threads'); if (list) list.scrollTop = inbox.scroll;
      moreObserver?.disconnect();
      const more = $('[data-ai-more]'), account = inbox.account;
      if (more && window.IntersectionObserver) {
        moreObserver = new IntersectionObserver(entries => {
          if (entries.some(e => e.isIntersecting) && inbox.account === account && state.role === 'agent' && state.page === 'messages') { moreObserver.disconnect(); S.visible += 20; render(); }
        }, { root: list, rootMargin: '80px' });
        moreObserver.observe(more);
      }
    }
    messageRefreshInbox = function () { baseRefreshInbox(); if (state.role === 'agent' && state.page === 'messages') watchMore(); };
    function mount() {
      if (state.role !== 'agent' || state.page !== 'messages') return;
      $('#view>.su-message-tabs')?.remove(); // Replaces the earlier separate Admin/Customers screen switcher.
      watchMore();
      const log = $('#su-chat-log'); if (log) log.scrollTop = log.scrollHeight;
      messageGrowInput(); messageFit();
    }
    render = function () {
      if (state.role === 'agent' && ['customers', 'customer-chat'].includes(state.page)) {
        context();
        if (state.page === 'customers') { inbox.filter = 'customers'; inbox.active = null; inbox.open = false; }
        else { const c = ownCustomers().find(c => c.id === S.chat); inbox.active = c?.id || null; inbox.open = !!c; }
        state.page = 'messages'; history.replaceState(null, '', '#messages');
      }
      moreObserver?.disconnect(); baseRender(); mount();
    };
    function select(id) {
      context(); if (id !== 'admin' && !ownCustomers().some(c => c.id === id)) return;
      messageStopRecording(true);
      if (inbox.active !== id) S.attachment = null;
      inbox.active = id; inbox.open = true;
      if (id === 'admin') messaging.active = progressIndex(); else { S.chat = id; customer().unread = 0; }
      render();
    }
    document.addEventListener('click', e => {
      if (state.role !== 'agent' || state.page !== 'messages') return;
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.aiThread !== undefined) select(b.dataset.aiThread);
      if (b.dataset.aiFilter !== undefined) {
        inbox.filter = b.dataset.aiFilter; inbox.scroll = 0; S.visible = 20;
        if ((inbox.filter === 'customers' && inbox.active === 'admin') || (inbox.filter === 'admin' && inbox.active !== 'admin')) { inbox.active = null; inbox.open = false; }
        render();
      }
      if (b.hasAttribute('data-ai-back')) { inbox.open = false; inbox.active = null; render(); }
      if (b.hasAttribute('data-ai-more')) { S.visible += 20; render(); }
      if (b.dataset.aiPick && customer()) {
        $('.chat-attach-menu')?.removeAttribute('open'); const input = $('#su-chat-file');
        input.dataset.aiAccount = String(progressIndex()); input.dataset.aiCustomer = customer().id;
        input.accept = b.dataset.aiPick === 'files' ? 'image/*,.pdf,.txt' : 'image/*';
        if (b.dataset.aiPick === 'camera') input.setAttribute('capture', 'environment'); else input.removeAttribute('capture');
        input.click();
      }
    });
    document.addEventListener('input', e => {
      if (e.target.id !== 'ai-inbox-search') return;
      inbox.query = e.target.value; inbox.scroll = 0; S.visible = 20; messageRefreshInbox();
    });
    document.addEventListener('scroll', e => { if (state.role === 'agent' && state.page === 'messages' && e.target.id === 'chat-threads') inbox.scroll = e.target.scrollTop; }, true);
    document.addEventListener('change', e => { if (e.target.id === 'preview-account-type') { inbox.account = null; } }, true);
    document.addEventListener('change', e => {
      if (e.target.id !== 'su-chat-file' || !e.target.dataset.aiCustomer) return;
      const pick = { account: Number(e.target.dataset.aiAccount), customer: e.target.dataset.aiCustomer };
      delete e.target.dataset.aiAccount; delete e.target.dataset.aiCustomer;
      if (state.role !== 'agent' || state.page !== 'messages' || progressIndex() !== pick.account || customer()?.id !== pick.customer) {
        e.stopImmediatePropagation(); e.target.value = ''; toast('Conversation changed. Please attach the file again.');
      }
    }, true);
    render();
  });
})();
