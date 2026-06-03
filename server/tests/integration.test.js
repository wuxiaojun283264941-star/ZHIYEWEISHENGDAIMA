/**
 * 职业健康体检管理平台 - 全面集成测试
 * 测试所有 API 端点、端到端业务流程、边界/异常场景
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NODE = process.env.NODE_PATH || process.execPath;
const SERVER_DIR = path.join(__dirname, '..');
const DB_PATH = path.join(SERVER_DIR, 'data', 'occupational_health.db');
const BASE_URL = 'http://127.0.0.1:3099';

let serverProcess = null;
let testResults = [];
let currentRound = 2;

// ============================================================
// Utility Functions
// ============================================================

function log(msg) {
  console.log(`[TEST] ${msg}`);
}

function assert(condition, testName, details = '') {
  if (condition) {
    testResults.push({ name: testName, status: 'PASS', details });
    log(`  ✅ PASS: ${testName}`);
  } else {
    testResults.push({ name: testName, status: 'FAIL', details });
    log(`  ❌ FAIL: ${testName} ${details ? '— ' + details : ''}`);
  }
}

async function httpRequest(method, urlPath, body = null, headers = {}) {
  const url = `${BASE_URL}${urlPath}`;
  const fetchOptions = {
    method,
    headers: { ...headers },
  };
  if (body && method !== 'GET') {
    fetchOptions.headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(body);
  } else if (method === 'POST' || method === 'PUT') {
    // For POST/PUT with no body, send empty JSON to avoid Fastify CTP error
    fetchOptions.headers['Content-Type'] = 'application/json';
    fetchOptions.body = '{}';
  }
  try {
    const resp = await fetch(url, fetchOptions);
    let data;
    try { data = await resp.json(); } catch { data = null; }
    return { status: resp.status, data };
  } catch (err) {
    return { status: 0, data: null, error: err.message };
  }
}

async function multipartRequest(urlPath, fields, fileBuffer, fileName, headers = {}) {
  const url = `${BASE_URL}${urlPath}`;
  const formData = new FormData();
  for (const [key, val] of Object.entries(fields)) {
    formData.append(key, val);
  }
  if (fileBuffer) {
    formData.append('file', new Blob([fileBuffer]), fileName);
  }
  try {
    const resp = await fetch(url, { method: 'POST', headers, body: formData });
    let data;
    try { data = await resp.json(); } catch { data = null; }
    return { status: resp.status, data };
  } catch (err) {
    return { status: 0, data: null, error: err.message };
  }
}

// ============================================================
// Server Management
// ============================================================

async function startServer() {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, PORT: '3099' };
    serverProcess = spawn(NODE, ['index.js'], {
      cwd: SERVER_DIR,
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let started = false;
    const onOutput = (data) => {
      const msg = data.toString();
      if (msg.includes('Server running') && !started) {
        started = true;
        resolve(true);
      }
    };
    serverProcess.stdout.on('data', onOutput);
    serverProcess.stderr.on('data', onOutput);

    setTimeout(() => {
      if (!started) resolve(true);
    }, 5000);
  });
}

function stopServer() {
  if (serverProcess) {
    try { serverProcess.kill('SIGTERM'); } catch (e) { /* ignore */ }
    serverProcess = null;
  }
}

// ============================================================
// Test Suites
// ============================================================

async function testHealthCheck() {
  log('\n=== 健康检查 ===');
  const { status, data } = await httpRequest('GET', '/api/health');
  assert(status === 200, '健康检查 - 返回 200');
  assert(data && data.status === 'ok', '健康检查 - 状态为 ok');
}

// ----- Auth Tests -----

