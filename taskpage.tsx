import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, CheckCircle, Circle, RefreshCw, Trash2, Calendar, 
  ChevronDown, Edit3, X, Save, AlertCircle, Clock, 
  LayoutGrid, List, Search, Tag, CheckSquare, ListTodo, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { taskApi, type Task } from './api';

const CATEGORIES = ["General", "Work", "Personal", "Urgent", "Shopping", "Health"];

export default function TaskPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('General');

  // Sort & Filter state
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  
  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Task>>({});

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskApi.getTasks(sortBy, order);
      setTasks(response.data);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [sortBy, order]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      const response = await taskApi.createTask({ 
        title, 
        description, 
        priority, 
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        category 
      });
      setTasks([response.data, ...tasks]);
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setDueDate('');
      setCategory('General');
      toast.success('Task created successfully');
    } catch (error) {
      console.error("Failed to create task", error);
      toast.error('Failed to create task');
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const response = await taskApi.updateTask(task.id, {
        completed: !task.completed
      });
      setTasks(tasks.map(t => t.id === task.id ? response.data : t));
      toast.success(task.completed ? 'Task marked incomplete' : 'Task completed! 🎉');
    } catch (error) {
      console.error("Failed to update task", error);
      toast.error('Failed to update task status');
    }
  };

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      category: task.category || 'General'
    });
  };

  const handleUpdateTask = async (id: number) => {
    try {
      const payload: any = { ...editData };
      if (editData.due_date) {
        payload.due_date = new Date(editData.due_date).toISOString();
      } else {
        payload.due_date = null;
      }
      
      const response = await taskApi.updateTask(id, payload);
      setTasks(tasks.map(t => t.id === id ? response.data : t));
      setEditingId(null);
      toast.success('Task updated successfully');
    } catch (error) {
      console.error("Failed to update task", error);
      toast.error('Failed to update task');
    }
  };

  const handleDelete = async (taskId: number) => {
    try {
      await taskApi.deleteTask(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
      toast.success('Task deleted');
    } catch (error) {
      console.error("Failed to delete task", error);
      toast.error('Failed to delete task');
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, { 
      month: 'short', day: 'numeric', year: 'numeric' 
    });
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'High': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'Medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'Low': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default: return 'text-textSecondary';
    }
  };

  const getCategoryColor = (cat: string) => {
    const hash = cat.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      'text-blue-400 bg-blue-400/10 border-blue-400/20',
      'text-purple-400 bg-purple-400/10 border-purple-400/20',
      'text-green-400 bg-green-400/10 border-green-400/20',
      'text-orange-400 bg-orange-400/10 border-orange-400/20',
      'text-pink-400 bg-pink-400/10 border-pink-400/20',
      'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
    ];
    return colors[hash % colors.length];
  };

  // Derived state
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = (t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (t.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()));
      const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [tasks, searchQuery, filterCategory]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const highPriority = tasks.filter(t => !t.completed && t.priority === 'High').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, highPriority, rate };
  }, [tasks]);

  const renderTaskCard = (task: Task) => (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      key={task.id} 
      className="glass-panel overflow-hidden border border-white/5 hover:border-white/20 transition-all group shadow-md hover:shadow-lg"
    >
      {editingId === task.id ? (
        /* Edit Mode */
        <div className="p-4 space-y-4 bg-white/2">
          <input 
            className="w-full bg-surface border border-primary/50 rounded p-2 text-white"
            value={editData.title || ''}
            onChange={e => setEditData({...editData, title: e.target.value})}
          />
          <textarea 
            className="w-full bg-surface border border-white/10 rounded p-2 text-white text-sm"
            value={editData.description || ''}
            onChange={e => setEditData({...editData, description: e.target.value})}
          />
          <div className="grid grid-cols-3 gap-4">
            <select 
              className="bg-surface border border-white/10 rounded p-2 text-white text-sm"
              value={editData.priority || 'Medium'}
              onChange={e => setEditData({...editData, priority: e.target.value as any})}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <select 
              className="bg-surface border border-white/10 rounded p-2 text-white text-sm"
              value={editData.category || 'General'}
              onChange={e => setEditData({...editData, category: e.target.value})}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input 
              type="date"
              className="bg-surface border border-white/10 rounded p-2 text-white text-sm"
              value={(editData.due_date as string) || ''}
              onChange={e => setEditData({...editData, due_date: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditingId(null)} className="px-4 py-2 rounded text-textSecondary hover:text-white transition-colors flex items-center gap-1">
              <X size={16} /> Cancel
            </button>
            <button onClick={() => handleUpdateTask(task.id)} className="px-4 py-2 bg-primary rounded text-white font-semibold transition-colors flex items-center gap-1 hover:bg-primary/80">
              <Save size={16} /> Save Changes
            </button>
          </div>
        </div>
      ) : (
        /* View Mode */
        <div className="p-5 flex gap-4 items-start bg-gradient-to-r from-transparent to-white/[0.02]">
          <button 
            onClick={() => handleToggleComplete(task)} 
            className={`mt-1 transition-all hover:scale-110 active:scale-95 ${task.completed ? 'text-secondary' : 'text-textSecondary hover:text-white'}`}
          >
            {task.completed ? <CheckCircle size={26} /> : <Circle size={26} />}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className={`text-lg font-bold truncate ${task.completed ? 'text-textSecondary line-through' : 'text-white'}`}>
                {task.title}
              </h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border flex items-center gap-1 ${getCategoryColor(task.category || 'General')}`}>
                <Tag size={10} />
                {task.category || 'General'}
              </span>
            </div>
            
            {task.description && (
              <p className="text-textSecondary text-sm line-clamp-2 mb-3 leading-relaxed">{task.description}</p>
            )}
            
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1 text-textSecondary opacity-60">
                <Clock size={12} />
                <span>Created {formatDate(task.created_at)}</span>
              </div>
              {task.due_date && (
                <div className={`flex items-center gap-1 ${new Date(task.due_date) < new Date() && !task.completed ? 'text-red-400' : 'text-secondary'}`}>
                  <Calendar size={12} />
                  <span>Due {formatDate(task.due_date)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => startEditing(task)}
              className="p-2 text-textSecondary hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Edit Task"
            >
              <Edit3 size={18} />
            </button>
            <button 
              onClick={() => handleDelete(task.id)}
              className="p-2 text-textSecondary hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              title="Delete Task"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header & View Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold gradient-text tracking-tight">Task Dashboard</h1>
          <p className="text-textSecondary text-sm mt-1">Manage your workflow and priorities</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-surface border border-white/10 rounded-lg p-1 flex">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow-sm' : 'text-textSecondary hover:text-white'}`}
            >
              <List size={16} /> <span className="text-sm font-medium hidden sm:inline">List</span>
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded flex items-center gap-2 transition-all ${viewMode === 'kanban' ? 'bg-white/10 text-white shadow-sm' : 'text-textSecondary hover:text-white'}`}
            >
              <LayoutGrid size={16} /> <span className="text-sm font-medium hidden sm:inline">Kanban</span>
            </button>
          </div>
          <button 
            onClick={fetchTasks}
            className="p-2 ml-2 rounded-full hover:bg-white/5 transition-colors text-textSecondary hover:text-white"
            title="Refresh Tasks"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
            <ListTodo size={24} />
          </div>
          <div>
            <p className="text-textSecondary text-xs font-semibold uppercase tracking-wider">Total Tasks</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
        </div>
        <div className="glass-panel p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
            <CheckSquare size={24} />
          </div>
          <div>
            <p className="text-textSecondary text-xs font-semibold uppercase tracking-wider">Completed</p>
            <p className="text-2xl font-bold text-white">{stats.completed}</p>
          </div>
        </div>
        <div className="glass-panel p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-textSecondary text-xs font-semibold uppercase tracking-wider">High Priority</p>
            <p className="text-2xl font-bold text-white">{stats.highPriority}</p>
          </div>
        </div>
        <div className="glass-panel p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-textSecondary text-xs font-semibold uppercase tracking-wider">Completion</p>
            <p className="text-2xl font-bold text-white">{stats.rate}%</p>
          </div>
        </div>
      </div>

      {/* New Task Form */}
      <form onSubmit={handleCreateTask} className="glass-panel p-6 space-y-4 shadow-xl border-t border-t-white/10">
        <div className="flex items-center gap-2 mb-2">
          <Plus size={18} className="text-primary" />
          <h2 className="text-lg font-semibold text-white">Quick Add Task</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-3 col-span-1 md:col-span-4">
            <input
              type="text"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-surface/50 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-primary text-white transition-all shadow-inner"
            />
          </div>
          <textarea
            placeholder="Additional details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-surface/50 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary text-white transition-colors min-h-[100px] col-span-1 md:col-span-4"
          />
          <div className="flex flex-col gap-1 col-span-1 md:col-span-1">
            <label className="text-xs text-textSecondary font-medium px-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="bg-surface/50 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary text-white"
            >
              <option value="Low" className="bg-background">Low</option>
              <option value="Medium" className="bg-background">Medium</option>
              <option value="High" className="bg-background">High</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 col-span-1 md:col-span-1">
            <label className="text-xs text-textSecondary font-medium px-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-surface/50 border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary text-white"
            >
              {CATEGORIES.map(c => <option key={c} value={c} className="bg-background">{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 col-span-1 md:col-span-1">
            <label className="text-xs text-textSecondary font-medium px-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-surface/50 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary text-white h-[42px]"
            />
          </div>
          <div className="flex flex-col gap-1 col-span-1 md:col-span-1 justify-end">
            <button
              type="submit"
              className="bg-primary hover:bg-primary/80 transition-all py-2.5 rounded-lg font-bold text-white flex items-center justify-center gap-2 shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 h-[42px]"
            >
              <Plus size={18} /> Add Task
            </button>
          </div>
        </div>
      </form>

      {/* Toolbar: Search, Filter, Sort */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-surface/30 p-2 rounded-xl border border-white/5">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" size={18} />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-white/10 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-primary text-white text-sm"
          />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto items-center">
          <div className="flex items-center gap-2 text-sm text-textSecondary border-r border-white/10 pr-4">
            <Tag size={16} />
            <select 
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="bg-transparent focus:outline-none text-white cursor-pointer"
            >
              <option value="All" className="bg-background">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c} className="bg-background">{c}</option>)}
            </select>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-textSecondary">
            <span>Sort:</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="created_at" className="bg-background">Date Created</option>
              <option value="due_date" className="bg-background">Due Date</option>
              <option value="priority" className="bg-background">Priority</option>
              <option value="title" className="bg-background">Title</option>
            </select>
            <button 
              onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
              className="p-1 hover:text-white transition-colors bg-white/5 rounded"
            >
              <ChevronDown size={16} className={order === 'asc' ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>
          </div>
        </div>
      </div>

      {/* Task Views */}
      {filteredTasks.length === 0 && !loading ? (
        <div className="text-center p-16 text-textSecondary glass-panel bg-white/2 border border-dashed border-white/10">
          <div className="mx-auto w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <CheckCircle size={40} className="opacity-20" />
          </div>
          <p className="text-xl font-medium text-white mb-2">No tasks found</p>
          <p className="text-sm opacity-60">You don't have any tasks matching your filters.</p>
        </div>
      ) : (
        viewMode === 'list' ? (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {filteredTasks.map(renderTaskCard)}
            </AnimatePresence>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Kanban Columns */}
            <div className="space-y-4 bg-surface/20 p-4 rounded-xl border border-white/5 min-h-[400px]">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Circle size={16} className="text-yellow-400" /> Pending
                </h3>
                <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded-full text-textSecondary">
                  {filteredTasks.filter(t => !t.completed).length}
                </span>
              </div>
              <AnimatePresence mode="popLayout">
                {filteredTasks.filter(t => !t.completed).map(renderTaskCard)}
              </AnimatePresence>
            </div>
            
            <div className="space-y-4 bg-surface/20 p-4 rounded-xl border border-white/5 min-h-[400px]">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <CheckCircle size={16} className="text-secondary" /> Completed
                </h3>
                <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded-full text-textSecondary">
                  {filteredTasks.filter(t => t.completed).length}
                </span>
              </div>
              <AnimatePresence mode="popLayout">
                {filteredTasks.filter(t => t.completed).map(renderTaskCard)}
              </AnimatePresence>
            </div>
          </div>
        )
      )}
    </div>
  );
}
