import React, { useState, useEffect } from 'react';
import { useIdeaStore } from '../../stores/ideaStore';
import { useTaskStore } from '../../stores/taskStore';
import { useProjectStore } from '../../stores/projectStore';
import { useToast } from '../../hooks/useToast';
import { Idea, Priority, ProjectStatus } from '../../types';
import { Modal, Input, Button, Tabs } from '../../components/ui';

export interface PromoteIdeaModalProps {
  idea: Idea | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PromoteIdeaModal: React.FC<PromoteIdeaModalProps> = ({
  idea,
  isOpen,
  onClose,
}) => {
  const { promoteIdea } = useIdeaStore();
  const { addTask } = useTaskStore();
  const { projects, addProject } = useProjectStore();
  const { addToast } = useToast();

  const [targetType, setTargetType] = useState<string>('task');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('high');
  const [targetProjectId, setTargetProjectId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('Engineering');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (idea) {
      setTitle(idea.title);
      setDescription(idea.description);
      setCategory(idea.category || 'Engineering');
      if (projects.length > 0) {
        setTargetProjectId(projects[0].id);
      }
    }
  }, [idea, projects]);

  if (!idea) return null;

  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);

    try {
      if (targetType === 'task') {
        const targetProj = projects.find((p) => p.id === targetProjectId);
        const createdTask = await addTask({
          title: title.trim(),
          description: description.trim() || undefined,
          status: 'todo',
          columnId: 'todo',
          priority,
          projectId: targetProjectId || undefined,
          projectName: targetProj?.title,
          dueDate: dueDate || undefined,
          tags: idea.tags || [],
        });

        await promoteIdea(idea.id, {
          type: 'task',
          id: createdTask.id,
          title: createdTask.title,
        });

        addToast({
          type: 'success',
          title: 'Idea Promoted to Task',
          message: `Converted "${idea.title}" to active task.`,
        });
      } else {
        const createdProject = await addProject({
          title: title.trim(),
          description: description.trim() || undefined,
          status: 'active' as ProjectStatus,
          priority,
          dueDate: dueDate || undefined,
          category,
          tags: idea.tags || [],
        });

        await promoteIdea(idea.id, {
          type: 'project',
          id: createdProject.id,
          title: createdProject.title,
        });

        addToast({
          type: 'success',
          title: 'Idea Promoted to Project',
          message: `Created new project "${createdProject.title}".`,
        });
      }

      onClose();
    } catch {
      addToast({
        type: 'error',
        title: 'Promotion Failed',
        message: 'Could not convert idea. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Promote Idea into Action"
      size="md"
      id="promote-idea-modal"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handlePromoteSubmit} loading={loading}>
            Confirm & Promote
          </Button>
        </div>
      }
    >
      <form onSubmit={handlePromoteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div>
          <label className="pcc-input__label" style={{ marginBottom: 'var(--space-2)', display: 'block' }}>
            Choose Conversion Pathway
          </label>
          <Tabs
            tabs={[
              { id: 'task', label: 'Promote to Task' },
              { id: 'project', label: 'Promote to Initiative / Project' },
            ]}
            activeTab={targetType}
            onChange={setTargetType}
          />
        </div>

        <Input
          id="promote-title"
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="pcc-input-wrapper">
          <label className="pcc-input__label" htmlFor="promote-desc">
            Scope & Notes
          </label>
          <textarea
            id="promote-desc"
            className="pcc-input__field"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {targetType === 'task' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="pcc-input-wrapper">
              <label className="pcc-input__label" htmlFor="promote-proj-select">
                Assign to Project
              </label>
              <select
                id="promote-proj-select"
                className="pcc-input__field"
                value={targetProjectId}
                onChange={(e) => setTargetProjectId(e.target.value)}
              >
                <option value="">No Project (Standalone Task)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="pcc-input-wrapper">
              <label className="pcc-input__label" htmlFor="promote-priority">
                Priority
              </label>
              <select
                id="promote-priority"
                className="pcc-input__field"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <Input
              id="promote-cat"
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />

            <div className="pcc-input-wrapper">
              <label className="pcc-input__label" htmlFor="promote-proj-priority">
                Priority
              </label>
              <select
                id="promote-proj-priority"
                className="pcc-input__field"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        )}

        <Input
          id="promote-due-date"
          type="date"
          label="Target Due Date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </form>
    </Modal>
  );
};