async function testAuthEndpoints() {
  log('\n=== 认证端点测试 ===');

  // Factory login - success
  const factoryLoginRes = await httpRequest('POST', '/api/auth/factory-login', {
    username: 'factory1', password: '123456',
  });
  assert(factoryLoginRes.status === 200, '工厂登录 - 成功返回 200');
  assert(factoryLoginRes.data && factoryLoginRes.data.code === 0, '工厂登录 - 响应码 0');
  assert(factoryLoginRes.data?.data?.token, '工厂登录 - 返回 token');
  assert(factoryLoginRes.data?.data?.user?.role === 'factory', '工厂登录 - 角色为 factory');

  // Factory login - wrong password
  const factoryLoginWrong = await httpRequest('POST', '/api/auth/factory-login', {
    username: 'factory1', password: 'wrongpass',
  });
  assert(factoryLoginWrong.status === 400, '工厂登录 - 错误密码返回 400');

  // Factory login - missing fields
  const factoryLoginEmpty = await httpRequest('POST', '/api/auth/factory-login', {});
  assert(factoryLoginEmpty.status === 400, '工厂登录 - 空参数返回 400');

  // Agent send code - success
  const sendCodeRes = await httpRequest('POST', '/api/auth/agent-send-code', { phone: '13800138001' });
  assert(sendCodeRes.status === 200, '对接人发送验证码 - 成功返回 200');
  assert(sendCodeRes.data && sendCodeRes.data.code === 0, '对接人发送验证码 - 响应码 0');

  // Agent send code - unregistered phone
  const sendCodeWrong = await httpRequest('POST', '/api/auth/agent-send-code', { phone: '99999999999' });
  assert(sendCodeWrong.status === 400, '对接人发送验证码 - 未注册手机号返回 400');

  // Agent send code - missing phone
  const sendCodeEmpty = await httpRequest('POST', '/api/auth/agent-send-code', {});
  assert(sendCodeEmpty.status === 400, '对接人发送验证码 - 空参数返回 400');

  // Agent login - success
  const agentLoginRes = await httpRequest('POST', '/api/auth/agent-login', {
    phone: '13800138001', code: '123456',
  });
  assert(agentLoginRes.status === 200, '对接人登录 - 成功返回 200');
  assert(agentLoginRes.data?.data?.token, '对接人登录 - 返回 token');
  assert(agentLoginRes.data?.data?.user?.role === 'health_agent', '对接人登录 - 角色为 health_agent');

  // Agent login - wrong code
  const agentLoginWrong = await httpRequest('POST', '/api/auth/agent-login', {
    phone: '13800138001', code: '654321',
  });
  assert(agentLoginWrong.status === 400, '对接人登录 - 错误验证码返回 400');

  // Agent login - missing fields
  const agentLoginEmpty = await httpRequest('POST', '/api/auth/agent-login', {});
  assert(agentLoginEmpty.status === 400, '对接人登录 - 空参数返回 400');

  // C-unit login - success
  const cunitLoginRes = await httpRequest('POST', '/api/auth/cunit-login', {
    username: 'cunit1', password: '123456',
  });
  assert(cunitLoginRes.status === 200, 'C单位登录 - 成功返回 200');
  assert(cunitLoginRes.data?.data?.token, 'C单位登录 - 返回 token');
  assert(cunitLoginRes.data?.data?.user?.role === 'cunit', 'C单位登录 - 角色为 cunit');

  // C-unit login - wrong password
  const cunitLoginWrong = await httpRequest('POST', '/api/auth/cunit-login', {
    username: 'cunit1', password: 'wrongpass',
  });
  assert(cunitLoginWrong.status === 400, 'C单位登录 - 错误密码返回 400');

  // C-unit login - missing fields
  const cunitLoginEmpty = await httpRequest('POST', '/api/auth/cunit-login', {});
  assert(cunitLoginEmpty.status === 400, 'C单位登录 - 空参数返回 400');

  // Get current user - with valid token
  const meRes = await httpRequest('GET', '/api/auth/me', null, {
    Authorization: `Bearer ${factoryLoginRes.data.data.token}`,
  });
  assert(meRes.status === 200, '获取当前用户 - 成功返回 200');
  assert(meRes.data?.data?.role === 'factory', '获取当前用户 - 角色正确');

  // Get current user - without token
  const meNoAuthRes = await httpRequest('GET', '/api/auth/me');
  assert(meNoAuthRes.status === 401, '获取当前用户 - 无Token返回 401');

  return {
    factoryToken: factoryLoginRes.data?.data?.token,
    agentToken: agentLoginRes.data?.data?.token,
    cunitToken: cunitLoginRes.data?.data?.token,
  };
}

// ----- Employee CRUD Tests -----

async function testEmployeeCRUD(factoryToken) {
  log('\n=== 员工 CRUD 测试 ===');
  const auth = { Authorization: `Bearer ${factoryToken}` };

  // List employees
  const listRes = await httpRequest('GET', '/api/employees?page=1&pageSize=20', null, auth);
  assert(listRes.status === 200, '员工列表 - 返回 200');
  assert(listRes.data?.code === 0, '员工列表 - 响应码 0');
  assert(Array.isArray(listRes.data?.data?.list), '员工列表 - 返回数组');

  // Create employee
  const createRes = await httpRequest('POST', '/api/employees', {
    name: '测试员工', age: 30, work_years: 5,
    position: '测试工种', phone: '13800001111', id_card: '320101199501011111',
  }, auth);
  assert(createRes.status === 200, '创建员工 - 返回 200', createRes.status !== 200 ? `status=${createRes.status}, msg=${createRes.data?.message}` : '');
  const createdEmployee = createRes.data?.data;
  if (createRes.status === 200 && createdEmployee) {
    assert(createdEmployee.name === '测试员工', '创建员工 - 姓名正确');
  } else {
    assert(false, '创建员工 - 响应数据缺失', `data=${JSON.stringify(createRes.data)}`);
  }

  // Only proceed if we got a valid employee
  const employeeId = createdEmployee?.id;
  if (!employeeId) {
    log('  ⚠️  跳过后续员工测试（创建失败）');
    return null;
  }

  // Get employee detail
  const detailRes = await httpRequest('GET', `/api/employees/${employeeId}`, null, auth);
  assert(detailRes.status === 200, '员工详情 - 返回 200');
  assert(detailRes.data?.data?.id === employeeId, '员工详情 - ID 正确');

  // Update employee
  const updateRes = await httpRequest('PUT', `/api/employees/${employeeId}`, {
    name: '更新员工', age: 31, work_years: 6,
    position: '更新工种', phone: '13800001112', id_card: '320101199501011111',
  }, auth);
  assert(updateRes.status === 200, '更新员工 - 返回 200', updateRes.status !== 200 ? `msg=${updateRes.data?.message}` : '');
  if (updateRes.status === 200 && updateRes.data?.data) {
    assert(updateRes.data.data.name === '更新员工', '更新员工 - 姓名更新正确');
  } else {
    assert(false, '更新员工 - 响应数据缺失', `data=${JSON.stringify(updateRes.data)}`);
  }

  // Create employee - missing required fields
  const createFailRes = await httpRequest('POST', '/api/employees', { age: 25 }, auth);
  assert(createFailRes.status === 400, '创建员工 - 缺少必填字段返回 400');

  // Get non-existent employee
  const notFoundRes = await httpRequest('GET', '/api/employees/99999', null, auth);
  assert(notFoundRes.status === 404, '员工详情 - 不存在返回 404');

  // List with keyword
  const searchRes = await httpRequest('GET', '/api/employees?keyword=更新', null, auth);
  assert(searchRes.status === 200, '员工搜索 - 返回 200');

  // Delete employee
  const deleteRes = await httpRequest('DELETE', `/api/employees/${employeeId}`, null, auth);
  assert(deleteRes.status === 200, '删除员工 - 返回 200');

  // Verify deleted
  const afterDeleteRes = await httpRequest('GET', `/api/employees/${employeeId}`, null, auth);
  assert(afterDeleteRes.status === 404, '删除员工 - 删除后获取返回 404');

  return employeeId;
}

