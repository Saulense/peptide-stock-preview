/* Revised account workflows. UI demonstrations only; no business persistence or API. */
const workflow = {type:new URLSearchParams(location.search).get('type')||'commission', shop:new URLSearchParams(location.search).get('account')==='shop', support:false, supportAgent:0, cart:{}, requestLines:[{product:0,qty:10}], requestFilter:'', saleSearch:'', settlementAgent:0};
const accountTypes={commission:{label:'Commission agent',basis:'Profit after costs',rate:20,color:'blue'},partner:{label:'Partner',basis:'Actual sale amount',rate:20,color:'purple'},wholesale:{label:'Prepaid wholesale',basis:'No commission',rate:0,color:'green'}};
if(!accountTypes[workflow.type])workflow.type='commission';
function accountType(){return accountTypes[workflow.type]}
function accountPerson(){return agents[progressIndex()]}
function isWholesale(){return workflow.type==='wholesale'}
function flowButton(label,ico,action,cls=''){return btn(label,ico,`data-flow="${action}"`,cls)}
function workflowNav(){return [['agent','scan-line','Record sale'],['sales','shopping-bag','Orders'],['stock','boxes','My stock'],['requests','send','Requests'],['protocols','book-open','Protocols'],['messages','messages-square','Messages'],...(!isWholesale()?[['balance','wallet','Earnings']]:[]),['settings','settings-2','Settings']]}
function workflowPreviewSelect(){return `<select ${workflow.support?'disabled':''} class="preview-account-type" aria-label="Preview account type" id="preview-account-type">${Object.entries(accountTypes).map(([k,t])=>`<option value="${k}" ${!workflow.shop&&k===workflow.type?'selected':''}>${t.label}</option>`).join('')}<option value="shop" ${workflow.shop?'selected':''}>Own shop</option></select>`}
function workflowSupportBanner(){return workflow.support?`<div class="support-banner">${icon('eye')}<span>Viewing <strong>${accountPerson().name}</strong> · Read-only support preview</span>${flowButton('Return to admin','arrow-left','exit-support','small')}</div>`:''}
function shopAccountIndex(){return agents.findIndex(a=>a.kind==='shop')}
function isShopAccount(index){return agents[index]?.kind==='shop'}
function flowProfile(index){return agents[index]?.profile||['commission','partner','wholesale','commission'][index]||'commission'}
function financeAccountIndices(){return agents.map((_,i)=>i).filter(i=>flowProfile(i)!=='wholesale')}
function commissionFor(p,q=1){return isWholesale()?0:Math.round((workflow.type==='partner'?p.price:Math.max(0,p.price-p.cost))*q*accountType().rate)/100}
function personalStock(){return progressStock()}
function stockSum(){return personalStock().reduce((n,p)=>n+p.qty,0)}
function workflowHome(){return `<h1 class="sr-only">Record sale</h1><div class="flow-mini-stats"><span>${icon('boxes')}<strong>${stockSum()}</strong> vials available</span>${!isWholesale()?`<button class="link-btn" data-page="balance">${icon('wallet')} <strong>${transferMoney(transferSnapshot().net)}</strong> to send ${icon('arrow-up-right')}</button>`:`<span>${icon('circle-check')} Your stock is prepaid</span>`}<button class="link-btn" data-page="sales">Orders ${icon('arrow-up-right')}</button></div>${requestRecords().some(r=>r.agent===progressIndex()&&r.status==='dispatched')?`<div class="delivery-nudge">${icon('package-check')}<div class="grow"><strong>Stock is on the way</strong><small>Confirm receipt once it arrives</small></div>${btn('View delivery','arrow-right','data-flow="receive"','small')}</div>`:''}<div class="quick-sale-layout"><section class="panel sale-picker"><div class="toolbar"><div class="search">${icon('search')}<input id="quick-product-search" ${saleLayoutEditing()?'disabled':''} type="search" placeholder="Find a peptide…" aria-label="Find a peptide" value="${esc(workflow.saleSearch)}"></div><span class="muted">${personalStock().filter(p=>p.qty>0).length} in stock</span></div>${saleLayoutToolbar()}<div class="sale-product-grid ${saleLayoutEditing()?'is-arranging':''}">${saleLayoutProducts().map(p=>`<article class="sale-product" data-quick-product="${p.id}" ${workflow.saleSearch&&!(p.name+' '+p.dose).toLowerCase().includes(workflow.saleSearch)?'hidden':''} data-name="${esc((p.name+' '+p.dose).toLowerCase())}">${saleLayoutHandle(p)}<div class="flex">${productGlyph(p)}<div class="grow"><h3>${esc(p.name)}</h3><small>${doseMarkup(p.dose)}</small></div><span class="stock-pill ${stockIsLow(p)?'low':''}">${p.qty} left</span></div><div class="sale-product-bottom"><strong>${priceLabel(p)} <small>/ vial</small></strong><div class="stepper"><button data-cart-step="${p.id}" data-delta="-1" aria-label="Remove one ${esc(p.name)} ${esc(p.dose)}">${icon('minus')}</button><input aria-label="Quantity of ${esc(p.name)} ${esc(p.dose)}" data-cart-qty="${p.id}" type="number" min="0" max="${p.qty}" step="1" value="${workflow.cart[p.id]||0}"><button data-cart-step="${p.id}" data-delta="1" aria-label="Add one ${esc(p.name)} ${esc(p.dose)}">${icon('plus')}</button></div></div></article>`).join('')}</div><p class="empty" id="quick-empty" ${personalStock().some(p=>p.qty>0&&(p.name+' '+p.dose).toLowerCase().includes(workflow.saleSearch))?'hidden':''}>No matching products.</p></section><aside class="panel sale-basket"><div id="sale-basket-content">${basketMarkup()}</div></aside></div><div id="mobile-sale-review-root">${mobileBasket()}</div>`}
function cartEntries(){return Object.entries(workflow.cart).filter(([id,q])=>q>0).flatMap(([id,q])=>{const p=personalStock().find(p=>p.id===+id);return (priceQuote(progressIndex(),+id,q)||[]).map(l=>({p:{...p,...l},q:l.q}))})}
function cartCommission(entries=cartEntries()){return saleCommissionAllocations(entries.map(({p,q})=>({...p,q}))).reduce((n,c)=>n+c,0)/100}
function basketMarkup(){const entries=cartEntries(),q=entries.reduce((s,x)=>s+x.q,0),total=entries.reduce((s,x)=>s+x.p.price*x.q,0);return `<div class="panel-head"><h2>Your sale</h2>${badge(q+' vials','purple')}</div><div class="basket-body">${entries.length?entries.map(({p,q})=>`<div class="basket-line"><div><strong>${esc(p.name)}</strong><small>${doseMarkup(p.dose)} · ${esc(p.source||'')} · ${q} × ${euro(p.price)}</small></div><span>${euro(p.price*q,2)}</span></div>`).join(''):`<div class="basket-empty">${icon('shopping-basket')}<h3>Start with a product</h3><p>Add quantities using the + buttons.</p></div>`}<div class="basket-total"><span>Sale total</span><strong>${euro(total,2)}</strong></div>${!isWholesale()?`<div class="flex between muted"><span>Estimated commission ${measureInfo('Estimated commission')}</span><strong class="green">${euro(cartCommission(entries),2)}</strong></div>`:''}<button class="btn primary full mt" data-flow="review-sale" ${!entries.length?'disabled':''}>${icon('check')}Review sale</button></div>`}
function mobileBasket(){const entries=cartEntries();return entries.length?`<div class="mobile-sale-review"><div><strong>${entries.reduce((n,x)=>n+x.q,0)} vials</strong><small>${euro(entries.reduce((n,x)=>n+x.p.price*x.q,0),2)}</small></div>${flowButton('Review sale','arrow-right','review-sale','primary')}</div>`:''}
function updateBasket(){$$('[data-quick-product]').forEach(el=>el.classList.toggle('selected',!!workflow.cart[el.dataset.quickProduct]));if($('#mobile-sale-review-root'))$('#mobile-sale-review-root').innerHTML=mobileBasket();if($('#sale-basket-content'))$('#sale-basket-content').innerHTML=basketMarkup();$$('[data-cart-qty]').forEach(el=>{el.value=workflow.cart[el.dataset.cartQty]||0;el.setCustomValidity('')});icons()}
function reviewQuickSale(){return saleReview()}
function salePreviewSuccess(){const result=progressRecordSale();if(!result)return;const summary=Object.values(result.reduce((all,r)=>{const p=all[r.product]||(all[r.product]={...r,q:0});p.q+=r.q;p.remaining=r.remaining;return all},{}));render();openModal('Sale recorded · local preview',`${table(['Product','Sold','Stock remaining'],summary.map(r=>row([productLabel(products[r.product]),r.q,r.remaining])))}<div class="banner mt">${icon('chart-pie')}<span>Your stock, orders and progress ring have updated in this tab.</span></div><div class="form-actions">${btn('View my stock','boxes','data-page="stock" data-close','primary')}${flowButton('Another sale','plus','clear-sale')}</div>`)}
function workflowStock(){return `<h1 class="sr-only">My stock</h1><div class="stock-page-actions">${flowButton('Request stock','plus','restock','primary stock-request-button')}</div>`+progressPanel()+`<div class="flow-stock-summary"><div><strong>${stockSum()}</strong><span>vials available</span></div><div><strong>${requestRecords().filter(r=>r.agent===progressIndex()&&r.status==='dispatched').reduce((n,r)=>n+r.lines.reduce((v,l)=>v+l.qty,0),0)}</strong><span>awaiting receipt</span></div><div><strong>${personalStock().filter(p=>stockIsLow(p)).length}</strong><span>running low</span></div></div><section class="panel agent-stock-panel"><div class="toolbar">${search()}<div class="tabs">${['All','In stock','Low stock','Out of stock'].map(t=>`<button data-stockfilter="${t}" class="${state.stockFilter===t?'active':''}">${t}</button>`).join('')}</div></div>${table(['Peptide','Stock','Price','<span class="sr-only">Action</span>'],personalStock().map(p=>row([`<div class="product-name"><strong>${esc(p.name)}</strong><small class="block stock-category-dose">${productGlyph(p,true)}${doseMarkup(p.dose)}</small></div>`,`<span class="stock-pill ${p.qty===0?'zero':stockIsLow(p)?'low':''}">${p.qty}</span>`,priceLabel(p),btn(p.qty?'Sell':'Restock',p.qty?'plus':'package-plus',p.qty?`data-quick-add="${p.id}"`:`data-flow="restock" data-restock-product="${p.id}"`,p.qty?'small primary':'small')],`data-searchable="${esc((p.name+' '+p.dose).toLowerCase())}" data-quantity="${p.qty}" data-low-threshold="${p.lowStockThreshold??5}"`)))}</section><div class="flex between mt stock-table-foot"><span>${helpLabel('Receipt rules',measureInfo('In-transit stock'))}</span>${flowButton('Report a count issue','clipboard-check','count-issue','small')}</div>`}
const workflowSales=[{id:'SL-1048',product:0,q:1,date:'24 Oct',paid:true},{id:'SL-1047',product:4,q:2,date:'23 Oct',paid:true},{id:'SL-1046',product:2,q:1,date:'22 Oct',paid:false},{id:'SL-1045',product:3,q:1,date:'21 Oct',paid:true}];
function workflowSalesPage(){return orderDeskPage()}
function saleBreakdown(id){openOrder(id)}

