import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Simple TaskCard component for testing
const TaskCard = ({
  task,
  onComplete,
  onDelete
}: {
  task: { id: string; title: string; status: string };
  onComplete?: () => void;
  onDelete?: () => void;
}) => {
  return (
    <div data-testid="task-card">
      <h3>{task.title}</h3>
      <span>{task.status}</span>
      <button onClick={onComplete} data-testid="complete-btn">Complete</button>
      <button onClick={onDelete} data-testid="delete-btn">Delete</button>
    </div>
  );
};

describe('TaskCard', () => {
  const mockTask = {
    id: 'task-1',
    title: 'Test Task',
    status: 'pending'
  };

  it('renders task information', () => {
    render(<TaskCard task={mockTask} />);

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('calls onComplete when complete button clicked', () => {
    const onComplete = vi.fn();
    render(<TaskCard task={mockTask} onComplete={onComplete} />);

    fireEvent.click(screen.getByTestId('complete-btn'));
    expect(onComplete).toHaveBeenCalled();
  });

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    render(<TaskCard task={mockTask} onDelete={onDelete} />);

    fireEvent.click(screen.getByTestId('delete-btn'));
    expect(onDelete).toHaveBeenCalled();
  });

  it('renders completed task correctly', () => {
    const completedTask = {
      ...mockTask,
      status: 'completed'
    };
    render(<TaskCard task={completedTask} />);

    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  it('handles missing callbacks gracefully', () => {
    // Should not throw when buttons clicked without handlers
    render(<TaskCard task={mockTask} />);

    expect(() => {
      fireEvent.click(screen.getByTestId('complete-btn'));
      fireEvent.click(screen.getByTestId('delete-btn'));
    }).not.toThrow();
  });
});
