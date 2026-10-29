import { dummyEmployees } from '../src/data/dummy-employees';

const seedKey = '__seed_dummy_employees_100_v1';
let pending: Promise<void> | undefined;

export function ensureDummyEmployees(database: D1Database): Promise<void> {
  if (!pending) pending = install(database).catch(error => {
    pending = undefined;
    throw error;
  });
  return pending;
}

async function install(database: D1Database) {
  if (await database.prepare('SELECT key FROM settings WHERE key=?').bind(seedKey).first()) return;
  const at = new Date().toISOString();
  const details = JSON.stringify({ dataset: seedKey, requestedCount: dummyEmployees.length });
  // The marker and records commit together, so a retry cannot restore edited or removed dummy records.
  await database.batch([
    ...dummyEmployees.map(employee => database.prepare(
      'INSERT INTO employees(id,employee_no,name,position,unit,criterion,credit_name,bank_account,active) SELECT ?,?,?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM settings WHERE key=?) ON CONFLICT DO NOTHING',
    ).bind(employee.id, employee.employeeNo, employee.name, employee.position, employee.unit, employee.criterion, employee.creditName, employee.bankAccount, employee.active, seedKey)),
    database.prepare('INSERT INTO audit(id,actor,action,target,at,details) SELECT ?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM settings WHERE key=?)')
      .bind(seedKey, 'system:dummy-data', 'employees.dummy_seeded', 'employees', at, details, seedKey),
    database.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT DO NOTHING')
      .bind(seedKey, JSON.stringify({ appliedAt: at, requestedCount: dummyEmployees.length })),
  ]);
}
