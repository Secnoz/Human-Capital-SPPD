let pending:Promise<void>|undefined;
export function ensureAdmin(database:D1Database,passwordHash:string|undefined){if(!passwordHash)return Promise.resolve();if(!pending)pending=install(database,passwordHash).catch(error=>{pending=undefined;throw error;});return pending;}
async function install(database:D1Database,passwordHash:string){
 const id='sppd-testing-admin',email='admin@sppd.test',now=Date.now();
 // Existing credentials survive redeployment and password changes.
 await database.batch([
  database.prepare("INSERT OR IGNORE INTO auth_user(id,name,email,email_verified,created_at,updated_at,role,banned) VALUES(?,?,?,0,?,?,'admin',0)").bind(id,'Admin HC',email,now,now),
  database.prepare("INSERT OR IGNORE INTO auth_account(id,account_id,provider_id,user_id,password,created_at,updated_at) VALUES(?,?,'credential',?,?,?,?)").bind(id+'-credential',id,id,passwordHash,now,now),
  database.prepare("INSERT OR IGNORE INTO members(email,user_id,name,role,active) VALUES(?,?,?,'admin',1)").bind(email,id,'Admin HC'),
 ]);
}
