import {
  findPackagesByAgent, findPackageById, createPackage,
  updatePackage, deletePackage,
} from '../repositories/examPackageRepo.js';

/** Get packages for agent */
export function getPackages(agentId) {
  return findPackagesByAgent(agentId);
}

/** Add package */
export function addPackage(agentId, { name, description, price, examItems }) {
  if (!name) throw new Error('套餐名称不能为空');
  return createPackage({ healthAgentId: agentId, name, description, price, examItems });
}

/** Edit package */
export function editPackage(id, agentId, data) {
  const pkg = findPackageById(id);
  if (!pkg || pkg.health_agent_id !== agentId) {
    throw new Error('套餐不存在');
  }
  return updatePackage(id, {
    name: data.name !== undefined ? data.name : pkg.name,
    description: data.description !== undefined ? data.description : pkg.description,
    price: data.price !== undefined ? data.price : pkg.price,
    examItems: data.exam_items !== undefined ? data.exam_items : pkg.exam_items,
    isActive: data.is_active !== undefined ? data.is_active : pkg.is_active,
  });
}

/** Remove package */
export function removePackage(id, agentId) {
  const deleted = deletePackage(id, agentId);
  if (!deleted) throw new Error('套餐不存在');
  return true;
}
