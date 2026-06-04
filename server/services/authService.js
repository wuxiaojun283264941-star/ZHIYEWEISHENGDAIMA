import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findFactoryByUsername } from '../repositories/factoryRepo.js';
import { findHealthAgentByUsername } from '../repositories/healthAgentRepo.js';
import { findCUnitAgentByUsername } from '../repositories/cUnitAgentRepo.js';
import { findAdminByUsername } from '../repositories/adminRepo.js';

const JWT_SECRET = process.env.JWT_SECRET || 'occupational_health_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/** Generate JWT token */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/** Admin login with username/password */
export function adminLogin(username, password) {
  const admin = findAdminByUsername(username);
  if (!admin) {
    throw new Error('用户名或密码错误');
  }
  const valid = bcrypt.compareSync(password, admin.password_hash);
  if (!valid) {
    throw new Error('用户名或密码错误');
  }
  const token = generateToken({ id: admin.id, role: 'admin', name: admin.name });
  return {
    token,
    user: { id: admin.id, role: 'admin', name: admin.name, username: admin.username }
  };
}

/** Factory login with username/password */
export function factoryLogin(username, password) {
  const factory = findFactoryByUsername(username);
  if (!factory) {
    throw new Error('用户名或密码错误');
  }
  const valid = bcrypt.compareSync(password, factory.password_hash);
  if (!valid) {
    throw new Error('用户名或密码错误');
  }
  const token = generateToken({ id: factory.id, role: 'factory', name: factory.name });
  return {
    token,
    user: { id: factory.id, role: 'factory', name: factory.name, username: factory.username, industry_type: factory.industry_type }
  };
}

/** Health agent login with username/password */
export function healthAgentLogin(username, password) {
  const agent = findHealthAgentByUsername(username);
  if (!agent) {
    throw new Error('用户名或密码错误');
  }
  const valid = bcrypt.compareSync(password, agent.password_hash);
  if (!valid) {
    throw new Error('用户名或密码错误');
  }
  const token = generateToken({ id: agent.id, role: 'health_agent', name: agent.name });
  return {
    token,
    user: { id: agent.id, role: 'health_agent', name: agent.name, phone: agent.phone, center_name: agent.center_name }
  };
}

/** C-unit (卫生托管) login with username/password */
export function cunitLogin(username, password) {
  const agent = findCUnitAgentByUsername(username);
  if (!agent) {
    throw new Error('用户名或密码错误');
  }
  const valid = bcrypt.compareSync(password, agent.password_hash);
  if (!valid) {
    throw new Error('用户名或密码错误');
  }
  const token = generateToken({ id: agent.id, role: 'cunit', name: agent.name });
  return {
    token,
    user: { id: agent.id, role: 'cunit', name: agent.name, username: agent.username }
  };
}

/** Verify token and return decoded payload */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}