// ----- Factory Contact CRUD Tests -----

async function testFactoryContactCRUD(factoryToken) {
  log('\n=== 联系人 CRUD 测试 ===');
  const auth = { Authorization: `Bearer ${factoryToken}` };

  // List contacts
  const listRes = await httpRequest('GET', '/api/factory-contacts', null, auth);
  assert(listRes.status === 200, '联系人列表 - 返回 200');
  assert(Array.isArray(listRes.data?.data), '联系人列表 - 返回数组');

  // Create contact
  const createRes = await httpRequest('POST', '/api/factory-contacts', {
    name: '测试联系人', position: '安全员', phone: '13800002222',
  }, auth);
  assert(createRes.status === 200, '创建联系人 - 返回 200');
  assert(createRes.data?.data?.name === '测试联系人', '创建联系人 - 姓名正确');
  const contactId = createRes.data?.data?.id;

  if (!contactId) {
    log('  ⚠️  跳过后续联系人测试（创建失败）');
    return null;
  }

  // Update contact
  const updateRes = await httpRequest('PUT', `/api/factory-contacts/${contactId}`, {
    name: '更新联系人', position: '主管', phone: '13800002223',
  }, auth);
  assert(updateRes.status === 200, '更新联系人 - 返回 200');
  assert(updateRes.data?.data?.name === '更新联系人', '更新联系人 - 姓名更新正确');

  // Create contact - missing required fields
  const createFailRes = await httpRequest('POST', '/api/factory-contacts', { position: '安全员' }, auth);
  assert(createFailRes.status === 400, '创建联系人 - 缺少必填字段返回 400');

  // Delete contact
  const deleteRes = await httpRequest('DELETE', `/api/factory-contacts/${contactId}`, null, auth);
  assert(deleteRes.status === 200, '删除联系人 - 返回 200');

  return contactId;
}

// ----- Health Agent Query Tests -----

async function testHealthAgentQuery(factoryToken) {
  log('\n=== 体检对接人查询测试 ===');
  const auth = { Authorization: `Bearer ${factoryToken}` };

  // Get bound agents
  const boundRes = await httpRequest('GET', '/api/health-agents', null, auth);
  assert(boundRes.status === 200, '绑定对接人列表 - 返回 200');

  // Get all agents
  const allRes = await httpRequest('GET', '/api/health-agents/all', null, auth);
  assert(allRes.status === 200, '全部对接人列表 - 返回 200');
  assert(Array.isArray(allRes.data?.data), '全部对接人列表 - 返回数组');
  assert(allRes.data?.data?.length > 0, '全部对接人列表 - 包含数据');
}

// ----- Exam Task Tests -----

