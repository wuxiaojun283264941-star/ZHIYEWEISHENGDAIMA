import {
  findHazardFactors, findHazardFactorById, findHazardFactorByCode,
  createHazardFactor, updateHazardFactor, deleteHazardFactor,
  getHazardCategories,
} from '../repositories/hazardFactorRepo.js';

/** Get all hazard factors with filters */
export function getHazardFactors({ category, keyword }) {
  return findHazardFactors({ category, keyword });
}

/** Get single hazard factor */
export function getHazardFactor(id) {
  const hf = findHazardFactorById(id);
  if (!hf) throw new Error('危害因素不存在');
  return hf;
}

/** Add hazard factor */
export function addHazardFactor({ code, category, name, description, examFrequency }) {
  if (!code || !category || !name) {
    throw new Error('编码、分类和名称不能为空');
  }
  const existing = findHazardFactorByCode(code);
  if (existing) throw new Error('编码已存在');
  return createHazardFactor({ code, category, name, description, examFrequency });
}

/** Edit hazard factor */
export function editHazardFactor(id, data) {
  const hf = findHazardFactorById(id);
  if (!hf) throw new Error('危害因素不存在');

  if (data.code && data.code !== hf.code) {
    const dup = findHazardFactorByCode(data.code);
    if (dup) throw new Error('编码已存在');
  }
  return updateHazardFactor(id, {
    code: data.code || hf.code,
    category: data.category || hf.category,
    name: data.name || hf.name,
    description: data.description !== undefined ? data.description : hf.description,
    examFrequency: data.exam_frequency !== undefined ? data.exam_frequency : hf.exam_frequency,
  });
}

/** Remove hazard factor */
export function removeHazardFactor(id) {
  const deleted = deleteHazardFactor(id);
  if (!deleted) throw new Error('危害因素不存在');
  return true;
}

/** Get categories */
export function getCategories() {
  return getHazardCategories();
}
