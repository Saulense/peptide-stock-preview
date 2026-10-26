/* Admin team design preview. Tab-memory only; never sends invitations or grants real access. */
const teamAreas=[
 {id:'messages',label:'Messages',icon:'messages-square',help:'View all agent conversations, or reply, attach files and resolve conversations. Read state is personal to each admin. Protocol sharing also requires Protocols access.'},
 {id:'dashboard',label:'Dashboard',icon:'layout-dashboard',readOnly:true,help:'View business totals and sales trends.'},
 {id:'agents',label:'Agents',icon:'users-round',help:'View agent profiles, or manage their accounts and agreements. This does not grant access to the admin team.'},
 {id:'catalogue',label:'Catalogue & pricing',icon:'dna',help:'View products and landed costs, or edit categories, default costs and selling prices.'},
 {id:'stock',label:'Stock & dispatch',icon:'boxes',help:'View stock quantities and batches, or adjust stock, prepare dispatches and correct receipts. Landed costs and assigned selling prices are visible here.'},
 {id:'requests',label:'Stock requests',icon:'inbox',help:'View agent requests, or approve, hold and decline them. Sending stock also requires Stock & dispatch management access.'},
 {id:'purchases',label:'Purchases',icon:'package-plus',help:'View supplier orders and payments, or record purchases, supplier payments and warehouse receipts.'},
 {id:'sales',label:'Sales',icon:'chart-no-axes-combined',help:'View sales and their financial breakdown, or record and correct sales.'},
 {id:'expenses',label:'Expenses',icon:'receipt',help:'View business expenses, or add and correct expense records.'},
 {id:'transfers',label:'Agent transfers',icon:'wallet',help:'View transfers reported by agents, or confirm receipt and reject unmatched transfers. Confirmation settles their included sales.'},
 {id:'reports',label:'Reports',icon:'chart-column',readOnly:true,help:'View business-wide revenue, costs, commissions and performance. This reveals financial information even without access to transaction pages.'},
 {id:'protocols',label:'Protocols',icon:'book-open',help:'View, download and share PDFs, or upload, replace and remove them.'},
 {id:'audit',label:'Activity log',icon:'history',readOnly:true,help:'View business-wide changes and who made them. Entries may include financial details.'},
 {id:'settings',label:'Workspace settings',icon:'settings-2',help:'View shared preferences, or edit workspace and stock settings. Only the owner can manage the admin team.'}
];
const teamState={next:4,members:[
 {id:'admin-3',name:'Support admin',email:'support@example.test',status:'Active',mode:'custom',permissions:{messages:'manage',protocols:'view'}},
 {id:'owner',name:'Admin O',email:'',status:'Active',owner:true,mode:'full',permissions:{}},
 {id:'admin-1',name:'Stock manager',email:'stock@example.test',status:'Active',mode:'custom',permissions:{catalogue:'view',stock:'manage',requests:'manage'}},
 {id:'admin-2',name:'Finance reviewer',email:'finance@example.test',status:'Invited',mode:'custom',permissions:{sales:'view',transfers:'view',reports:'view'}}
],history:[],draft:null};
function teamCanEdit(){return state.role==='admin'} // Owner persona only in this UI; server authorization is future scope.
function teamLevels(member){return Object.fromEntries(teamAreas.map(a=>[a.id,member.mode==='full'?(a.readOnly?'view':'manage'):(member.permissions[a.id]||'none')]))}
function teamSummary(member){if(member.owner)return 'Workspace owner';if(member.mode==='full')return 'Full access';const n=Object.values(teamLevels(member)).filter(v=>v!=='none').length;return n+' areas'}
function teamEvent(member,action){teamState.history.unshift({name:member.name,action,time:new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})})}
function teamValidate(draft,id=null){
 if(!draft.name.trim())return 'Enter a name.';
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim()))return 'Enter a valid email address.';
 if(teamState.members.some(m=>m.id!==id&&m.email.toLowerCase()===draft.email.trim().toLowerCase()&&m.status!=='Revoked'))return 'This email already has an invitation or admin account.';
 if(!['full','custom'].includes(draft.mode))return 'Choose an access level.';
 if(draft.mode==='custom'&&!teamAreas.some(a=>['view','manage'].includes(draft.permissions[a.id])))return 'Choose at least one area of access.';
 for(const a of teamAreas){const level=draft.permissions[a.id]||'none';if(!['none','view','manage'].includes(level)||(a.readOnly&&level==='manage'))return 'Check the selected permissions.'}
 return null;
}
function teamSave(draft,id=null){
 if(!teamCanEdit())return 'Only the workspace owner can manage admins.';
 const existing=id&&teamState.members.find(m=>m.id===id);
 if(id&&(!existing||existing.owner||existing.status==='Revoked'))return 'This account cannot be edited.';
 const error=teamValidate(draft,id);if(error)return error;
 const data={name:draft.name.trim(),email:draft.email.trim().toLowerCase(),mode:draft.mode,permissions:Object.fromEntries(teamAreas.map(a=>[a.id,draft.permissions[a.id]||'none']))};
 if(existing){Object.assign(existing,data);teamEvent(existing,'Access updated')}
 else {const m={...data,id:'admin-'+teamState.next++,status:'Invited'};teamState.members.push(m);teamEvent(m,'Invitation created')}
 return null;
}
function teamTransition(id,action){
 if(!teamCanEdit())return 'Only the workspace owner can manage admins.';
 const m=teamState.members.find(x=>x.id===id);if(!m||m.owner)return 'Owner access cannot be changed here.';
 const allowed={resend:['Invited'],revoke:['Invited'],suspend:['Active'],restore:['Suspended']};
 if(!allowed[action]?.includes(m.status))return 'This action is no longer available.';
 if(action==='revoke')m.status='Revoked';if(action==='suspend')m.status='Suspended';if(action==='restore')m.status='Active';
 teamEvent(m,{resend:'Invitation resent',revoke:'Invitation revoked',suspend:'Access suspended',restore:'Access restored'}[action]);return null;
}
function adminTeamPanel(){if(!teamCanEdit())return '';return `<section class="panel admin-team-panel">${panelHead('Admin team','Invite admins with full or custom access. View allows inspection; Manage also allows changes. Only the owner manages admin invitations and access. This preview changes this tab only and sends no email.',btn('Invite admin','user-plus','data-team-invite','primary'))}<div class="team-member-list">${teamState.members.map(m=>`<article class="team-member"><span class="team-avatar">${icon(m.owner?'crown':'user-round')}</span><div class="team-member-identity"><strong>${esc(m.name)}</strong><small>${esc(m.email||'You')}</small></div><div class="team-member-scope">${badge(m.owner?'Owner':m.mode==='full'?'Full access':'Custom access',m.owner?'purple':'blue')}<small>${m.owner?'':teamSummary(m)}</small></div>${badge(m.status,m.status==='Active'?'green':m.status==='Invited'?'orange':'gray')}<div class="team-member-action">${m.owner?`<span class="muted">${icon('lock-keyhole')}</span>`:btn(m.status==='Revoked'?'Details':'Manage','sliders-horizontal',`data-team-edit="${m.id}"`,'small')}</div></article>`).join('')}</div>${teamState.history.length?`<details class="team-history"><summary>Access history <span class="muted">${teamState.history.length}</span></summary>${teamState.history.map(e=>`<div><span><strong>${esc(e.name)}</strong> · ${esc(e.action)}</span><small>Admin O · ${e.time}</small></div>`).join('')}</details>`:''}</section>`}
function teamOpen(id=null){if(!teamCanEdit())return;const member=id&&teamState.members.find(m=>m.id===id);if(member?.owner)return;
 if(member?.status==='Revoked'){openModal('Revoked invitation',keyRows([['Name',esc(member.name)],['Email',esc(member.email)],['Status','Revoked'],['Access',teamSummary(member)]]));return}
 teamState.draft=member?{...member,permissions:{...member.permissions}}:{id:null,name:'',email:'',mode:'custom',permissions:{}};
 const d=teamState.draft;
 openModal(member?'Manage admin':'Invite admin',`<div class="form-grid"><div class="field"><label for="team-name">Name</label><input id="team-name" autocomplete="off" value="${esc(d.name)}" placeholder="Full name"></div><div class="field"><label for="team-email">Email</label><input id="team-email" type="email" autocomplete="off" value="${esc(d.email)}" placeholder="name@example.com" ${member?'readonly':''}></div></div><div class="team-access-heading"><h3>Access ${contextInfo('Admin access levels','Full access covers all operational areas, including financial data and workspace settings. Custom access includes only the selected areas. Admin-team management remains owner-only. Manage includes View; no access means the area is unavailable.')}</h3></div><div class="team-access-choice" role="group" aria-label="Admin access level"><button type="button" data-team-mode="custom" aria-pressed="${d.mode==='custom'}">${icon('sliders-horizontal')}Custom access</button><button type="button" data-team-mode="full" aria-pressed="${d.mode==='full'}">${icon('shield-check')}Full access</button></div><div id="team-permissions"></div><div id="team-error" class="error" role="alert"></div><div class="form-actions">${btn('Cancel','','data-close')}${btn(member?'Save access':'Create invitation',member?'check':'send','data-team-save','primary')}</div>${member?`<div class="team-account-actions">${member.status==='Invited'?btn('Resend invite','mail',`data-team-action="resend" data-team-id="${member.id}"`,'small')+btn('Revoke invite','x',`data-team-action="revoke" data-team-id="${member.id}"`,'small danger'):btn(member.status==='Suspended'?'Restore access':'Suspend access',member.status==='Suspended'?'user-check':'user-x',`data-team-action="${member.status==='Suspended'?'restore':'suspend'}" data-team-id="${member.id}"`,'small '+(member.status==='Suspended'?'':'danger'))}</div>`:''}`,true);teamRenderPermissions();
}
function teamRenderPermissions(){const d=teamState.draft;if(!d||!$('#team-permissions'))return;
 $$('[data-team-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.teamMode===d.mode)));
 $('#team-permissions').innerHTML=d.mode==='full'?`<div class="team-full-access">${icon('shield-check')}<strong>All ${teamAreas.length} areas</strong>${contextInfo('Full admin access','Includes stock, purchases, sales, transfers, financial reports, protocols and workspace settings. Only the owner can invite admins or change their permissions.')}<div>${teamAreas.map(a=>`<span>${esc(a.label)}</span>`).join('')}</div></div>`:`<div class="team-presets" aria-label="Permission presets"><span>Quick setup</span>${[['stock','Stock operator'],['finance','Finance'],['reader','View only']].map(([id,label])=>btn(label,'',`data-team-preset="${id}"`,'small')).join('')}</div><div class="team-permission-list">${teamAreas.map(a=>`<div class="team-permission-row"><span class="team-area-icon">${icon(a.icon)}</span><label for="team-permission-${a.id}">${esc(a.label)}</label>${contextInfo('Access to '+a.label,a.help)}<select id="team-permission-${a.id}" data-team-area="${a.id}" aria-label="${esc(a.label)} access">${['none','view',...(a.readOnly?[]:['manage'])].map(v=>`<option value="${v}" ${(d.permissions[a.id]||'none')===v?'selected':''}>${{none:'No access',view:'View',manage:'Manage'}[v]}</option>`).join('')}</select></div>`).join('')}</div>`;icons();
}
function teamPreset(preset){const d=teamState.draft;if(!d)return;d.permissions={};if(preset==='stock')d.permissions={catalogue:'view',stock:'manage',requests:'manage',protocols:'view'};if(preset==='finance')d.permissions={purchases:'view',sales:'view',expenses:'manage',transfers:'manage',reports:'view'};if(preset==='reader')d.permissions=Object.fromEntries(teamAreas.map(a=>[a.id,'view']));teamRenderPermissions()}
document.addEventListener('change',e=>{if(e.target.dataset.teamArea&&teamCanEdit()&&teamState.draft)teamState.draft.permissions[e.target.dataset.teamArea]=e.target.value});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||![...b.attributes].some(a=>a.name.startsWith('data-team-')))return;e.stopImmediatePropagation();if(!teamCanEdit())return;
 if(b.hasAttribute('data-team-invite'))return teamOpen();if(b.dataset.teamEdit)return teamOpen(b.dataset.teamEdit);
 if(b.dataset.teamMode){teamState.draft.mode=b.dataset.teamMode;teamRenderPermissions();return}
 if(b.dataset.teamPreset)return teamPreset(b.dataset.teamPreset);
 if(b.hasAttribute('data-team-save')){const d=teamState.draft;d.name=$('#team-name').value;d.email=$('#team-email').value;const error=teamSave(d,d.id);if(error){$('#team-error').textContent=error;return}closeModal();render();toast(d.id?'Access updated in this preview.':'Invitation added to preview. No email was sent.');return}
 if(b.dataset.teamAction){const action=b.dataset.teamAction,id=b.dataset.teamId,m=teamState.members.find(x=>x.id===id);if(!m)return;
 if(action==='revoke'||action==='suspend'){openModal(action==='revoke'?'Revoke invitation?':'Suspend admin access?',`<p>${esc(m.name)} ${action==='revoke'?'will no longer be able to accept this invitation.':'will lose access until you restore it.'}</p><div class="form-actions">${btn('Back','',`data-team-edit="${id}"`)}${btn(action==='revoke'?'Revoke invitation':'Suspend access','',`data-team-confirm="${action}" data-team-id="${id}"`,'danger')}</div>`);return}
 const error=teamTransition(id,action);if(error){toast(error);return}closeModal();render();toast(action==='resend'?'Resend recorded in preview. No email was sent.':'Access restored in this preview.');return}
 if(b.dataset.teamConfirm){const error=teamTransition(b.dataset.teamId,b.dataset.teamConfirm);if(error){toast(error);return}closeModal();render();toast('Updated in this preview.')}
},true);
