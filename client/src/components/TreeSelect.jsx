import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

/**
 * Tree select component — renders a flat tree as nested <optgroup> in a Select.
 * treeData: array of nodes with children[], each node has: { id, name, level, children }
 */
function TreeSelect({ label = '岗位', value, onChange, treeData = [], fullWidth = true, size = 'small' }) {
  const renderOptions = (nodes, depth = 0) => {
    const result = [];
    for (const node of nodes) {
      const prefix = depth > 0 ? '  '.repeat(depth) + '├ ' : '';
      result.push(
        <MenuItem key={node.id} value={node.id}>
          {prefix}{node.name}
          {node.level && <span style={{ color: '#999', fontSize: '0.75rem', marginLeft: 8 }}>({node.level === 'workshop' ? '车间' : node.level === 'section' ? '工段' : '岗位'})</span>}
        </MenuItem>
      );
      if (node.children && node.children.length > 0) {
        result.push(...renderOptions(node.children, depth + 1));
      }
    }
    return result;
  };

  return (
    <FormControl fullWidth={fullWidth} size={size}>
      <InputLabel>{label}</InputLabel>
      <Select value={value || ''} label={label} onChange={(e) => onChange(e.target.value)}>
        <MenuItem value=""><em>无</em></MenuItem>
        {renderOptions(treeData)}
      </Select>
    </FormControl>
  );
}

export default TreeSelect;
