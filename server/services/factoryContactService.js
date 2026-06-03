import { findContactsByFactory, findContactById, createContact, updateContact, deleteContact } from '../repositories/factoryContactRepo.js';

/** Get all contacts for a factory */
export function getContacts(factoryId) {
  return findContactsByFactory(factoryId);
}

/** Create contact */
export function addContact(factoryId, data) {
  if (!data.name || !data.phone) {
    throw new Error('姓名和手机号不能为空');
  }
  return createContact(factoryId, data);
}

/** Update contact */
export function editContact(id, factoryId, data) {
  if (!data.name || !data.phone) {
    throw new Error('姓名和手机号不能为空');
  }
  const existing = findContactById(id);
  if (!existing || existing.factory_id !== factoryId) {
    throw new Error('联系人不存在');
  }
  return updateContact(id, factoryId, data);
}

/** Remove contact */
export function removeContact(id, factoryId) {
  const deleted = deleteContact(id, factoryId);
  if (!deleted) {
    throw new Error('联系人不存在或无权删除');
  }
  return true;
}
