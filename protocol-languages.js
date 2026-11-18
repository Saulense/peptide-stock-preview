/* Device-local Studio translations. Connected installations use private versioned files. */
(() => {
  'use strict';
  if (window.PS) return;
  let language='en', indexPromise, editor;
  let seeds=new Map();
  function picker(scope='library') {
    return `<label class="ps-doc-language"><span>Document language</span><select data-doc-language="${scope}" aria-label="Document language" translate="no"><option value="en">🇬🇧 English</option><option value="de" ${language==='de'?'selected':''}>🇦🇹 Deutsch</option></select></label>`;
  }
  function seed(library){seeds=new Map(library.map(d=>[d.id,{hash:d.sourceHash,signature:signature(d)}]));}
  const signature=d=>JSON.stringify([d.title,d.blocks,d.coverImage??null]);
  async function source(d) {
    const key=signature(d);
    if(d.germanDraft?.key===key)return d.germanDraft.document;
    if(seeds.get(d.id)?.signature!==key || seeds.get(d.id).hash!==d.sourceHash)return null;
    if(!indexPromise)indexPromise=fetch(new URL('assets/protocols/translations-de.json',document.baseURI),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Translation library unavailable');return r.json();}).catch(err=>{indexPromise=null;throw err;});
    const entry=(await indexPromise).documents[d.id];
    return entry?.sourceHash===d.sourceHash?{title:entry.title,blocks:entry.blocks,imageCaptions:entry.imageCaptions,coverImage:d.coverImage,language:'de'}:null;
  }
  const name=d=>ProtocolExport.filename(d)+'-DE';
  function record(r) {
    if(language==='en'||!r?.current)return r;
    return r.current.german?.baseRevision===r.revision?{...r,current:r.current.german}:null;
  }
  function find(id){return ProtocolStudio.state.docs.find(d=>d.id===id);}
  function field(original,translated,attr) {
    return `<label class="ps-translation-line"><span lang="en" translate="no">${esc(original)}</span><textarea lang="de-AT" ${attr} required>${esc(translated||'')}</textarea></label>`;
  }
  async function edit(id) {
    if(!protocolAdmin())return;
    const d=find(id);if(!d)return;
    const key=signature(d), local=await source(d);
    const t=local?structuredClone(local):{language:'de',title:'',coverImage:d.coverImage,blocks:d.blocks.map(b=>b.type==='image'?structuredClone(b):b.type==='table'?{...b,rows:b.rows.map(row=>row.map(()=>''))}:{...b,text:''})};
    if(!protocolAdmin()||signature(d)!==key)return;
    editor={id,key,t};
    openModal('German translation',`<form id="ps-translation-edit"><p class="muted">Compare each German section with the English source. Pictures retain their original text.</p>${field(d.title,t.title,'data-translation-title')}${d.blocks.map((b,i)=>b.type==='image'?(t.imageCaptions?.[i]||[]).map((caption,j)=>field('Abbildung '+(d.blocks.slice(0,i+1).filter(block=>block.type==='image').length),caption,`data-caption="${i},${j}"`)).join(''):b.type==='table'?b.rows.map((r,j)=>r.map((c,k)=>field(c,t.blocks[i].rows[j][k],`data-cell="${i},${j},${k}"`)).join('')).join(''):field(b.text,t.blocks[i].text,`data-block="${i}"`)).join('')}<div class="form-actions"><button type="submit" class="btn primary">Save German draft</button></div></form>`,true);
  }
  async function save(form) {
    if(!protocolAdmin()||!editor)return;
    const {id,key,t}=editor,d=find(id);if(!d||signature(d)!==key)throw Error('The English source changed.');
    t.title=form.querySelector('[data-translation-title]').value.trim();
    for(const el of form.querySelectorAll('textarea[data-block]'))t.blocks[Number(el.dataset.block)].text=el.value.trim();
    for(const el of form.querySelectorAll('textarea[data-cell]')){const [i,j,k]=el.dataset.cell.split(',').map(Number);t.blocks[i].rows[j][k]=el.value.trim();}
    for(const el of form.querySelectorAll('textarea[data-caption]')){const [i,j]=el.dataset.caption.split(',');t.imageCaptions[i][j]=el.value.trim();}
    const next={...d,germanDraft:{key,document:t}};
    await ProtocolStudio.store(next);d.germanDraft=next.germanDraft;
    closeModal();toast('German draft saved.','success');
  }
  async function view(id,format) {
    if(!protocolAdmin())return;
    const d=find(id);if(!d)return;
    const key=signature(d), t=await source(d);
    if(!t)return edit(id);
    const blob=await ProtocolExport[format||'pdf'](t);
    if(!protocolAdmin()||signature(d)!==key)return;
    if(format){ProtocolExport.download(blob,name(t)+'.'+format);return;}
    const revision=d.active?.revision, canPublish=revision&&signature(d.active)===key&&!ProtocolStudio.pendingIssues(d);
    editor={id,key,t,blob,revision};
    openModal('German translation',`<div class="protocol-meta"><span translate="no">🇦🇹 Deutsch</span><span>Translation draft</span></div>${protocolReaderMarkup()}<div class="form-actions">${btn('Edit translation','pencil',`data-translation-edit="${esc(id)}"`)}${btn('Download PDF','download',`data-de-download="${esc(id)}" data-format="pdf"`)}${btn('Word','download',`data-de-download="${esc(id)}" data-format="docx"`)}</div>${canPublish?`<form id="ps-release-german"><label class="su-check"><input type="checkbox" required> I reviewed this German file against the published English revision.</label><button class="btn primary">Publish German PDF</button></form>`:'<p class="muted">Publish the matching English revision and resolve source notes before sharing this translation.</p>'}`,true);
    protocolLoadViewer({current:{file:new File([blob],name(t)+'.pdf',{type:'application/pdf'})}});
  }
  async function release() {
    if(!protocolAdmin()||!editor)return;
    const {id,key,t,blob,revision}=editor,d=find(id);
    if(!blob||d?.active?.revision!==revision||!revision||signature(d)!==key||signature(d.active)!==key||ProtocolStudio.pendingIssues(d))throw Error('The English source changed.');
    const next={...d,active:{...d.active,german:{baseRevision:revision,pdfName:name(t)+'.pdf',pdfBlob:blob}}};
    await ProtocolStudio.store(next);d.active=next.active;ProtocolStudio.syncRecord(d);closeModal();render();toast('German PDF published.','success');
  }
  function failure(e){toast(e.message||'Translation unavailable.','error');}
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-translation-edit],[data-de-download]');if(!b)return;
    if(b.hasAttribute('data-translation-edit'))edit(b.dataset.translationEdit).catch(failure);else view(b.dataset.deDownload,b.dataset.format).catch(failure);
  });
  document.addEventListener('submit',e=>{if(!['ps-translation-edit','ps-release-german'].includes(e.target.id))return;e.preventDefault();const b=e.target.querySelector('button[type=submit],button.primary');if(b.disabled)return;b.disabled=true;(e.target.id==='ps-release-german'?release():save(e.target)).catch(failure).finally(()=>b.disabled=false);});
  document.addEventListener('change',e=>{
    const scope=e.target.dataset.docLanguage;if(!scope)return;
    language=e.target.value==='de'?'de':'en';
    if(scope==='library')render();else if(scope==='staff-chat')messageProtocolPicker();else document.dispatchEvent(new CustomEvent('ps-document-language',{detail:scope}));
  });
  window.ProtocolLanguages={get language(){return language;},seed,picker,record,view:(id,f)=>view(id,f).catch(failure)};
})();