function warehouseAvailable(p){if(typeof supplyAvailable==='function')return supplyAvailable(p);const base=p.warehouseInitial??(p.id===8||p.id===9?0:[60,35,100,40,80,25,30][p.id%7]);return base-(typeof requestDesk==='undefined'?0:(requestDesk.warehouse[p.id]||0))}
function restockLineMarkup(line,index){const options=products.filter(p=>!workflow.requestFilter||(p.name+' '+p.dose).toLowerCase().includes(workflow.requestFilter));const selected=products[line.product];if(!options.includes(selected))options.unshift(selected);return `<div class="restock-line" data-request-line="${index}"><div class="field"><label for="request-product-${index}">Product ${index+1}</label><select id="request-product-${index}" data-request-product="${index}">${options.map(p=>`<option value="${p.id}" ${p.id===line.product?'selected':''}>${esc(p.name)} · ${esc(p.dose)}</option>`).join('')}</select></div><div class="field"><label for="request-quantity-${index}">Vials</label><input type="number" id="request-quantity-${index}" data-request-quantity="${index}" min="1" max="100000" step="1" value="${line.qty}"></div><button class="icon-btn" data-remove-request="${index}" aria-label="Remove product ${index+1}" ${workflow.requestLines.length===1?'disabled':''}>${icon('trash-2')}</button></div>`}
function openRestock(productId){if(productId!==undefined){const product=products.find(p=>String(p.id)===String(productId));if(!product){toast('This product is no longer in the catalogue.');return}workflow.requestLines=[{product:product.id,qty:1}]}workflow.requestFilter='';openModal('Request more stock',`<div class="search mb">${icon('search')}<input id="request-catalogue-search" type="search" placeholder="Search the catalogue…" aria-label="Search request catalogue"></div><div id="restock-lines">${workflow.requestLines.map(restockLineMarkup).join('')}</div>${flowButton('Add another product','plus','add-request-line','small mt')}<div class="form-grid mt">${field('Preferred date','2026-10-30','date')}${notes('Note','Anything we should know?')}</div><div class="error" id="request-error" role="alert"></div><div class="form-actions">${btn('Cancel','','data-close')}${flowButton('Send request preview','send','send-request','primary')}</div>`,true);validateRestock()}
function refreshRestock(){const box=$('#restock-lines');if(box){box.innerHTML=workflow.requestLines.map(restockLineMarkup).join('');icons();validateRestock()}}
function validateRestock(){const ids=workflow.requestLines.map(x=>x.product);const invalid=workflow.requestLines.some(x=>!Number.isInteger(x.qty)||x.qty<1||!products[x.product]||x.qty>100000);let message=invalid?'Use whole quantities between 1 and 100,000.':new Set(ids).size!==ids.length?'Combine duplicate products into one line.':'';if($('#request-error'))$('#request-error').textContent=message;const b=$('[data-flow="send-request"]');if(b)b.disabled=!!message;return !message}
function requestDeliveryDetail(){const r=progressData().receipts.get('DEL-026'),difference=r&&r.received.some((q,i)=>q!==[10,5][i]||r.damaged[i]>0);openModal('REQ-017 · Delivery',`${keyRows([['Delivery','DEL-026'],['Dispatched','24 October 2026'],['Status',r?(difference?'Received with difference':'Received'):'Dispatched · awaiting receipt check']])}<div class="shipment-progress mt"><span class="done">Approved</span><span class="done">Dispatched</span><span class="${r?'done':'current'}">${r?'Received':'Receipt check'}</span></div>${table(r?['Product','Sent','Usable received']:['Product','Sent'],[0,10].map((id,i)=>row([products[id].name+' '+products[id].dose,[10,5][i],...(r?[r.received[i]-r.damaged[i]]:[])])))}<div class="form-actions">${flowButton(r?'View receipt':'Check delivery','package-check','receive','primary')}</div>`,true)}
function requestDetail(partial=false){openModal(partial?'REQ-016 · Partial approval':'REQ-018 · Stock request',`${keyRows([['Requested by',partial?'Anna Becker':state.role==='admin'?agents[0].name:accountPerson().name],['Submitted','26 October 2026'],['Note','Please replenish stock for next week.']])}${table(state.role==='admin'?['Product','Requested','Available','Approve']:['Product','Requested','Status'],(partial?[[products[4],20,10]]:[[products[0],10,10],[products[4],5,5]]).map(([p,q,approved],i)=>row(state.role==='admin'?[productLabel(p),q,warehouseAvailable(p),`<input type="number" class="inline-input" aria-label="Approved ${esc(p.name)}" min="0" max="${q}" step="1" value="${approved}">`]:[productLabel(p),q,badge('Requested','orange')])))}${state.role==='admin'?`<div class="mt">${notes('Decision note','Explain partial quantities or ask a question.')}</div><div class="form-actions">${btn('Decline','','data-demo="Decline request"')}${btn('Ask for details','message-square','data-demo="Request details"')}${flowButton('Preview approval','check','approve-request','primary')}</div>`:''}`,true)}
function receiveDelivery(){const receiptIndex=state.role==='admin'?0:progressIndex();if(progressData(receiptIndex).receipts.has('DEL-026')){const r=progressData(receiptIndex).receipts.get('DEL-026');openModal('Receipt already checked',table(['Product','Received','Damaged','Added to stock'],[0,10].map((id,i)=>row([products[id].name,r.received[i],r.damaged[i],r.received[i]-r.damaged[i]])))+'');return}openModal('Check your delivery',`<div class="banner mb">${icon('package-check')}<span>Count each product and confirm what arrived.</span></div>${table(['Product','Sent','Received','Damaged'],[[products[0],10],[products[10],5]].map(([p,q],i)=>row([productLabel(p),q,`<input class="inline-input" data-received="${i}" aria-label="Received ${esc(p.name)}" type="number" min="0" max="${q}" step="1" value="${q}">`,`<input class="inline-input" data-damaged="${i}" aria-label="Damaged ${esc(p.name)}" type="number" min="0" max="${q}" step="1" value="0">`])))}<div class="mt">${notes('Delivery note','Describe any missing or damaged vials.')}</div><p class="muted mt">Received means the total physically received, including any damaged units. Only undamaged units become available.</p><div class="error" id="receipt-error" role="alert"></div><div class="form-actions">${flowButton('Report a difference','triangle-alert','receipt-difference','small')}${flowButton('Confirm receipt preview','check','receipt-success','primary')}</div>`,true)}
function dispatchForm(){openModal('Prepare a dispatch',`<div class="form-grid">${selectField('Recipient',agents.map(a=>a.name))}${field('Dispatch date','2026-10-26','date')}${selectField('Source request',['REQ-018 · Maria','REQ-016 · Anna','Direct stock assignment'])}${field('Carrier','DHL')}</div><div class="section-label">Items being sent</div>${table(['Product','Approved','Dispatch'],[[products[0],10],[products[4],5]].map(([p,q])=>row([productLabel(p),q,`<input class="inline-input" aria-label="Dispatch ${esc(p.name)}" type="number" min="0" max="${q}" step="1" value="${q}">`])))}<div class="field mt"><label for="dispatch-tracking">Tracking number</label><input id="dispatch-tracking" placeholder="Enter tracking number" autocomplete="off"></div><div class="tracking-preview mt">${icon('link')}<div><strong>Tracking button preview</strong><p id="tracking-link-preview">Add a number to preview the agent’s tracking button.</p></div></div><div class="mt">${notes('Delivery note','Optional packing or delivery note…')}</div>${actions('Mark as dispatched')}`,true)}
function setupAccount(index=null,scope='agent'){
 const editing=Number.isInteger(index)&&!!agents[index],shop=scope==='shop'||(editing&&isShopAccount(index)),type=editing?flowProfile(index):'commission';
 openModal(editing?'Edit future terms · '+agents[index].name:shop?'Invite shop staff':'Invite agent',`<form id="setup-account-form" data-editing="${editing}" data-scope="${shop?'shop':'agent'}">
 <div class="form-grid">${shop?`<div class="field full"><label>Stock account</label><div class="setup-settlement">Own shop ${measureInfo('Shop access')}</div></div>`:''}${editing?'':`<div class="field"><label for="setup-name">Full name</label><input id="setup-name" name="name" autocomplete="name" placeholder="${shop?'Staff member’s full name':'Agent’s full name'}" required maxlength="100"></div><div class="field"><label for="setup-email">Email address</label><input id="setup-email" name="email" type="email" autocomplete="email" placeholder="${shop?'staff@example.com':'agent@example.com'}" required maxlength="254" autocapitalize="none" spellcheck="false"></div>`}
 <div class="field full"><label for="setup-type">Earnings agreement ${measureInfo('Account type')}</label><select id="setup-type">${Object.entries(accountTypes).map(([k,t])=>`<option value="${k}" ${k===type?'selected':''}>${t.label}</option>`).join('')}</select></div></div>
 <div id="setup-commission-fields" class="form-grid setup-section"><div class="field"><label for="setup-rate" id="setup-rate-label">Commission rate (%)</label><input id="setup-rate" type="number" value="${accountTypes[type].rate??20}" min="0" max="100" step="0.01" required inputmode="decimal"></div><div class="field" id="setup-cost-field"><label for="setup-costs">Costs included</label><select id="setup-costs"><option>Recorded landed product costs</option><option>Landed cost + explicitly allocated expenses</option></select></div><div class="field full"><label>Settlement ${measureInfo('Settlement')}</label><span class="setup-settlement">Agent keeps commission and transfers the rest</span></div></div>
 <div class="form-grid setup-section">${field('Effective date','2026-10-26','date')}${editing||shop?'':`${selectField('Starting stock',['Assign in a new delivery','No opening stock'])}${field('Stock pool / agreement label','October stock','text','full')}`}</div>
 <div class="form-actions">${btn('Cancel','','data-close')}<button type="submit" class="btn primary">${icon(editing?'check':'send')}${editing?'Save future terms':'Send invitation'}</button></div></form>`,true);
 $('#setup-account-form').closest('.modal').classList.add('account-setup-modal');
 $('#f-effective-date').required=true;
 syncSetupType();
}
function syncSetupType(){
 const type=$('#setup-type').value,commission=type!=='wholesale';
 motionSetVisible($('#setup-commission-fields'),commission);
 $('#setup-rate').disabled=!commission;
 $('#setup-cost-field').hidden=type!=='commission';$('#setup-costs').disabled=type!=='commission';
 $('#setup-rate-label').textContent=type==='partner'?'Commission on sales (%)':'Commission on profit (%)';
}
document.addEventListener('submit',e=>{
 if(e.target.id!=='setup-account-form')return;
 e.preventDefault();const form=e.target,name=$('#setup-name');
 if(name){name.value=name.value.trim();name.setCustomValidity(name.value?'':'Enter a full name.');$('#setup-email').value=$('#setup-email').value.trim()}
 if(!form.reportValidity())return;
 toast(form.dataset.editing==='true'?'Future terms preview checked. No agreement has been changed.':'Invitation preview checked. No email has been sent.');
});
document.addEventListener('input',e=>{if(e.target.id==='setup-name')e.target.setCustomValidity('')});