async function testExamTaskFlow(factoryToken, agentToken, cunitToken) {
  log('\n=== 体检任务流程测试 ===');
  const factoryAuth = { Authorization: `Bearer ${factoryToken}` };
  const agentAuth = { Authorization: `Bearer ${agentToken}` };
  const cunitAuth = { Authorization: `Bearer ${cunitToken}` };

  // Get all health agents to find one
  const agentsRes = await httpRequest('GET', '/api/health-agents/all', null, factoryAuth);
  const agentId = agentsRes.data?.data?.[0]?.id;
  if (!agentId) {
    assert(false, '体检任务流程 - 无法获取对接人ID');
    return {};
  }

  // Use existing seeded employee (from seed.js)
  // Get employees list to find existing ones
  const empListRes = await httpRequest('GET', '/api/employees?page=1&pageSize=20', null, factoryAuth);
  const existingEmps = empListRes.data?.data?.list || [];
  let empId;
  if (existingEmps.length > 0) {
    empId = existingEmps[0].id;
  } else {
    // Create employee directly via DB since the API has a bug
    const createRes = await httpRequest('POST', '/api/employees', {
      name: '任务员工', age: 30, work_years: 5,
      position: '焊工', phone: '13800003333', id_card: '320101199401013333',
    }, factoryAuth);
    empId = createRes.data?.data?.id;
    if (!empId) {
      assert(false, '体检任务流程 - 无法创建员工');
      return {};
    }
  }

  // Get or create a contact
  const contactListRes = await httpRequest('GET', '/api/factory-contacts', null, factoryAuth);
  const existingContacts = contactListRes.data?.data || [];
  let contactId;
  if (existingContacts.length > 0) {
    contactId = existingContacts[0].id;
  } else {
    const contactRes = await httpRequest('POST', '/api/factory-contacts', {
      name: '任务联系人', position: '安全主管', phone: '13800004444',
    }, factoryAuth);
    contactId = contactRes.data?.data?.id;
  }

  // Push exam task
  const pushRes = await httpRequest('POST', '/api/exam-tasks/push', {
    health_agent_id: agentId,
    factory_contact_id: contactId,
    employee_ids: [empId],
  }, factoryAuth);
  assert(pushRes.status === 200, '推送体检任务 - 返回 200', pushRes.status !== 200 ? `msg=${pushRes.data?.message}` : '');
  assert(pushRes.data?.code === 0, '推送体检任务 - 响应码 0');
  const taskId = pushRes.data?.data?.id;
  assert(pushRes.data?.data?.status === 'pushed', '推送体检任务 - 状态为 pushed');

  if (!taskId) {
    assert(false, '推送体检任务 - 未返回任务ID');
    return {};
  }

  // Push task - missing required fields
  const pushFailRes = await httpRequest('POST', '/api/exam-tasks/push', {
    health_agent_id: agentId,
  }, factoryAuth);
  assert(pushFailRes.status === 400, '推送体检任务 - 缺少员工IDs返回 400');

  // Get pushed tasks
  const pushedRes = await httpRequest('GET', '/api/exam-tasks/pushed', null, factoryAuth);
  assert(pushedRes.status === 200, '推送历史 - 返回 200');

  // Get task detail (as factory)
  const detailRes = await httpRequest('GET', `/api/exam-tasks/${taskId}`, null, factoryAuth);
  assert(detailRes.status === 200, '任务详情(工厂) - 返回 200');

  // Agent - get pending tasks
  const pendingRes = await httpRequest('GET', '/api/exam-tasks/pending', null, agentAuth);
  assert(pendingRes.status === 200, '待办任务列表 - 返回 200');

  // Agent - fetch task
  const fetchRes = await httpRequest('POST', `/api/exam-tasks/${taskId}/fetch`, null, agentAuth);
  log(`  [DEBUG] Fetch response: status=${fetchRes.status}, data=${JSON.stringify(fetchRes.data)?.substring(0, 200)}`);
  assert(fetchRes.status === 200, '拉取任务 - 返回 200', fetchRes.status !== 200 ? `status=${fetchRes.status}, msg=${fetchRes.data?.message}` : '');
  assert(fetchRes.data?.data?.status === 'in_progress', '拉取任务 - 状态变为 in_progress', fetchRes.data?.data ? `actual status=${fetchRes.data.data.status}` : 'no data');

  // Verify task detail now shows in_progress
  const detailAfterFetchRes = await httpRequest('GET', `/api/exam-tasks/${taskId}`, null, agentAuth);
  assert(detailAfterFetchRes.status === 200, '拉取后任务详情 - 返回 200');
  assert(detailAfterFetchRes.data?.data?.status === 'in_progress', '拉取后任务详情 - 状态为 in_progress');

  // Agent - complete task
  const completeRes = await httpRequest('POST', `/api/exam-tasks/${taskId}/complete`, null, agentAuth);
  assert(completeRes.status === 200, '完成任务 - 返回 200');
  assert(completeRes.data?.data?.status === 'completed', '完成任务 - 状态变为 completed');

  // Agent - history
  const historyRes = await httpRequest('GET', '/api/exam-tasks/history', null, agentAuth);
  assert(historyRes.status === 200, '对接人历史 - 返回 200');

  // C-unit - completed tasks list (via exam-tasks route)
  const cunitTaskListRes = await httpRequest('GET', '/api/exam-tasks/cunit-list', null, cunitAuth);
  assert(cunitTaskListRes.status === 200, 'C单位任务列表(exam-tasks) - 返回 200');

  // C-unit - completed tasks list (via cunit route)
  const cunitTaskListRes2 = await httpRequest('GET', '/api/cunit/tasks', null, cunitAuth);
  assert(cunitTaskListRes2.status === 200, 'C单位任务列表(cunit) - 返回 200');

  // C-unit - task detail
  const cunitTaskDetailRes = await httpRequest('GET', `/api/cunit/tasks/${taskId}`, null, cunitAuth);
  assert(cunitTaskDetailRes.status === 200, 'C单位任务详情 - 返回 200');
  assert(cunitTaskDetailRes.data?.data?.employees, 'C单位任务详情 - 包含员工列表');
  assert(cunitTaskDetailRes.data?.data?.reports, 'C单位任务详情 - 包含报告列表');

  return { taskId, empId, agentId, contactId };
}

// ----- Exam Report Tests -----

