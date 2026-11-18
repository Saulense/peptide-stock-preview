/* Local display catalogue. Locale changes never submit forms or reload an open order. */
(() => {
  'use strict';
  const key = 'peptistock.interface-language';
  let lang = 'en';
  try { lang = localStorage.getItem(key) === 'de' ? 'de' : 'en'; } catch {}
  const original = new WeakMap(), catalog = window.PeptiGerman;
  const attributes = ['placeholder', 'aria-label', 'title', 'data-label', 'alt'];
  // Apply labels around conversations and documents without changing the author's words.
  const protectedText = 'script,style,textarea,code,pre,[contenteditable=true],[translate=no],.ps-language,.chat-bubble p,.chat-quote,.chat-author,.chat-file-name,.chat-preview,.chat-thread-preview,.chat-thread-copy>span,.su-basket-item-info>strong,.su-product-open h2,.su-product-open h3,.su-product-dose,.su-product-excerpt,.product-label strong,.product-name,.su-bubble p,.su-bubble small,.su-chat-message p,.user-copy,.avatar,.protocol-update-note,.ps-source-title,.chat-thread-copy>strong:not([data-system-name]),.order-customer-copy>strong,.su-store-brand[data-custom-name]';
  const fmt = new Map();
  const money = (_,minus,amount) => {
    const decimals = amount.includes('.') ? amount.split('.')[1].length : 0;
    if (!fmt.has(decimals)) fmt.set(decimals,new Intl.NumberFormat('de-AT',{style:'currency',currency:'EUR',minimumFractionDigits:decimals,maximumFractionDigits:decimals}));
    return fmt.get(decimals).format((minus ? -1 : 1)*Number(amount.replaceAll(',','')));
  };
  const months = ['Jän.','Feb.','März','Apr.','Mai','Juni','Juli','Aug.','Sep.','Okt.','Nov.','Dez.'];
  function format(s) {
    return s.replace(/(-?)€(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)(?![\d]|[.,]\d)/g,money)
      .replace(/\b(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep(?:t)?|Oct|Nov|Dec)(?=\b)/g,(_,n,m)=>n+'. '+months[['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(m.slice(0,3))]);
  }
  const regexEscape = s => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const patterns = Object.entries(catalog.patterns).sort(([a],[b])=>b.replace(/\{\d+\}/g,'').length-a.replace(/\{\d+\}/g,'').length)
    .map(([k,v])=>[new RegExp('^'+k.split(/\{\d+\}/).map(regexEscape).join('(.+?)')+'$'),v]);
  const lookup = s => Object.hasOwn(catalog.labels,s) ? catalog.labels[s] : null;
  function translate(raw) {
    const s=raw.trim().replace(/\s+/g,' '); if (!s) return raw;
    if (!/[A-Za-z]/.test(s)) return raw.replace(raw.trim(),format(raw.trim()));
    let text=lookup(s);
    if (text===null && s.length<520) {
      for (const [regex,target] of patterns) {
        const m=regex.exec(s); if (!m) continue;
        text=target.replace(/\{(\d+)\}/g,(_,i)=>lookup(m[+i+1])??m[+i+1]); break;
      }
    }
    if(text===null && / · | → | \| /.test(s))text=s.split(/( · | → | \| )/).map(part=>/^( · | → | \| )$/.test(part)?part:translate(part)).join('');
    return raw.replace(raw.trim(),format(text??raw.trim()));
  }
  function project(node,attr,current,write) {
    let states=original.get(node);
    if (!states) {states=new Map();original.set(node,states);}
    const prev=states.get(attr), source=prev && prev.display===current ? prev.source : current;
    const display=lang==='de' ? translate(source) : source;
    states.set(attr,{source,display}); if (display!==current) write(display);
  }
  function nodeText(n) {
    const el=n.parentElement;
    if (!el || !n.data.trim() || el.closest(protectedText)) return;
    if (el.tagName==='OPTION' && !el.hasAttribute('value')) el.value=el.textContent;
    project(n,'text',n.data,v=>{n.data=v;});
  }
  function element(el) {
    if (el.closest(protectedText)) return;
    for (const a of attributes) if (el.hasAttribute(a)) project(el,a,el.getAttribute(a),v=>el.setAttribute(a,v));
  }
  function scan(root) {
    if (root.nodeType===Node.TEXT_NODE) return nodeText(root);
    if (root.nodeType!==Node.ELEMENT_NODE || root.closest(protectedText)) return;
    element(root);
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,{acceptNode:n=>
      n.nodeType===1 && n.matches(protectedText)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
    let n;while((n=walker.nextNode())) {if(n.nodeType===1)element(n);else nodeText(n);}
  }
  function mount() {
    const hosts = document.querySelectorAll('.sidebar-bottom,.login-form,.su-store-header,.preview-bar');
    for(const host of hosts) {
      if (host.querySelector('.ps-language')) continue;
      const label=document.createElement('label');label.className='ps-language';label.translate=false;
      label.innerHTML='<select aria-label="Sprache / Language"><option value="en" lang="en">🇬🇧 EN</option><option value="de" lang="de-AT">🇦🇹 DE</option></select>';
      const select=label.firstChild;select.options[0].textContent='🇬🇧 English';select.options[1].textContent='🇦🇹 Deutsch';select.value=lang;
      if(host.matches('.su-store-header'))host.insertBefore(label,host.children[1]||null);else if(host.matches('.preview-bar'))host.append(label);else host.prepend(label);
      label.dataset.code=lang.toUpperCase();
    }
  }
  function set(next,save=true) {
    if(!['de','en'].includes(next))return;
    lang=next;document.documentElement.lang=lang==='de'?'de-AT':'en';
    if(save)try{localStorage.setItem(key,lang);}catch{}
    document.querySelectorAll('[data-ps-copy-en]').forEach(el=>{el.textContent=lang==='de'&&el.dataset.psCopyDe?el.dataset.psCopyDe:el.dataset.psCopyEn;});
    mount();document.querySelectorAll('.ps-language select').forEach(s=>{s.value=lang;s.parentElement.dataset.code=lang.toUpperCase();});
    scan(document.body);scan(document.querySelector('title'));
    document.dispatchEvent(new CustomEvent('peptistock-language',{detail:lang}));
  }
  function copy(en,de,escape) {
    en=String(en??'');de=String(de??'');
    return `<span translate="no" data-ps-copy-en="${escape(en)}" data-ps-copy-de="${escape(de)}">${escape(lang==='de'&&de?de:en)}</span>`;
  }
  window.PeptiLanguage={copy,get language(){return lang;},set,text:s=>lang==='de'?translate(s):s};
  document.addEventListener('change',e=>{if(e.target.matches('.ps-language select'))set(e.target.value);});
  window.addEventListener('storage',e=>{if(e.key===key)set(e.newValue==='de'?'de':'en',false);});
  const observer=new MutationObserver(records=>{
    observer.disconnect();
    try {
      mount();
      const roots=new Set();
      for(const r of records){
        if(r.type==='attributes'){element(r.target);continue;}
        if(r.type==='characterData')roots.add(r.target);else for(const n of r.addedNodes)roots.add(n);
      }
      if(lang==='de')for(const root of roots)if(root.isConnected)scan(root);
    }finally{observe();}
  });
  function observe(){observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:attributes});}
  set(lang,false);observe();
})();
