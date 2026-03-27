import { describe, it, expect, vi, beforeEach } from 'vitest';

// Simple task store for testing
interface Task {
  id: string;
  title: string;
  status?: string;
}

interface TaskStore {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  addTask: (task: Task) => void;
  removeTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const createTaskStore = (): TaskStore => {
  const store: TaskStore = {
    tasks: [],
    loading: false,
    error: null,
    addTask(task: Task) {
      this.tasks.push(task);
    },
    removeTask(id: string) {
      this.tasks = this.tasks.filter(t => t.id !== id);
    },
    updateTask(id: string, updates: Partial<Task>) {
      const task = this.tasks.find(t => t.id === id);
      if (task) {
        Object.assign(task, updates);
      }
    },
    setLoading(loading: boolean) {
      this.loading = loading;
    },
    setError(error: string | null) {
      this.error = error;
    },
  };
  return store;
};

describe('taskStore', () => {
  let store: TaskStore;

  beforeEach(() => {
    store = createTaskStore();
    vi.clearAllMocks();
  });

  it('should add task', () => {
    const newTask = { id: '1', title: 'New Task' };

    store.addTask(newTask);

    expect(store.tasks).toContainEqual(newTask);
  });

  it('should remove task', () => {
    store.tasks = [
      { id: '1', title: 'Task 1' },
      { id: '2', title: 'Task 2' },
    ];

    store.removeTask('1');

    expect(store.tasks).toHaveLength(1);
    expect(store.tasks[0].id).toBe('2');
  });

  it('should update task', () => {
    store.tasks = [{ id: '1', title: 'Old Title', status: 'pending' }];

    store.updateTask('1', { title: 'New Title' });

    expect(store.tasks[0].title).toBe('New Title');
    expect(store.tasks[0].status).toBe('pending');
  });

  it('should set loading state', () => {
    store.setLoading(true);
    expect(store.loading).toBe(true);

    store.setLoading(false);
    expect(store.loading).toBe(false);
  });

  it('should set error', () => {
    const error = 'Network error';
    store.setError(error);
    expect(store.error).toBe(error);

    store.setError(null);
    expect(store.error).toBeNull();
  });

  it('should handle multiple tasks', () => {
    store.addTask({ id: '1', title: 'Task 1' });
    store.addTask({ id: '2', title: 'Task 2' });
    store.addTask({ id: '3', title: 'Task 3' });

    expect(store.tasks).toHaveLength(3);

    store.removeTask('2');

    expect(store.tasks).toHaveLength(2);
    expect(store.tasks.map(t => t.id)).toEqual(['1', '3']);
  });
});