async function testExamReportUpload(factoryToken, agentToken, cunitToken) {
  log('\n=== 体检报告上传测试 ===');
  const factoryAuth = { Authorization: `Bearer ${factoryToken}` };
  const agentAuth = { Authorization: `Bearer ${agentToken}` };
  const cunitAuth = { Authorization: `Bearer ${cunitToken}` };

  // First, we need a task in in_progress state
  // Get existing employees
  const empListRes = await httpRequest('GET', '/api/employees?page=1&pageSize=20', null, factoryAuth);
  const existingEmps = empListRes.data?.data?.list || [];
  let reportEmpId;
  if (existingEmps.length > 0) {
    reportEmpId = existingEmps[0].id;
  } else {
    const empRes = await httpRequest('POST', '/api/employees', {
      name: '报告员工', age: 35, work_years: 8,
      position: '电工', phone: '13800005555', id_card: '320101199001015555',
    }, factoryAuth);
    reportEmpId = empRes.data?.data?.id;
    if (!reportEmpId) {
      assert(false, '报告上传 - 无法创建员工，跳过报告测试');
      return null;
    }
  }

  const agentsRes = await httpRequest('GET', '/api/health-agents/all', null, factoryAuth);
  const reportAgentId = agentsRes.data?.data?.[0]?.id;
  if (!reportAgentId) {
    assert(false, '报告上传 - 无法获取对接人，跳过报告测试');
    return null;
  }

  // Get or create a contact
  const contactListRes = await httpRequest('GET', '/api/factory-contacts', null, factoryAuth);
  const existingContacts = contactListRes.data?.data || [];
  let reportContactId;
  if (existingContacts.length > 0) {
    reportContactId = existingContacts[0].id;
  } else {
    const contactRes = await httpRequest('POST', '/api/factory-contacts', {
      name: '报告联系人', position: '主管', phone: '13800006666',
    }, factoryAuth);
    reportContactId = contactRes.data?.data?.id;
  }

  const pushRes = await httpRequest('POST', '/api/exam-tasks/push', {
    health_agent_id: reportAgentId,
    factory_contact_id: reportContactId,
    employee_ids: [reportEmpId],
  }, factoryAuth);
  const reportTaskId = pushRes.data?.data?.id;
  if (!reportTaskId) {
    assert(false, '报告上传 - 无法推送任务，跳过报告测试');
    return null;
  }

  const fetchRes = await httpRequest('POST', `/api/exam-tasks/${reportTaskId}/fetch`, null, agentAuth);
  assert(fetchRes.status === 200, '报告测试 - 拉取任务成功');

  // Upload PDF report
  const pdfContent = Buffer.from('%PDF-1.4 test content for report upload');
  const uploadRes = await multipartRequest(
    '/api/exam-reports/upload',
    { task_id: String(reportTaskId), employee_id: String(reportEmpId) },
    pdfContent, 'test_report.pdf',
    { Authorization: `Bearer ${agentToken}` }
  );
  assert(uploadRes.status === 200, '上传PDF报告 - 返回 200', uploadRes.status !== 200 ? `msg=${uploadRes.data?.message}` : '');
  assert(uploadRes.data?.code === 0, '上传PDF报告 - 响应码 0');
  const reportId = uploadRes.data?.data?.id;

  if (reportId) {
    // Get reports for task
    const taskReportsRes = await httpRequest('GET', `/api/exam-reports/task/${reportTaskId}`, null, agentAuth);
    assert(taskReportsRes.status === 200, '任务报告列表 - 返回 200');
    assert(Array.isArray(taskReportsRes.data?.data), '任务报告列表 - 返回数组');

    // Get report detail
    const reportDetailRes = await httpRequest('GET', `/api/exam-reports/${reportId}`, null, agentAuth);
    assert(reportDetailRes.status === 200, '报告详情 - 返回 200');

    // Download report
    try {
      const downloadResp = await fetch(`${BASE_URL}/api/exam-reports/${reportId}/download`, {
        headers: { Authorization: `Bearer ${agentToken}` },
      });
      assert(downloadResp.ok, '下载报告 - 返回成功');
    } catch (e) {
      assert(false, '下载报告 - 请求成功', e.message);
    }

    // Delete report
    const deleteRes = await httpRequest('DELETE', `/api/exam-reports/${reportId}`, null, agentAuth);
    assert(deleteRes.status === 200, '删除报告 - 返回 200');
  } else {
    assert(false, '上传PDF报告 - 未返回报告ID', `data=${JSON.stringify(uploadRes.data)}`);
  }

  // Upload non-PDF file - should fail
  const txtContent = Buffer.from('This is a text file, not PDF');
  const uploadTxtRes = await multipartRequest(
    '/api/exam-reports/upload',
    { task_id: String(reportTaskId), employee_id: String(reportEmpId) },
    txtContent, 'test_report.txt',
    { Authorization: `Bearer ${agentToken}` }
  );
  assert(uploadTxtRes.status === 400, '上传非PDF报告 - 返回 400');

  // Upload without file
  const noFileRes = await multipartRequest(
    '/api/exam-reports/upload',
    { task_id: String(reportTaskId), employee_id: String(reportEmpId) },
    null, null,
    { Authorization: `Bearer ${agentToken}` }
  );
  assert(noFileRes.status === 400, '上传无文件报告 - 返回 400');

  // C-unit - employee reports
  const cunitEmpReportsRes = await httpRequest('GET', `/api/cunit/employees/${reportEmpId}/reports`, null, cunitAuth);
  assert(cunitEmpReportsRes.status === 200, 'C单位员工报告 - 返回 200');

  return reportId;
}

// ----- Authentication & Authorization Tests -----

async function testAuthAndRoleGuards(factoryToken, agentToken, cunitToken) {
  log('\n=== 认证与权限测试 ===');

  // Unauthenticated access to protected endpoint
  const noAuthRes = await httpRequest('GET', '/api/employees');
  assert(noAuthRes.status === 401, '未认证访问 - 返回 401');

  // Invalid token
  const invalidTokenRes = await httpRequest('GET', '/api/employees', null, {
    Authorization: 'Bearer invalidtoken123',
  });
  assert(invalidTokenRes.status === 401, '无效Token - 返回 401');

  // Missing Bearer prefix
  const noBearerRes = await httpRequest('GET', '/api/employees', null, {
    Authorization: 'sometoken',
  });
  assert(noBearerRes.status === 401, '缺少Bearer前缀 - 返回 401');

  // Factory accessing health-agent-only endpoint
  const factoryAgentEndpoint = await httpRequest('GET', '/api/exam-tasks/pending', null, {
    Authorization: `Bearer ${factoryToken}`,
  });
  assert(factoryAgentEndpoint.status === 403, '工厂访问对接人端点 - 返回 403');

  // Health agent accessing factory-only endpoint
  const agentFactoryEndpoint = await httpRequest('GET', '/api/employees', null, {
    Authorization: `Bearer ${agentToken}`,
  });
  assert(agentFactoryEndpoint.status === 403, '对接人访问工厂端点 - 返回 403');

  // C-unit accessing factory-only endpoint
  const cunitFactoryEndpoint = await httpRequest('GET', '/api/employees', null, {
    Authorization: `Bearer ${cunitToken}`,
  });
  assert(cunitFactoryEndpoint.status === 403, 'C单位访问工厂端点 - 返回 403');

  // Factory accessing C-unit-only endpoint
  const factoryCunitEndpoint = await httpRequest('GET', '/api/cunit/tasks', null, {
    Authorization: `Bearer ${factoryToken}`,
  });
  assert(factoryCunitEndpoint.status === 403, '工厂访问C单位端点 - 返回 403');

  // Health agent accessing C-unit-only endpoint
  const agentCunitEndpoint = await httpRequest('GET', '/api/cunit/tasks', null, {
    Authorization: `Bearer ${agentToken}`,
  });
  assert(agentCunitEndpoint.status === 403, '对接人访问C单位端点 - 返回 403');

  // Report upload - factory cannot upload (only health_agent)
  const factoryUploadRes = await multipartRequest(
    '/api/exam-reports/upload',
    { task_id: '1', employee_id: '1' },
    Buffer.from('%PDF-1.4 test'), 'test.pdf',
    { Authorization: `Bearer ${factoryToken}` }
  );
  assert(factoryUploadRes.status === 403, '工厂上传报告 - 返回 403');

  // Report delete - C-unit cannot delete (only health_agent)
  const cunitDeleteRes = await httpRequest('DELETE', '/api/exam-reports/1', null, {
    Authorization: `Bearer ${cunitToken}`,
  });
  assert(cunitDeleteRes.status === 403, 'C单位删除报告 - 返回 403');

  // Exam task detail - non-existent
  const otherTaskRes = await httpRequest('GET', '/api/exam-tasks/99999', null, {
    Authorization: `Bearer ${factoryToken}`,
  });
  assert(otherTaskRes.status === 404, '工厂查看不存在任务 - 返回 404');
}