function agreementsPage(){return `<h1 class="sr-only">Agreements</h1><section class="panel">${panelHead('Current account terms','Sample agreements · effective dates preserve history.',flowButton('Invite agent','user-plus','setup-account','primary'))}${table(['Account','Type','Basis','Rate',''],agents.map((a,i)=>{const type=accountTypes[flowProfile(i)];return row([a.name,type.label,type.basis,type.rate?type.rate+'%':'—',btn('Edit future terms','pencil',`data-account-terms="${i}"`,'small')])}))}</section>`}
function agentDirectoryDetails(i){
 const a=agents[i],t=accountTypes[flowProfile(i)];
 return `<div class="flex agent-directory-identity">${avatar(a)}<div class="grow"><h3>${esc(a.name)}</h3><small>${t.label}</small></div>${badge('Active','green')}</div><div class="agent-stats"><div><small>Available ${measureInfo('Available stock')}</small><strong>${progressTotals(i).units} <small>vials</small></strong></div><div><small>${t.rate?'Rate':'Stock payment'}</small><strong>${t.rate?t.rate+'%':'Prepaid'}</strong></div></div><p class="muted">${t.basis}</p><div class="agent-card-bottom mt">${btn('Performance','chart-pie',`data-progress-open="${i}"`,'small')}${btn('Manage access','','data-modal="manage-agent" data-agent-index="'+i+'"','small')}${btn('View as agent','eye','data-support-agent="'+i+'"','small agent-support-link')}</div>`;
}
function adminAgents(){return pageHead('Your team','Accounts, stock and support access.',flowButton('Invite shop staff','store','setup-shop','')+flowButton('Invite agent','user-plus','setup-account','primary'))+`<div class="agent-directory-search search">${icon('search')}<input id="agent-directory-search" type="search" placeholder="Search agents…" aria-label="Search agents by name or account type"></div><div class="agent-cards agent-directory">${agents.map((a,i)=>{const t=accountTypes[flowProfile(i)];return `<article class="panel agent-card" data-agent-match="${esc((a.name+' '+t.label).toLowerCase())}"><button type="button" class="agent-compact-row" data-agent-summary="${i}" aria-label="Open ${esc(a.name)} details">${avatar(a)}<span class="agent-compact-copy"><strong>${esc(a.name)}</strong><small>${t.label}</small><span class="agent-compact-stock">${progressTotals(i).units} vials</span></span><span class="agent-compact-end">${badge('Active','green')}${icon('chevron-right')}</span></button><div class="agent-desktop-details">${agentDirectoryDetails(i)}</div></article>`}).join('')}</div><div id="agent-directory-empty" class="empty" hidden>No agents found.</div>`}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-agent-summary]');if(!b||state.role!=='admin')return;
 const i=Number(b.dataset.agentSummary);if(!agents[i])return;
 openModal('Agent details',`<div class="agent-directory-detail">${agentDirectoryDetails(i)}</div>`);
});
document.addEventListener('input',e=>{
 if(e.target.id!=='agent-directory-search')return;
 const q=e.target.value.trim().toLowerCase();let matches=0;
 document.querySelectorAll('.agent-directory [data-agent-match]').forEach(card=>{card.hidden=!card.dataset.agentMatch.includes(q);if(!card.hidden)matches++});
 $('#agent-directory-empty').hidden=matches>0;
});
function adminAgentDetail(){return progressAdminDetail()}
function workflowAction(action,productId){
 if(workflow.support&&!['exit-support','track','my-terms','unpaid-breakdown','settlement-example','request-detail','request-partial','received-detail','delivery-difference','delivery-older','request-delivery','remittance-breakdown'].includes(action)){toast('Read-only support preview · return to admin to manage records.');return}
 switch(action){
 case 'review-sale':reviewQuickSale();break;
 case 'sale-success':salePreviewSuccess();break;
 case 'clear-sale':workflow.cart={};closeModal();go('agent');break;
 case 'restock':openRestock(productId);break;
 case 'add-request-line':{const next=products.find(p=>!workflow.requestLines.some(l=>l.product===p.id));if(next)workflow.requestLines.push({product:next.id,qty:1});refreshRestock();break}
 case 'send-request':if(validateRestock()){requestSubmit();break}break;
 case 'legacy-send-request':if(validateRestock())openModal('Request confirmation preview',`<div class="flow-success">${icon('send')}<h3>Ready for Admin O to review</h3><p>Your requested products will appear together in the admin inbox.</p></div>${table(['Product','Vials'],workflow.requestLines.map(l=>row([productLabel(products[l.product]),l.qty])))}${btn('Done','check','data-close','primary mt')}`);break;
 case 'request-delivery':requestDeliveryDetail();break;
 case 'delivery-older':openModal('Delivery received',keyRows([['Delivery','DEL-018'],['Product','Retatrutide 10 mg'],['Confirmed','20 of 20 vials'],['Received on','10 October 2026']]));break;
 case 'request-detail':requestDetail();break;
 case 'request-partial':requestDetail(true);break;
 case 'approve-request':openModal('Approval preview',`<div class="flow-success">${icon('circle-check')}<h3>Next: prepare the delivery</h3><p>Approval and dispatch are separate steps.</p></div>${flowButton('Prepare dispatch','truck','dispatch','primary mt')}`);break;
 case 'dispatch':priceNewDispatch();break;
 case 'receive':{const r=requestRecords().find(r=>r.agent===(state.role==='admin'?0:progressIndex())&&r.status==='dispatched');if(r)requestOpen(r.id);break;}
 case 'receipt-success':case 'receipt-difference':{const received=$$('[data-received]').map(x=>+x.value),damaged=$$('[data-damaged]').map(x=>+x.value),sent=[10,5];const bad=received.some((q,i)=>!Number.isInteger(q)||q<0||q>sent[i]||!Number.isInteger(damaged[i])||damaged[i]<0||damaged[i]>q);if(bad){$('#receipt-error').textContent='Received must be a whole quantity within sent stock; damaged cannot exceed received.';return}const difference=received.some((q,i)=>q!==sent[i]||damaged[i]>0);if(!progressReceive(received,damaged,state.role==='admin'?0:progressIndex())){toast('Receipt already applied to this preview.');return}render();openModal(difference?'Receipt difference preview':'Receipt confirmed · preview',`${table(['Product','Received','Damaged','Available after check'],received.map((q,i)=>row([i?'BPC-157 10 mg':'Retatrutide 10 mg',q,damaged[i],q-damaged[i]])))}<div class="banner mt">${icon(difference?'triangle-alert':'circle-check')}<span>${difference?'The difference would be sent to Admin O for review.':'All sent quantities have been checked.'}</span></div>`);break}
 case 'track':openModal('Track your delivery',`${keyRows([['Delivery','DEL-026'],['Tracking number','DEMO-TRACK-026'],['Status','Example only']])}<div class="tracking-preview mt">${icon('external-link')}<div><strong>Track parcel</strong><p>A carrier tracking link will open here once a real dispatch is connected.</p></div></div><p class="notice">Sample number · no external tracking request is made.</p>`);break;
 case 'delivery-difference':openModal('Delivery difference',keyRows([['Delivery','DEL-024'],['Product','GHK-Cu 50 mg'],['Sent','10 vials'],['Received in usable condition','9 vials'],['Damaged','1 vial'],['Action','Admin review requested']])+`<p class="notice">Discrepancy example · not a live delivery.</p>`);break;
 case 'received-detail':openModal('Request received',keyRows([['Request','REQ-012'],['Product','Epitalon 10 mg'],['Confirmed','10 of 10 vials'],['Received on','18 October 2026']]));break;
 case 'count-issue':openModal('Report a stock difference',`<div class="form-grid">${selectField('Product',personalStock().map(p=>p.name+' '+p.dose))}${field('Actual usable count',0,'number')}${notes('Reason','Explain any missing, damaged or miscounted stock.')}</div>${actions('Send count for review')}`);break;
 case 'agent-transfer':transferForm();break;
 case 'remittance-breakdown':transferBreakdown();break;
 case 'my-terms':go('balance');break;
 case 'setup-account':setupAccount();break;
 case 'setup-shop':setupAccount(null,'shop');break;
 case 'prepare-settlement':go('payments');break;
 case 'exit-support':{const previous=workflow.supportAgent;workflow.support=false;state.role='admin';state.agent=previous;const url=new URL(location.href);url.searchParams.set('view','admin');url.searchParams.delete('type');history.replaceState(null,'',url);go('agents');break}
 }
}
// Capture workflow actions first, so the legacy prototype handlers cannot double-handle them.
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.settlementAgent!==undefined){e.preventDefault();e.stopImmediatePropagation();go('payments');return}
 if(b.dataset.agentIndex!==undefined)state.agent=+b.dataset.agentIndex;
 if(b.dataset.accountTerms!==undefined){e.preventDefault();e.stopImmediatePropagation();setupAccount(Number(b.dataset.accountTerms));return}if(b.dataset.flow){e.preventDefault();e.stopImmediatePropagation();workflowAction(b.dataset.flow,b.dataset.restockProduct);return}
 if(b.dataset.supportAgent!==undefined){e.preventDefault();e.stopImmediatePropagation();workflow.support=true;workflow.supportAgent=+b.dataset.supportAgent;workflow.type=flowProfile(workflow.supportAgent);workflow.cart={};state.role='agent';const url=new URL(location.href);url.searchParams.set('view','agent');url.searchParams.set('type',workflow.type);history.replaceState(null,'',url);go('agent');return}
 if(b.dataset.cartStep!==undefined||b.dataset.quickAdd!==undefined){e.preventDefault();e.stopImmediatePropagation();if(workflow.support){toast('Read-only support preview.');return}const id=+(b.dataset.cartStep??b.dataset.quickAdd),p=personalStock().find(p=>p.id===id);const quantityInput=$(`[data-cart-qty="${id}"]`);if(quantityInput)quantityInput.setCustomValidity('');workflow.cart[id]=Math.max(0,Math.min(p.qty,(workflow.cart[id]||0)+(Number(b.dataset.delta)||1)));if(b.dataset.quickAdd!==undefined)go('agent');else updateBasket();return}
 if(b.dataset.removeRequest!==undefined){workflow.requestLines.splice(+b.dataset.removeRequest,1);refreshRestock();return}
 if(b.dataset.saleBreakdown){saleBreakdown(b.dataset.saleBreakdown);return}
 if(workflow.support&&(b.dataset.demo||b.dataset.toggle!==undefined)){e.preventDefault();e.stopImmediatePropagation();toast('Read-only support preview.');return}
},true);
document.addEventListener('input',e=>{
 const el=e.target;
 if(el.dataset.cartQty!==undefined){const p=personalStock().find(p=>p.id===+el.dataset.cartQty),q=Number(el.value);if(!Number.isInteger(q)||q<0||q>p.qty){const review=$('[data-flow="review-sale"]');if(review)review.disabled=true;el.setCustomValidity('Use a whole quantity between 0 and '+p.qty);el.reportValidity();return}el.setCustomValidity('');workflow.cart[p.id]=q;updateBasket()}
 if(el.id==='quick-product-search'){workflow.saleSearch=el.value.toLowerCase();let count=0;$$('[data-quick-product]').forEach(card=>{card.hidden=!card.dataset.name.includes(workflow.saleSearch);if(!card.hidden)count++});$('#quick-empty').hidden=count>0}
 if(el.id==='request-catalogue-search'){workflow.requestFilter=el.value.toLowerCase();refreshRestock()}
 if(el.dataset.requestQuantity!==undefined){workflow.requestLines[+el.dataset.requestQuantity].qty=Number(el.value);validateRestock()}
 if(el.id==='dispatch-tracking')$('#tracking-link-preview').textContent=el.value.trim()?'Track parcel · '+el.value.trim()+' · carrier link will be connected during implementation.':'Add a number to preview the agent’s tracking button.';
});
document.addEventListener('change',e=>{
 const el=e.target;
 if(el.id==='preview-account-type'){workflow.shop=el.value==='shop';workflow.type=workflow.shop?flowProfile(shopAccountIndex()):el.value;workflow.cart={};workflow.saleSearch='';const url=new URL(location.href);if(workflow.shop)url.searchParams.set('account','shop');else url.searchParams.delete('account');url.searchParams.set('type',workflow.type);history.replaceState(null,'',url);go('agent')}
 if(el.dataset.requestProduct!==undefined){workflow.requestLines[+el.dataset.requestProduct].product=+el.value;refreshRestock()}
 if(el.id==='setup-type')syncSetupType();
});
function applyWorkflowPresentation(){document.body.classList.toggle('agent-view',state.role==='agent');document.body.classList.toggle('support-view',workflow.support);if(workflow.support){$$('#view input:not([type="search"]),#view textarea,#view select').forEach(el=>el.disabled=true)} }

