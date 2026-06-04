import bcrypt from 'bcryptjs';
import { initDB, getDB } from './init.js';

const SALT_ROUNDS = 10;

/** Seed the database with test data */
async function seed() {
  const db = initDB();

  const passwordHash = await bcrypt.hash('123456', SALT_ROUNDS);

  // Clear existing seed data
  db.exec(`
    DELETE FROM exam_reports;
    DELETE FROM exam_task_employees;
    DELETE FROM exam_tasks;
    DELETE FROM factory_contacts;
    DELETE FROM employees;
    DELETE FROM factories;
    DELETE FROM health_agents;
    DELETE FROM c_unit_agents;
    DELETE FROM admins;
    DELETE FROM sms_codes;
  `);

  // Insert admin
  const adminInsert = db.prepare(
    `INSERT INTO admins (name, username, password_hash) VALUES (?, ?, ?)`
  );
  adminInsert.run('系统管理员', 'admin', passwordHash);

  // Insert factory
  const factoryInsert = db.prepare(
    `INSERT INTO factories (name, username, password_hash, industry_type) VALUES (?, ?, ?, ?)`
  );
  const factoryResult = factoryInsert.run('测试工厂A', 'factory1', passwordHash, '制造业');
  const factoryId = factoryResult.lastInsertRowid;

  // Insert factory contacts
  const contactInsert = db.prepare(
    `INSERT INTO factory_contacts (factory_id, name, position, phone) VALUES (?, ?, ?, ?)`
  );
  const contact1 = contactInsert.run(factoryId, '张三', '安全主管', '13900139001');
  const contact1Id = contact1.lastInsertRowid;
  contactInsert.run(factoryId, '李四', '人事经理', '13900139002');

  // Insert employees
  const employeeInsert = db.prepare(
    `INSERT INTO employees (factory_id, name, age, work_years, position, phone, id_card) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const emp1 = employeeInsert.run(factoryId, '王五', 35, 10, '焊工', '13700137001', '110101199001011234');
  const emp2 = employeeInsert.run(factoryId, '赵六', 28, 5, '电工', '13700137002', '110101199701021234');
  const emp3 = employeeInsert.run(factoryId, '孙七', 42, 18, '钳工', '13700137003', '110101198301031234');

  // Insert health agent
  const agentInsert = db.prepare(
    `INSERT INTO health_agents (name, username, password_hash, phone, center_name) VALUES (?, ?, ?, ?, ?)`
  );
  const agentResult = agentInsert.run('陈医生', 'agent1', passwordHash, '13800138001', '市中心体检中心');
  const agentId = agentResult.lastInsertRowid;

  // Insert exam task (pushed)
  const taskInsert = db.prepare(
    `INSERT INTO exam_tasks (factory_id, health_agent_id, factory_contact_id, status) VALUES (?, ?, ?, ?)`
  );
  const taskResult = taskInsert.run(factoryId, agentId, contact1Id, 'pushed');
  const taskId = taskResult.lastInsertRowid;

  // Insert exam task employees
  const taskEmpInsert = db.prepare(
    `INSERT INTO exam_task_employees (exam_task_id, employee_id, exam_status) VALUES (?, ?, ?)`
  );
  taskEmpInsert.run(taskId, emp1.lastInsertRowid, 'pending');
  taskEmpInsert.run(taskId, emp2.lastInsertRowid, 'pending');

  // Insert C unit agent (卫生托管)
  const cUnitInsert = db.prepare(
    `INSERT INTO c_unit_agents (name, username, password_hash) VALUES (?, ?, ?)`
  );
  cUnitInsert.run('刘主任', 'cunit1', passwordHash);

  console.log('Seed data inserted successfully');
  console.log('  Admin: admin / 123456');
  console.log(`  Factory: factory1 / 123456 (id=${factoryId})`);
  console.log(`  Agent (体检): agent1 / 123456 (id=${agentId})`);
  console.log('  C-Unit (卫生托管): cunit1 / 123456');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