// ----- Task Visibility Tests -----

async function testTaskVisibility(factoryToken, agentToken, cunitToken) {
  log('\n=== 任务可见性测试 ===');
  const factoryAuth = { Authorization: `Bearer ${factoryToken}` };
  const agentAuth = { Authorization: `Bearer ${agentToken}` };
  const cunitAuth = { Authorization: `Bearer ${cunitToken}` };

  // Get existing employees
  const empListRes = await httpRequest('GET', '/api/employees?page=1&pageSize=20', null, factoryAuth);
  const existingEmps = empListRes.data?.data?.list || [];
  let empId;
  if (existingEmps.length > 0) {
    empId = existingEmps[0].id;
  } else {
    const empRes = await httpRequest('POST', '/api/employees', {
      name: '可见性测试员工', age: 28, work_years: 3,
      position: '钳工', phone: '13800007777', id_card: '320101199701017777',
    }, factoryAuth);
    empId = empRes.data?.data?.id;
    if (!empId) {
      assert(false, '任务可见性 - 无法创建员工');
      return;
    }
  }

  const agentsRes = await httpRequest('GET', '/api/health-agents/all', null, factoryAuth);
  const agentId = agentsRes.data?.data?.[0]?.id;

  // Get or create contact
  const contactListRes = await httpRequest('GET', '/api/factory-contacts', null, factoryAuth);
  const existingContacts = contactListRes.data?.data || [];
  let contactId;
  if (existingContacts.length > 0) {
    contactId = existingContacts[0].id;
  } else {
    const contactRes = await httpRequest('POST', '/api/factory-contacts', {
      name: '可见性联系人', position: '安全员', phone: '13800008888',
    }, factoryAuth);
    contactId = contactRes.data?.data?.id;
  }

  const pushRes = await httpRequest('POST', '/api/exam-tasks/push', {
    health_agent_id: agentId, factory_contact_id: contactId, employee_ids: [empId],
  }, factoryAuth);
  const taskId = pushRes.data?.data?.id;
  if (!taskId) {
    assert(false, '任务可见性 - 无法推送任务');
    return;
  }

  // Agent can see it in pending
  const pendingRes = await httpRequest('GET', '/api/exam-tasks/pending', null, agentAuth);
  assert(pendingRes.status === 200, '对接人待办 - 返回 200');
  const pendingList = pendingRes.data?.data?.list || [];
  assert(pendingList.some(t => t.id === taskId), '对接人待办 - 包含新推送任务');

  // Fetch and complete
  await httpRequest('POST', `/api/exam-tasks/${taskId}/fetch`, null, agentAuth);
  await httpRequest('POST', `/api/exam-tasks/${taskId}/complete`, null, agentAuth);

  // C-unit can see completed task
  const cunitTasksRes = await httpRequest('GET', '/api/cunit/tasks', null, cunitAuth);
  assert(cunitTasksRes.status === 200, 'C单位查看已完成任务 - 返回 200');
  const cunitTaskList = cunitTasksRes.data?.data?.list || [];
  assert(cunitTaskList.some(t => t.id === taskId), 'C单位任务列表 - 包含已完成任务');
}

// ----- Code Quality Checks -----

