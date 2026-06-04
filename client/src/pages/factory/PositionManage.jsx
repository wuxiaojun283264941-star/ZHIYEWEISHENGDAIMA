import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, IconButton, Paper,
  List, ListItem, ListItemText, ListItemIcon, Collapse, Chip, Alert, Tooltip,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  ExpandLess, ExpandMore, Business as BusinessIcon,
  AccountTree as SectionIcon, AssignmentInd as PositionIcon,
  Science as HazardIcon,
} from '@mui/icons-material';
import Layout from '../../components/Layout';
import {
  getPositionTree, createPosition, updatePosition, deletePosition,
  getPositionHazards, bindPositionHazards, unbindPositionHazard,
} from '../../api/position';
import { getHazardFactors } from '../../api/hazardFactor';

function PositionManage() {
  const [tree, setTree] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [parentId, setParentId] = useState(null);
  const [form, setForm] = useState({ name: '', level: 'position' });

  // Bind hazards dialog
  const [hazardDialogOpen, setHazardDialogOpen] = useState(false);
  const [hazardPosition, setHazardPosition] = useState(null);
  const [boundHazards, setBoundHazards] = useState([]);
  const [allHazards, setAllHazards] = useState([]);
  const [selectedHazards, setSelectedHazards] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPositionTree();
      setTree(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const openCreate = (pId = null, suggestedLevel = 'position') => {
    setEditing(null);
    setParentId(pId);
    setForm({ name: '', level: suggestedLevel });
    setDialogOpen(true);
  };

  const openEdit = (node) => {
    setEditing(node);
    setParentId(node.parent_id);
    setForm({ name: node.name, level: node.level });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await updatePosition(editing.id, { name: form.name, parent_id: parentId });
      } else {
        await createPosition({ parent_id: parentId, name: form.name, level: form.level });
      }
      setDialogOpen(false);
      setSuccess(editing ? '更新成功' : '创建成功');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除该节点吗？子节点将一并删除。')) return;
    try {
      await deletePosition(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const openHazardDialog = async (node) => {
    setHazardPosition(node);
    try {
      const [hazardsRes, allRes] = await Promise.all([
        getPositionHazards(node.id),
        getHazardFactors(),
      ]);
      setBoundHazards(hazardsRes.data);
      setAllHazards(allRes.data);
      setSelectedHazards(hazardsRes.data.map(h => h.id));
    } catch (err) {
      setError(err.message);
    }
    setHazardDialogOpen(true);
  };

  const handleBindHazards = async () => {
    try {
      await bindPositionHazards(hazardPosition.id, selectedHazards);
      setHazardDialogOpen(false);
      setSuccess('危害因素绑定成功');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const levelIcon = (level) => {
    if (level === 'workshop') return <BusinessIcon color="primary" />;
    if (level === 'section') return <SectionIcon color="info" />;
    return <PositionIcon color="action" />;
  };

  const levelLabel = (level) => (
    <Chip label={level === 'workshop' ? '车间' : level === 'section' ? '工段' : '岗位'} size="small"
      sx={{ fontSize: '0.7rem', ml: 1 }} />
  );

  const renderNode = (nodes, depth = 0) => nodes.map((node) => (
    <Box key={node.id}>
      <Paper
        sx={{ mb: 0.5, ml: depth * 2, p: 1, display: 'flex', alignItems: 'center', gap: 1,
          bgcolor: depth === 0 ? '#e3f2fd' : depth === 1 ? '#f5f5f5' : 'white' }}
      >
        {(node.children && node.children.length > 0) ? (
          <IconButton size="small" onClick={() => toggleExpand(node.id)}>
            {expanded[node.id] ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        ) : <Box sx={{ width: 32 }} />}
        {levelIcon(node.level)}
        <Typography sx={{ flex: 1, fontWeight: 500 }}>{node.name}</Typography>
        {levelLabel(node.level)}
        <Typography variant="caption" color="text.secondary">{node.child_count || 0} 子节点</Typography>
        {node.level === 'position' && (
          <Button size="small" startIcon={<HazardIcon />} onClick={() => openHazardDialog(node)}>
            危害因素
          </Button>
        )}
        <IconButton size="small" onClick={() => openEdit(node)}><EditIcon fontSize="small" /></IconButton>
        <Tooltip title="添加子节点">
          <IconButton size="small" onClick={() => openCreate(node.id, node.level === 'workshop' ? 'section' : 'position')}>
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <IconButton size="small" onClick={() => handleDelete(node.id)}><DeleteIcon fontSize="small" color="error" /></IconButton>
      </Paper>
      {node.children && node.children.length > 0 && (
        <Collapse in={expanded[node.id] !== false}>
          {renderNode(node.children, depth + 1)}
        </Collapse>
      )}
    </Box>
  ));

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>岗位管理</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openCreate(null, 'workshop')}>
          新建车间
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {tree.length === 0 && !loading ? (
        <Paper sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          暂无岗位数据，点击"新建车间"开始构建岗位树
        </Paper>
      ) : (
        renderNode(tree)
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? '编辑节点' : '添加节点'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="名称" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {!editing && (
              <FormControl>
                <InputLabel>层级</InputLabel>
                <Select value={form.level} label="层级" onChange={(e) => setForm({ ...form, level: e.target.value })}>
                  <MenuItem value="workshop">车间</MenuItem>
                  <MenuItem value="section">工段</MenuItem>
                  <MenuItem value="position">岗位</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>取消</Button>
          <Button variant="contained" onClick={handleSave}>{editing ? '保存' : '创建'}</Button>
        </DialogActions>
      </Dialog>

      {/* Hazard Binding Dialog */}
      <Dialog open={hazardDialogOpen} onClose={() => setHazardDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>绑定危害因素 — {hazardPosition?.name}</DialogTitle>
        <DialogContent>
          {boundHazards.length > 0 && (
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {boundHazards.map((h) => (
                <Chip key={h.id} label={`${h.name}`} size="small"
                  onDelete={async () => {
                    await unbindPositionHazard(hazardPosition.id, h.id);
                    setBoundHazards((prev) => prev.filter((x) => x.id !== h.id));
                    setSelectedHazards((prev) => prev.filter((x) => x !== h.id));
                  }} />
              ))}
            </Box>
          )}
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {allHazards.map((h) => (
              <Box key={h.id} sx={{ display: 'flex', alignItems: 'center', py: 0.5, borderBottom: '1px solid #eee' }}>
                <input type="checkbox" checked={selectedHazards.includes(h.id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedHazards([...selectedHazards, h.id]);
                    else setSelectedHazards(selectedHazards.filter((x) => x !== h.id));
                  }} />
                <Chip label={h.category} size="small" sx={{ mx: 1 }} />
                <Typography variant="body2">{h.code}</Typography>
                <Typography variant="body2" sx={{ ml: 1, fontWeight: 500 }}>{h.name}</Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHazardDialogOpen(false)}>取消</Button>
          <Button variant="contained" onClick={handleBindHazards}>保存绑定</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}

export default PositionManage;
