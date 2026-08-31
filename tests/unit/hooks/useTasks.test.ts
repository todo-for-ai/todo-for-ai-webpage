import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useState, useCallback } from 'react';

// Simple useTasks hook mock for testing
const useTasks = () => {
  const [tasks, setTasks] = useState<{ id: string; title: string; status: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Mock API call
      const response = await fetch('/api/tasks');
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const addTask = useCallback((task: { title: string }) => {
    const newTask = {
      id: String(Date.now()),
      title: task.title,
      status: 'pending'
    };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<{ title: string; status: string }>) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, ...updates } : task
      )
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  }, []);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask
  };
};

describe('useTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty tasks', () => {
    const { result } = renderHook(() => useTasks());

    expect(result.current.tasks).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should add a task', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask({ title: 'New Task' });
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].title).toBe('New Task');
    expect(result.current.tasks[0].status).toBe('pending');
  });

  it('should update a task', () => {
    const { result } = renderHook(() => useTasks());

    // Add a task first
    act(() => {
      result.current.addTask({ title: 'Task to Update' });
    });

    const taskId = result.current.tasks[0].id;

    // Update the task
    act(() => {
      result.current.updateTask(taskId, { status: 'completed' });
    });

    expect(result.current.tasks[0].status).toBe('completed');
  });

  it('should delete a task', () => {
    const { result } = renderHook(() => useTasks());

    // Add tasks sequentially to ensure unique IDs
    act(() => {
      result.current.addTask({ title: 'Task 1' });
    });

    act(() => {
      result.current.addTask({ title: 'Task 2' });
    });

    expect(result.current.tasks).toHaveLength(2);

    const taskId = result.current.tasks[0].id;

    // Delete first task
    act(() => {
      result.current.deleteTask(taskId);
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].title).toBe('Task 2');
  });

  it('should handle multiple tasks', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask({ title: 'Task 1' });
      result.current.addTask({ title: 'Task 2' });
      result.current.addTask({ title: 'Task 3' });
    });

    expect(result.current.tasks).toHaveLength(3);
  });

  it('should not update non-existent task', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask({ title: 'Existing Task' });
    });

    // Try to update non-existent task
    act(() => {
      result.current.updateTask('non-existent', { title: 'New Title' });
    });

    // Original task should remain unchanged
    expect(result.current.tasks[0].title).toBe('Existing Task');
  });

  it('should handle task with all properties', () => {
    const { result } = renderHook(() => useTasks());

    act(() => {
      result.current.addTask({ title: 'Complete Task' });
    });

    const task = result.current.tasks[0];
    expect(task).toHaveProperty('id');
    expect(task).toHaveProperty('title');
    expect(task).toHaveProperty('status');
    expect(typeof task.id).toBe('string');
  });
});