async function testCodeQuality() {
  log('\n=== 代码质量检查 ===');

  // Check for TODO/FIXME in server code
  const serverFiles = [];
  function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (['node_modules', 'data', 'uploads', 'tests', 'dist'].includes(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) { walkDir(fullPath); }
      else if (entry.name.endsWith('.js') && !entry.name.endsWith('.test.js')) { serverFiles.push(fullPath); }
    }
  }
  walkDir(SERVER_DIR);

  let todoCount = 0;
  for (const file of serverFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const relPath = path.relative(SERVER_DIR, file);
    const todoMatches = content.match(/\bTODO\b|\bFIXME\b/gi);
    if (todoMatches) {
      todoCount += todoMatches.length;
      log(`  ⚠️  ${relPath} contains ${todoMatches.length} TODO/FIXME`);
    }
  }
  assert(todoCount === 0, '代码质量 - 无 TODO/FIXME 占位符', todoCount > 0 ? `共${todoCount}处` : '');

  // Check parameter mapping between route and repository - verify proper mapping
  const employeeRouteContent = fs.readFileSync(path.join(SERVER_DIR, 'routes', 'employee.js'), 'utf-8');
  const employeeServiceContent = fs.readFileSync(path.join(SERVER_DIR, 'services', 'employeeService.js'), 'utf-8');
  const employeeRepoContent = fs.readFileSync(path.join(SERVER_DIR, 'repositories', 'employeeRepo.js'), 'utf-8');

  // Verify route maps snake_case (from API) to camelCase (for service/repo)
  const routeHasMapping = employeeRouteContent.includes('workYears:') && employeeRouteContent.includes('idCard:');
  const serviceUsesCamelCase = employeeServiceContent.includes('data.idCard');
  const repoUsesCamelCase = employeeRepoContent.includes('workYears') && employeeRepoContent.includes('idCard');
  assert(routeHasMapping && serviceUsesCamelCase && repoUsesCamelCase, '代码质量 - 员工模块参数命名一致性',
    !routeHasMapping ? '路由未映射snake_case→camelCase' : !serviceUsesCamelCase ? '服务层未使用camelCase' : !repoUsesCamelCase ? '仓库层未使用camelCase' : '');

  // Check API path consistency between client and server
  const clientApiDir = path.join(SERVER_DIR, '..', 'client', 'src', 'api');
  let allClientPaths = [];
  try {
    for (const f of fs.readdirSync(clientApiDir)) {
      if (f.endsWith('.js')) {
        const content = fs.readFileSync(path.join(clientApiDir, f), 'utf-8');
        const matches = content.match(/['"`](\/api\/[^'"`]+)['"`]/g) || [];
        allClientPaths.push(...matches.map(m => m.replace(/['"`]/g, '')));
      }
    }
  } catch (e) { /* client dir may not be fully set up */ }

  // Check key endpoint count
  const expectedEndpoints = 26; // From the task description
  const routeFiles = fs.readdirSync(path.join(SERVER_DIR, 'routes')).filter(f => f.endsWith('.js'));
  assert(routeFiles.length === 7, 'API路由文件数量 - 7个模块', `实际${routeFiles.length}个`);

  // Check health-agent route in client
  const clientHealthAgentPath = path.join(clientApiDir, 'healthAgent.js');
  if (!fs.existsSync(clientHealthAgentPath)) {
    log('  ℹ️  健康对接人API客户端文件不存在（功能可能在页面中直接调用）');
  }
}

// ----- Client Build Test -----

async function testClientBuild() {
  log('\n=== 客户端构建检查 ===');
  const clientDir = path.join(SERVER_DIR, '..', 'client');
  const distDir = path.join(clientDir, 'dist');

  // Check if dist exists and has index.html
  const indexExists = fs.existsSync(path.join(distDir, 'index.html'));
  assert(indexExists, '客户端构建 - dist/index.html 存在');

  // Check key client source files exist
  const clientSrcDir = path.join(clientDir, 'src');
  const requiredFiles = [
    'App.jsx', 'main.jsx', 'api/client.js', 'api/auth.js',
    'api/employee.js', 'api/factoryContact.js', 'api/examTask.js',
    'api/examReport.js', 'api/cUnit.js',
  ];
  let allExist = true;
  for (const f of requiredFiles) {
    if (!fs.existsSync(path.join(clientSrcDir, f))) {
      log(`  ⚠️  Missing: ${f}`);
      allExist = false;
    }
  }
  assert(allExist, '客户端源码 - 所有关键API文件存在');
}

// ----- Edge Case Tests -----

async function testEdgeCases(factoryToken, agentToken, cunitToken) {
  log('\n=== 边界/异常测试 ===');
  const factoryAuth = { Authorization: `Bearer ${factoryToken}` };
  const agentAuth = { Authorization: `Bearer ${agentToken}` };

  // Get existing employees for the test
  const empListRes = await httpRequest('GET', '/api/employees?page=1&pageSize=20', null, factoryAuth);
  const existingEmps = empListRes.data?.data?.list || [];
  let empId;
  if (existingEmps.length > 0) {
    empId = existingEmps[0].id;
  } else {
    const empRes = await httpRequest('POST', '/api/employees', {
      name: '边界员工', age: 25, work_years: 2,
      position: '学徒', phone: '13800009999', id_card: '320101200001019999',
    }, factoryAuth);
    empId = empRes.data?.data?.id;
    if (!empId) {
      assert(false, '边界测试 - 无法创建员工');
      return;
    }
  }

  const agentsRes = await httpRequest('GET', '/api/health-agents/all', null, factoryAuth);
  const agentId = agentsRes.data?.data?.[0]?.id;

  // Push and complete a task
  const pushRes = await httpRequest('POST', '/api/exam-tasks/push', {
    health_agent_id: agentId, employee_ids: [empId],
  }, factoryAuth);
  const taskId = pushRes.data?.data?.id;
  if (!taskId) {
    assert(false, '边界测试 - 无法推送任务');
    return;
  }

  // Fetch once
  await httpRequest('POST', `/api/exam-tasks/${taskId}/fetch`, null, agentAuth);

  // Complete task
  const completeRes = await httpRequest('POST', `/api/exam-tasks/${taskId}/complete`, null, agentAuth);
  assert(completeRes.status === 200, '任务完成 - in_progress可完成');

  // Try to complete again - should fail (already completed)
  const completeAgainRes = await httpRequest('POST', `/api/exam-tasks/${taskId}/complete`, null, agentAuth);
  assert(completeAgainRes.status === 400, '重复完成任务 - 返回 400');

  // Try to fetch a completed task - should fail
  const fetchCompletedRes = await httpRequest('POST', `/api/exam-tasks/${taskId}/fetch`, null, agentAuth);
  assert(fetchCompletedRes.status === 400, '拉取已完成任务 - 返回 400');

  // Push task with invalid employee IDs
  const pushInvalidEmpRes = await httpRequest('POST', '/api/exam-tasks/push', {
    health_agent_id: agentId, employee_ids: [99999],
  }, factoryAuth);
  assert(pushInvalidEmpRes.status === 400, '推送无效员工ID任务 - 返回 400');

  // Pagination edge case - page 0
  const page0Res = await httpRequest('GET', '/api/employees?page=0&pageSize=10', null, factoryAuth);
  assert(page0Res.status === 200, '分页page=0 - 返回 200');

  // Very large pageSize
  const largePageRes = await httpRequest('GET', '/api/employees?pageSize=999999', null, factoryAuth);
  assert(largePageRes.status === 200, '超大pageSize - 返回 200');

  // C-unit viewing uncompleted task detail should return 404
  const cunitAuth = { Authorization: `Bearer ${cunitToken}` };
  const uncompletedDetailRes = await httpRequest('GET', '/api/cunit/tasks/99999', null, cunitAuth);
  assert(uncompletedDetailRes.status === 404, 'C单位查看未完成任务详情 - 返回 404');

  // Non-existent report
  const nonExistReportRes = await httpRequest('GET', '/api/exam-reports/99999', null, factoryAuth);
  assert(nonExistReportRes.status === 404, '查看不存在报告 - 返回 404');

  // Upload report for completed task - should fail
  // Create another task, push, fetch, complete, then try upload
  const push2Res = await httpRequest('POST', '/api/exam-tasks/push', {
    health_agent_id: agentId, employee_ids: [empId],
  }, factoryAuth);
  const task2Id = push2Res.data?.data?.id;
  if (task2Id) {
    await httpRequest('POST', `/api/exam-tasks/${task2Id}/fetch`, null, agentAuth);
    await httpRequest('POST', `/api/exam-tasks/${task2Id}/complete`, null, agentAuth);

    const pdfContent = Buffer.from('%PDF-1.4 test');
    const uploadCompletedRes = await multipartRequest(
      '/api/exam-reports/upload',
      { task_id: String(task2Id), employee_id: String(empId) },
      pdfContent, 'completed_report.pdf',
      { Authorization: `Bearer ${agentToken}` }
    );
    assert(uploadCompletedRes.status === 400, '上传到已完成任务 - 返回 400');
  }
}