// Orders group checkout lines without changing the immutable sale IDs used by transfers.
const orderViews=new Map();
function orderView(){const key=progressIndex();if(!orderViews.has(key))orderViews.set(key,{query:'',product:'all',payment:'all',page:1});return orderViews.get(key)}
function agentOrders(index=progressIndex()){
 const grouped=new Map();
 for(const line of progressSales(index)){
  const id=line.orderId||line.id;
  if(!grouped.has(id))grouped.set(id,{id,date:saleDate(line),sequence:line.orderSequence||0,customerName:line.customerName||'',customerContact:line.customerContact||'',note:line.note||'',lines:[]});
  grouped.get(id).lines.push(line);
 }
 return [...grouped.values()].map(o=>{
  o.quantity=o.lines.reduce((n,r)=>n+r.q,0);
  o.total=o.lines.reduce((n,r)=>n+Math.round(r.price*100)*r.q,0);
  o.commission=o.lines.reduce((n,r)=>n+Math.round(progressCommission(r,index)*100),0);
  o.payment=o.lines.every(r=>r.paid)?'Collected':o.lines.every(r=>!r.paid)?'Unpaid':'Part collected';
  const statuses=[...new Set(o.lines.map(saleSettlementStatus))];o.settlement=statuses.length===1?statuses[0]:'Mixed';
  return o;
 }).sort((a,b)=>b.date.localeCompare(a.date)||b.sequence-a.sequence||b.id.localeCompare(a.id,undefined,{numeric:true}));
}
function orderPageData(){
 const v=orderView();
 const q=v.query.trim().toLocaleLowerCase();
 const orders=agentOrders().filter(o=>(v.product==='all'||o.lines.some(r=>String(r.product)===v.product))&&(v.payment==='all'||o.payment===v.payment)&&(!q||[o.id,o.customerName,o.customerContact,o.note,...o.lines.flatMap(r=>[r.id,products[r.product].name,products[r.product].dose])].join(' ').toLocaleLowerCase().includes(q)));
 const pages=Math.max(1,Math.ceil(orders.length/50));v.page=Math.max(1,Math.min(v.page,pages));
 return {orders:orders.slice((v.page-1)*50,v.page*50),total:orders.length,pages,page:v.page};
}
function orderProducts(o){return [...new Set(o.lines.map(r=>products[r.product].name+' · '+products[r.product].dose))]}
function orderDisplayDate(date){const d=new Date(date+'T00:00:00Z');return Number.isNaN(d.getTime())?date:d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'})}
function mobileOrdersList(d,wholesale){
 let previousDate='';
 return `<div class="mobile-orders-list" aria-label="Orders">${d.orders.map(o=>{const names=orderProducts(o),date=o.date!==previousDate?`<div class="order-date-group">${esc(orderDisplayDate(o.date))}</div>`:'';previousDate=o.date;return `${date}<button class="mobile-order" data-order-open="${esc(o.id)}" aria-label="Open order ${esc(o.id)}"><span class="mobile-order-top"><strong>${esc(o.id)}</strong><strong>${transferMoney(o.total)}</strong></span><span class="mobile-order-meta">${o.customerName?`<span>${esc(o.customerName)}</span><span aria-hidden="true">·</span>`:''}<span>${o.quantity} ${o.quantity===1?'vial':'vials'}</span>${o.note?`<span aria-label="Note added">${icon('file-text')}</span>`:''}</span><span class="mobile-order-products">${esc(names[0])}${names.length>1?` · +${names.length-1} more`:''}</span><span class="mobile-order-statuses">${badge(o.payment,o.payment==='Collected'?'green':'orange')}${!wholesale?badge(o.settlement,o.settlement==='Received'?'green':'purple'):''}${icon('chevron-right')}</span></button>`}).join('')}${!d.total?'<div class="empty">No orders match these filters.</div>':''}</div>`;
}
function ordersResults(){
 const d=orderPageData(),wholesale=isWholesale();
 return `<div class="orders-list orders-desktop-list" role="table" aria-label="Orders"><div class="orders-list-head" role="row"><span role="columnheader">Order</span><span role="columnheader">Customer / products</span><span role="columnheader">Total</span><span role="columnheader">Payment</span>${!wholesale?'<span role="columnheader">Transfer status</span>':''}</div>${d.orders.map(o=>{const names=orderProducts(o);return `<div class="order-list-row" role="row"><div class="order-identity" role="cell"><button class="order-number" data-order-open="${esc(o.id)}" aria-label="Open order ${esc(o.id)}">${esc(o.id)}${icon('chevron-right')}</button><small>${esc(o.date)}</small></div><div class="order-description" role="cell">${o.customerName?`<strong>${esc(o.customerName)}</strong>`:''}<span>${esc(names[0])}${names.length>1?` <em>+${names.length-1} more</em>`:''}</span><small>${o.quantity} ${o.quantity===1?'vial':'vials'}${o.note?' · Note added':''}</small></div><div class="order-amount" role="cell"><strong>${transferMoney(o.total)}</strong>${!wholesale?`<small>${transferMoney(o.commission)} earned</small>`:''}</div><div class="order-payment" role="cell">${badge(o.payment,o.payment==='Collected'?'green':'orange')}</div>${!wholesale?`<div class="order-settlement" role="cell">${badge(o.settlement,o.settlement==='Received'?'green':'purple')}</div>`:''}</div>`}).join('')}${!d.total?'<div class="empty">No orders match these filters.</div>':''}</div>${mobileOrdersList(d,wholesale)}<div class="orders-pagination"><div><button class="icon-btn" data-orders-page="${d.page-1}" aria-label="Previous orders page" ${d.page===1?'disabled':''}>${icon('chevron-left')}</button><span>Page ${d.page} of ${d.pages}</span><button class="icon-btn" data-orders-page="${d.page+1}" aria-label="Next orders page" ${d.page===d.pages?'disabled':''}>${icon('chevron-right')}</button></div></div>`;
}
function ordersPage(){
 const v=orderView(),ids=[...new Set(progressSales().map(r=>r.product))];
 return `<h1 class="sr-only">Orders</h1><section class="panel orders-panel ${isWholesale()?'orders-wholesale':''}"><div class="orders-toolbar"><div class="search">${icon('search')}<input id="orders-search" type="search" aria-label="Search orders" placeholder="Search orders…" title="Search by order, customer, product or note" value="${esc(v.query)}"></div><button class="icon-btn orders-filter-toggle ${v.product!=='all'||v.payment!=='all'?'has-filters':''}" data-orders-filter-toggle aria-label="Filter orders" aria-controls="orders-filters" aria-expanded="${!!v.filtersOpen}">${icon('sliders-horizontal')}</button><button class="btn primary orders-add" data-page="agent" aria-label="Record sale">${icon('plus')}<span>Record sale</span></button><div id="orders-filters" class="orders-filters ${v.filtersOpen?'is-open':''}"><select id="orders-product" aria-label="Filter orders by product"><option value="all">All products</option>${ids.map(id=>`<option value="${id}" ${v.product===String(id)?'selected':''}>${esc(products[id].name+' · '+products[id].dose)}</option>`).join('')}</select><select id="orders-payment" aria-label="Filter orders by payment">${['all','Collected','Unpaid','Part collected'].map(p=>`<option value="${p}" ${v.payment===p?'selected':''}>${p==='all'?'All payments':p}</option>`).join('')}</select></div></div><div id="orders-results">${ordersResults()}</div></section>`;
}
function refreshOrders(){const el=$('#orders-results');if(el){el.innerHTML=ordersResults();icons()}}
function findOrder(id){return agentOrders().find(o=>o.id===id||o.lines.some(r=>r.id===id))}
function openOrder(id){return orderDetail(progressIndex(),id)}

// Existing orders are read-only for agents. Corrections use the audited admin flow.
function editOrder(id){if(state.role==='agent')toast('Share this order in chat to request a correction.')}
function saveOrderMetadata(){return false}
document.addEventListener('input',e=>{if(e.target.id==='orders-search'){orderView().query=e.target.value;orderView().page=1;refreshOrders()}});
document.addEventListener('change',e=>{if(['orders-product','orders-payment'].includes(e.target.id)){orderView()[e.target.id==='orders-product'?'product':'payment']=e.target.value;orderView().page=1;refreshOrders();$('[data-orders-filter-toggle]')?.classList.toggle('has-filters',orderView().product!=='all'||orderView().payment!=='all')}});
document.addEventListener('click',e=>{
 const toggle=e.target.closest('[data-orders-filter-toggle]');if(toggle){orderView().filtersOpen=!orderView().filtersOpen;toggle.setAttribute('aria-expanded',String(orderView().filtersOpen));$('#orders-filters')?.classList.toggle('is-open',orderView().filtersOpen);return}
 const b=e.target.closest('[data-order-open],[data-order-edit],[data-order-save],[data-orders-page]');if(!b)return;e.preventDefault();
 if(b.dataset.orderOpen)return openOrder(b.dataset.orderOpen);
 if(b.dataset.orderEdit)return editOrder(b.dataset.orderEdit);
 if(b.dataset.orderSave){const id=b.dataset.orderSave;if(saveOrderMetadata(id,{customerName:$('#order-customer').value,customerContact:$('#order-contact').value,note:$('#order-note').value})){refreshOrders();openOrder(id);toast('Order details updated.')}return}
 orderView().page=+b.dataset.ordersPage;refreshOrders();$('#orders-results')?.scrollIntoView({block:'start',behavior:'instant'});
});

/* Personal product layout: presentation preferences only; never inventory or prices. */
const saleLayouts=new Map();
let saleLayoutEdit=null, saleLayoutDrag=null;
function saleLayoutKey(){return 'peptistock.product-layout.v1.agent-'+progressIndex()}
function saleLayoutPreference(){
 const key=saleLayoutKey();
 if(!saleLayouts.has(key)){
  let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{}
  saleLayouts.set(key,{mode:['custom','popular','name'].includes(saved.mode)?saved.mode:'custom',order:Array.isArray(saved.order)?[...new Set(saved.order.filter(Number.isInteger))]:[]});
 }
 return saleLayouts.get(key);
}
function saleLayoutSave(){
 try{localStorage.setItem(saleLayoutKey(),JSON.stringify(saleLayoutPreference()));return true}catch{toast('Order kept for this visit. Browser storage is unavailable.');return false}
}
function saleLayoutEditing(){return saleLayoutEdit?.key===saleLayoutKey()&&!workflow.support}
function saleLayoutProducts(){
 const list=personalStock().filter(p=>p.qty>0),pref=saleLayoutPreference(),editing=saleLayoutEditing();
 const order=editing?saleLayoutEdit.order:pref.order,mode=editing?'custom':pref.mode,rank=new Map(order.map((id,i)=>[id,i]));
 const sold=new Map();if(mode==='popular')progressSales().forEach(s=>sold.set(s.product,(sold.get(s.product)||0)+s.q));
 return list.sort((a,b)=>mode==='name'?a.name.localeCompare(b.name)||a.dose.localeCompare(b.dose)||a.id-b.id:mode==='popular'?(sold.get(b.id)||0)-(sold.get(a.id)||0)||a.id-b.id:(rank.get(a.id)??Infinity)-(rank.get(b.id)??Infinity)||a.id-b.id);
}
function saleLayoutToolbar(){
 const editing=saleLayoutEditing(),disabled=workflow.support?'disabled':'';
 return `<div class="sale-layout-tools">${editing?`<span class="sale-arrange-hint">${icon('grip-vertical')} Drag to arrange</span><div class="sale-layout-actions"><button class="btn small" data-sale-layout="reset">Reset</button><button class="btn small" data-sale-layout="cancel">Cancel</button><button class="btn small primary" data-sale-layout="done">${icon('check')}Done</button></div>`:`<label class="sr-only" for="sale-product-sort">Product order</label><select id="sale-product-sort" title="Top sellers sorts by your recorded units sold across all dates." ${disabled}>${[['custom','My order'],['popular','Top sellers'],['name','Name A–Z']].map(([value,label])=>`<option value="${value}" ${saleLayoutPreference().mode===value?'selected':''}>${label}</option>`).join('')}</select><button class="btn small" data-sale-layout="start" ${disabled}>${icon('grip-vertical')}Arrange</button>`}</div><span class="sr-only" id="sale-layout-announcement" role="status" aria-live="polite"></span>`;
}
function saleLayoutHandle(p){return saleLayoutEditing()?`<button class="sale-drag-handle" data-sale-drag="${p.id}" aria-label="Move ${esc(p.name)} ${esc(p.dose)}. Use arrow keys to reorder." title="Drag to move">${icon('grip-vertical')}</button>`:''}
function saleLayoutAnnounce(text){const el=document.getElementById('sale-layout-announcement');if(el)el.textContent=text}
function saleLayoutReadGrid(){return [...document.querySelectorAll('.sale-product-grid > [data-quick-product]')].map(el=>Number(el.dataset.quickProduct))}
function saleLayoutMove(card,target,after){
 if(!target||target===card)return;
 const grid=card.parentElement,items=[...grid.children],positions=new Map(items.map(el=>[el,el.getBoundingClientRect()]));
 if(after)target.after(card);else target.before(card);
 if(items.every((el,i)=>grid.children[i]===el))return;
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)items.forEach(el=>{if(el===card)return;const a=positions.get(el),b=el.getBoundingClientRect();el.getAnimations().forEach(x=>x.cancel());el.animate([{transform:`translate(${a.left-b.left}px,${a.top-b.top}px)`},{transform:'translate(0,0)'}],{duration:150,easing:'ease-out'})});
 saleLayoutEdit.order=saleLayoutReadGrid();
}
function saleLayoutFinishDrag(cancel=false){
 const d=saleLayoutDrag;if(!d)return;saleLayoutDrag=null;cancelAnimationFrame(d.frame);d.ghost.remove();d.card.classList.remove('is-dragging');document.body.classList.remove('sale-dragging');
 if(d.capture.hasPointerCapture(d.pointer))d.capture.releasePointerCapture(d.pointer);
 if(cancel){const grid=d.card.parentElement;d.before.forEach(id=>{const el=grid.querySelector(`[data-quick-product="${id}"]`);if(el)grid.append(el)});saleLayoutEdit.order=d.before}
 d.handle.focus({preventScroll:true});saleLayoutAnnounce(cancel?'Move cancelled.':`Moved to position ${saleLayoutReadGrid().indexOf(Number(d.card.dataset.quickProduct))+1}.`);
}
function saleLayoutDragFrame(){
 const d=saleLayoutDrag;if(!d)return;
 const header=document.querySelector('.topbar')?.getBoundingClientRect(),top=Math.max(0,header?.bottom||0)+50,bottom=innerHeight-75;
 const speed=d.y<top?-Math.min(14,(top-d.y)*.24):d.y>bottom?Math.min(14,(d.y-bottom)*.24):0;
 if(speed)window.scrollBy(0,speed);
 d.ghost.style.transform=`translate3d(${d.x-d.offsetX}px,${d.y-d.offsetY}px,0)`;
 const target=document.elementFromPoint(d.x,d.y)?.closest('[data-quick-product]');
 if(target&&target!==d.card&&target.parentElement===d.card.parentElement){
  const rect=target.getBoundingClientRect(),current=d.card.getBoundingClientRect();
  const sameRow=Math.abs(current.top-rect.top)<rect.height/2;
  const after=sameRow?d.x>rect.left+rect.width/2:d.y>rect.top+rect.height/2;
  // Cross the target midpoint before moving; avoids jitter at grid boundaries.
  const ahead=saleLayoutReadGrid().indexOf(Number(target.dataset.quickProduct))>saleLayoutReadGrid().indexOf(Number(d.card.dataset.quickProduct));
  if(after===ahead)saleLayoutMove(d.card,target,after);
 }
 d.frame=requestAnimationFrame(saleLayoutDragFrame);
}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-sale-layout]');if(!b)return;e.preventDefault();if(workflow.support)return;
 const action=b.dataset.saleLayout;
 if(action==='start'){saleLayoutEdit={key:saleLayoutKey(),order:saleLayoutProducts().map(p=>p.id)};workflow.saleSearch=''}
 if(action==='reset')saleLayoutEdit.order=[];
 if(action==='done'){
  const pref=saleLayoutPreference(),visible=saleLayoutReadGrid();
  // Keep absent/out-of-stock products in the preference so they return to a known position.
  const slots=[...pref.order];let next=0;
  const merged=slots.map(id=>visible.includes(id)?visible[next++]:id);
  pref.order=[...new Set([...merged,...visible.slice(next)])];pref.mode='custom';saleLayoutSave();saleLayoutEdit=null;
 }
 if(action==='cancel')saleLayoutEdit=null;
 render();document.querySelector(action==='start'?'[data-sale-drag]':'[data-sale-layout="start"]')?.focus({preventScroll:true});
},true);
document.addEventListener('change',e=>{if(e.target.id==='sale-product-sort'&&!workflow.support){saleLayoutPreference().mode=e.target.value;saleLayoutSave();render();document.getElementById('sale-product-sort')?.focus({preventScroll:true})}});
document.addEventListener('pointerdown',e=>{
 const handle=e.target.closest('[data-sale-drag]');if(!handle||!saleLayoutEditing()||e.button!==0||saleLayoutDrag)return;
 e.preventDefault();const card=handle.closest('[data-quick-product]'),r=card.getBoundingClientRect(),ghost=card.cloneNode(true);
 ghost.classList.add('sale-drag-ghost');ghost.setAttribute('aria-hidden','true');ghost.inert=true;ghost.style.width=r.width+'px';ghost.style.height=r.height+'px';document.body.append(ghost);
 saleLayoutDrag={handle,card,ghost,capture:card.parentElement,pointer:e.pointerId,x:e.clientX,y:e.clientY,offsetX:e.clientX-r.left,offsetY:e.clientY-r.top,before:saleLayoutReadGrid(),frame:0};card.parentElement.setPointerCapture(e.pointerId);card.classList.add('is-dragging');document.body.classList.add('sale-dragging');saleLayoutDragFrame();
});
document.addEventListener('pointermove',e=>{if(saleLayoutDrag&&e.pointerId===saleLayoutDrag.pointer){e.preventDefault();saleLayoutDrag.x=e.clientX;saleLayoutDrag.y=e.clientY}},{passive:false});
document.addEventListener('pointerup',e=>{if(saleLayoutDrag&&e.pointerId===saleLayoutDrag.pointer)saleLayoutFinishDrag()});
document.addEventListener('pointercancel',()=>saleLayoutFinishDrag(true));
document.addEventListener('lostpointercapture',()=>saleLayoutFinishDrag(true));
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&saleLayoutDrag){e.preventDefault();saleLayoutFinishDrag(true);return}
 const handle=e.target.closest('[data-sale-drag]');if(!handle||!saleLayoutEditing()||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
 e.preventDefault();const card=handle.closest('[data-quick-product]'),cards=[...card.parentElement.children],i=cards.indexOf(card),forward=['ArrowDown','ArrowRight','End'].includes(e.key),index=e.key==='Home'?0:e.key==='End'?cards.length-1:i+(forward?1:-1);
 saleLayoutMove(card,cards[index],forward);handle.focus({preventScroll:true});card.scrollIntoView({block:'nearest'});saleLayoutAnnounce(`Position ${saleLayoutReadGrid().indexOf(Number(card.dataset.quickProduct))+1} of ${cards.length}.`);
});
