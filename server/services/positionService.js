import {
  findPositionsByFactory, findPositionById, createPosition,
  updatePosition, deletePosition, findHazardsByPosition,
  bindHazardsToPosition, unbindHazard,
} from '../repositories/positionRepo.js';

/** Build tree structure from flat position list */
export function buildPositionTree(flatList) {
  const map = {};
  const roots = [];

  for (const node of flatList) {
    map[node.id] = { ...node, children: [] };
  }
  for (const node of flatList) {
    if (node.parent_id && map[node.parent_id]) {
      map[node.parent_id].children.push(map[node.id]);
    } else {
      roots.push(map[node.id]);
    }
  }
  return roots;
}

/** Get position tree for a factory */
export function getPositionTree(factoryId) {
  const flatList = findPositionsByFactory(factoryId);
  return buildPositionTree(flatList);
}

/** Create position node */
export function addPosition(factoryId, { parentId, name, level }) {
  if (!name) throw new Error('岗位名称不能为空');
  if (!level || !['workshop', 'section', 'position'].includes(level)) {
    throw new Error('无效的层级类型');
  }
  // Validate parent exists and belongs to same factory
  if (parentId) {
    const parent = findPositionById(parentId);
    if (!parent || parent.factory_id !== factoryId) {
      throw new Error('父节点不存在');
    }
  }
  return createPosition({ factoryId, parentId: parentId || null, name, level });
}

/** Edit position node */
export function editPosition(id, factoryId, data) {
  const pos = findPositionById(id);
  if (!pos || pos.factory_id !== factoryId) {
    throw new Error('岗位不存在');
  }
  return updatePosition(id, {
    name: data.name !== undefined ? data.name : pos.name,
    parentId: data.parent_id,
    orderIndex: data.order_index,
  });
}

/** Remove position node and children */
export function removePosition(id, factoryId) {
  const pos = findPositionById(id);
  if (!pos || pos.factory_id !== factoryId) {
    throw new Error('岗位不存在');
  }
  return deletePosition(id);
}

/** Get hazards bound to position */
export function getPositionHazards(positionId, factoryId) {
  const pos = findPositionById(positionId);
  if (!pos || pos.factory_id !== factoryId) {
    throw new Error('岗位不存在');
  }
  return findHazardsByPosition(positionId);
}

/** Bind hazards to position */
export function bindPositionHazards(positionId, factoryId, hazardFactorIds) {
  const pos = findPositionById(positionId);
  if (!pos || pos.factory_id !== factoryId) {
    throw new Error('岗位不存在');
  }
  if (pos.level !== 'position') {
    throw new Error('仅岗位级别节点可以绑定危害因素');
  }
  return bindHazardsToPosition(positionId, hazardFactorIds);
}

/** Unbind hazard from position */
export function unbindPositionHazard(positionId, hazardFactorId, factoryId) {
  const pos = findPositionById(positionId);
  if (!pos || pos.factory_id !== factoryId) {
    throw new Error('岗位不存在');
  }
  return unbindHazard(positionId, hazardFactorId);
}