// ============================================================
// Main Test Runner
// ============================================================

async function runAllTests() {
  console.log('='.repeat(60));
  console.log(`  职业健康体检管理平台 - 集成测试 (Round ${currentRound})`);
  console.log('='.repeat(60));

  // Delete existing DB to start fresh (skip if locked)
  for (const p of [DB_PATH, DB_PATH + '-shm', DB_PATH + '-wal']) {
    try {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch (e) {
      log(`  ⚠️  Cannot delete ${p}: ${e.message}, will re-seed`);
    }
  }

  // Seed the database
  log('正在初始化数据库...');
  try {
    execSync(`"${NODE}" db/seed.js`, { cwd: SERVER_DIR, stdio: 'pipe' });
    assert(true, '数据库种子初始化成功');
  } catch (e) {
    assert(false, '数据库种子初始化失败', e.message);
  }

  // Start the server
  log('正在启动服务端...');
  await startServer();
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Verify server is running
  let serverReady = false;
  for (let i = 0; i < 10; i++) {
    try {
      const check = await fetch(`${BASE_URL}/api/health`);
      if (check.ok) { serverReady = true; break; }
    } catch (e) { /* retry */ }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  assert(serverReady, '服务端启动成功');

  if (!serverReady) {
    log('FATAL: 服务端无法启动，终止测试');
    printReport();
    return;
  }

  // Run test suites
  await testHealthCheck();

  const tokens = await testAuthEndpoints();
  if (!tokens.factoryToken || !tokens.agentToken || !tokens.cunitToken) {
    log('FATAL: 认证失败，无法获取令牌，终止后续测试');
    printReport();
    stopServer();
    return;
  }

  await testEmployeeCRUD(tokens.factoryToken);
  await testFactoryContactCRUD(tokens.factoryToken);
  await testHealthAgentQuery(tokens.factoryToken);

  const taskInfo = await testExamTaskFlow(tokens.factoryToken, tokens.agentToken, tokens.cunitToken);
  await testExamReportUpload(tokens.factoryToken, tokens.agentToken, tokens.cunitToken);

  await testAuthAndRoleGuards(tokens.factoryToken, tokens.agentToken, tokens.cunitToken);
  await testTaskVisibility(tokens.factoryToken, tokens.agentToken, tokens.cunitToken);
  await testEdgeCases(tokens.factoryToken, tokens.agentToken, tokens.cunitToken);

  // Code quality and build checks
  await testCodeQuality();
  await testClientBuild();

  // Cleanup
  stopServer();
  printReport();
}

function printReport() {
  console.log('\n' + '='.repeat(60));
  console.log('  测试报告');
  console.log('='.repeat(60));

  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  const total = testResults.length;

  console.log(`\n  总计: ${total} | 通过: ${passed} | 失败: ${failed}`);
  console.log(`  覆盖率: 约 ${total > 0 ? Math.round((passed / total) * 100) : 0}%\n`);

  if (failed > 0) {
    console.log('  失败测试详情:');
    testResults.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`    ❌ ${r.name} ${r.details ? '— ' + r.details : ''}`);
    });
    console.log();
  }

  // Routing decision
  if (failed === 0) {
    console.log('  路由判定: NoOne (全部通过，无需反馈工程师)');
  } else {
    console.log('  路由判定: Engineer (存在源码Bug，需反馈工程师修复)');
  }

  console.log('\n' + '='.repeat(60));
}

// Run
runAllTests().catch(err => {
  console.error('Test runner error:', err);
  stopServer();
});
