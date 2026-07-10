'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sortable from 'sortablejs';
import { get, set } from 'idb-keyval';

type Todo = {
  _id?: string;
  text: string;
  completed: boolean;
  sortOrder: number;
  hasReminder?: boolean;
  reminderDate?: string;
  reminderTime?: string;
};

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [taskInput, setTaskInput] = useState('');
  const taskListRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [loading, setLoading] = useState(true);
  const latestTodos = useRef<Todo[]>([]);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  useEffect(() => {
    latestTodos.current = todos;
  }, [todos]);

  // Modal state
  const [editingTodoIndex, setEditingTodoIndex] = useState<number | null>(null);
  const [editPopupText, setEditPopupText] = useState('');
  const [editHasReminder, setEditHasReminder] = useState(false);
  const [editReminderDate, setEditReminderDate] = useState('');
  const [editReminderTime, setEditReminderTime] = useState('');

  const syncOfflineActions = async () => {
    const queue = (await get('syncQueue')) || [];
    if (queue.length === 0) return;

    const remaining = [...queue];
    for (let i = 0; i < queue.length; i++) {
      const action = queue[i];
      try {
        await fetch(action.url, {
          method: action.method,
          headers: { 'Content-Type': 'application/json' },
          body: action.body ? JSON.stringify(action.body) : undefined,
        });
        remaining.shift();
      } catch {
        break;
      }
    }
    await set('syncQueue', remaining);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const performAction = async (url: string, method: string, body?: any) => {
    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      const queue = (await get('syncQueue')) || [];
      queue.push({ url, method, body });
      await set('syncQueue', queue);
    }
  };

  const fetchTodos = async () => {
    try {
      const localTodos = await get('todos');
      if (localTodos) {
        setTodos(sortTodos(localTodos));
      }
      
      const res = await fetch('/api/todos');
      const data = await res.json();
      if (data.success) {
        const fetchedTodos = data.data.map((t: Todo) => ({ ...t }));
        const sorted = sortTodos(fetchedTodos);
        setTodos(sorted);
        await set('todos', sorted);
      }
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
    
    const handleOnline = () => {
      syncOfflineActions();
    };
    window.addEventListener('online', handleOnline);

    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission();
    }

    const interval = setInterval(() => {
      const now = new Date();
      let changed = false;
      const currentTodos = latestTodos.current;
      const updatedTodos = currentTodos.map(todo => {
        if (todo.hasReminder && todo.reminderDate && todo.reminderTime) {
          const reminderDateTime = new Date(`${todo.reminderDate}T${todo.reminderTime}`);
          if (now >= reminderDateTime) {
            if (Notification.permission === 'granted') {
              new Notification('Task Reminder', {
                body: todo.text,
                icon: '/icon-192x192.png'
              });
            } else {
              alert(`Reminder: ${todo.text}`);
            }
            changed = true;
            return { ...todo, hasReminder: false };
          }
        }
        return todo;
      });

      if (changed) {
        const newSorted = sortTodos(updatedTodos);
        setTodos(newSorted);
        set('todos', newSorted);
        const triggered = updatedTodos.filter((t, i) => currentTodos[i].hasReminder && !t.hasReminder);
        triggered.forEach(t => {
          if (t._id) {
             performAction(`/api/todos/${t._id}`, 'PUT', { hasReminder: false });
          }
        });
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (taskListRef.current) {
      Sortable.create(taskListRef.current, {
        animation: 200,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        fallbackTolerance: 3,
        forceFallback: true,
        delay: 500,
        delayOnTouchOnly: true,
        filter: '.completed-task, .edit-input, .btn-icon, .todo-checkbox',
        preventOnFilter: false,
        onEnd: async function (evt) {
          const { oldIndex, newIndex } = evt;
          if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return;

          // Instead of mutating the DOM sorting which Sortable does automatically,
          // it's tricky with React. We should let React handle the re-render.
          // Revert the DOM node move that Sortable did because React state will drive it:
          const itemEl = evt.item;
          if (newIndex > oldIndex) {
            itemEl.parentNode?.insertBefore(itemEl, taskListRef.current!.children[oldIndex]);
          } else {
            itemEl.parentNode?.insertBefore(itemEl, taskListRef.current!.children[oldIndex + 1]);
          }

          setTodos((prev) => {
            const newTodos = [...prev];
            const movedItem = newTodos.splice(oldIndex, 1)[0];
            newTodos.splice(newIndex, 0, movedItem);

            const updatedTodos = newTodos.map((todo, index) => ({
              ...todo,
              sortOrder: index,
            }));
            
            set('todos', updatedTodos);

            // Sync with DB
            performAction('/api/todos', 'PUT', updatedTodos.map(t => ({ _id: t._id, sortOrder: t.sortOrder })));

            return updatedTodos;
          });
        },
      });
    }
  }, [loading]); // Re-initialize when loading finishes

  const sortTodos = (list: Todo[]) => {
    return [...list].sort((a, b) => {
      if (a.completed !== b.completed) {
        return Number(a.completed) - Number(b.completed);
      }
      return a.sortOrder - b.sortOrder;
    });
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTaskInput(e.target.value);
    if (inputRef.current) {
      inputRef.current.style.height = '48px';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  };

  const handleAdd = async () => {
    const rawText = taskInput.trim();
    if (!rawText) return;

    const lines = rawText.split('\n');
    const currentTodos = [...todos];
    const currentMinOrder = currentTodos.length > 0 ? Math.min(...currentTodos.map(t => t.sortOrder || 0)) : 0;

    for (let i = 0; i < lines.length; i++) {
      let text = lines[i].trim();
      text = text.replace(/^\d+\.\s*/, '');

      if (text) {
        const newTodoObj = { text: text, completed: false, sortOrder: currentMinOrder - lines.length + i, _id: Date.now().toString() + i }; // Optimistic ID for offline
        
        try {
          const res = await fetch('/api/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTodoObj),
          });
          const data = await res.json();
          if (data.success) {
            currentTodos.push({ ...data.data });
          } else {
             currentTodos.push(newTodoObj);
          }
        } catch (error) {
          console.error('Failed to add todo, saving offline:', error);
          currentTodos.push(newTodoObj);
          performAction('/api/todos', 'POST', newTodoObj);
        }
      }
    }

    setTaskInput('');
    if (inputRef.current) {
      inputRef.current.style.height = '48px';
    }
    const finalSorted = sortTodos(currentTodos);
    setTodos(finalSorted);
    set('todos', finalSorted);
  };

  const toggleTodo = async (index: number) => {
    const todo = todos[index];
    const updatedStatus = !todo.completed;
    
    setTodos((prev) => {
      const next = [...prev];
      next[index].completed = updatedStatus;
      const sorted = sortTodos(next);
      set('todos', sorted);
      return sorted;
    });

    if (todo._id && !todo._id.startsWith(Date.now().toString().substring(0, 5))) {
      performAction(`/api/todos/${todo._id}`, 'PUT', { completed: updatedStatus });
    }
  };

  const deleteTodo = async (index: number) => {
    const todo = todos[index];
    setTodos((prev) => {
      const newTodos = prev.filter((_, i) => i !== index);
      set('todos', newTodos);
      return newTodos;
    });

    if (todo._id && !todo._id.startsWith(Date.now().toString().substring(0, 5))) {
      performAction(`/api/todos/${todo._id}`, 'DELETE');
    }
  };

  const openEditModal = (index: number) => {
    const todo = todos[index];
    setEditingTodoIndex(index);
    setEditPopupText(todo.text);
    setEditHasReminder(todo.hasReminder || false);
    setEditReminderDate(todo.reminderDate || '');
    setEditReminderTime(todo.reminderTime || '');
  };

  const closeEditModal = () => {
    setEditingTodoIndex(null);
  };

  const saveEditModal = async () => {
    if (editingTodoIndex === null) return;
    
    const text = editPopupText.trim();
    if (text === '') {
      await deleteTodo(editingTodoIndex);
      closeEditModal();
      return;
    }

    const todo = todos[editingTodoIndex];
    const updateData: Partial<Todo> = { 
      text,
      hasReminder: editHasReminder,
      reminderDate: editHasReminder ? editReminderDate : undefined,
      reminderTime: editHasReminder ? editReminderTime : undefined,
    };

    setTodos((prev) => {
      const next = [...prev];
      next[editingTodoIndex] = { ...next[editingTodoIndex], ...updateData };
      set('todos', next);
      return next;
    });

    closeEditModal();

    if (todo._id && !todo._id.startsWith(Date.now().toString().substring(0, 5))) {
      performAction(`/api/todos/${todo._id}`, 'PUT', updateData);
    }
  };
  
  const handleReminderToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked;
    setEditHasReminder(enabled);
    if (enabled) {
      const now = new Date();
      if (!editReminderDate) {
        setEditReminderDate(now.toISOString().split('T')[0]);
      }
      if (!editReminderTime) {
        const future = new Date(now.getTime() + 10 * 60000);
        const hours = future.getHours().toString().padStart(2, '0');
        const minutes = future.getMinutes().toString().padStart(2, '0');
        setEditReminderTime(`${hours}:${minutes}`);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  if (loading) {
    return null; // Or a loading spinner if preferred, keeping it minimal like original HTML
  }

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0 }}>Tasks</h1>
        <button 
          onClick={handleLogout} 
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', padding: '8px', marginTop: '4px' }}
          className="logout-btn"
        >
          Logout
        </button>
      </header>

      <div className="input-group">
        <textarea
          ref={inputRef}
          value={taskInput}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Add a task or paste a list..."
          rows={1}
        />
        <button onClick={handleAdd} className="btn-primary">Add</button>
      </div>

      <ul ref={taskListRef}>
        {todos.map((todo, index) => (
          <li
            key={todo._id || index}
            className={todo.completed ? 'completed-task' : ''}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest('.actions') || target.tagName.toLowerCase() === 'input') {
                return;
              }
              toggleTodo(index);
            }}
          >
            <input
              type="checkbox"
              className="todo-checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(index)}
              onClick={(e) => e.stopPropagation()}
            />
            
            <div className={`todo-content ${todo.completed ? 'completed' : ''}`}>
              {todo.text}
              {todo.hasReminder && todo.reminderDate && todo.reminderTime && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  ⏰ {todo.reminderDate} {todo.reminderTime}
                </div>
              )}
            </div>

            <div className="actions" onClick={(e) => e.stopPropagation()}>
              <button className="btn-icon" onClick={() => openEditModal(index)}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                </svg>
              </button>
              <button className="btn-icon delete" onClick={() => deleteTodo(index)}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </li>
        ))}
      </ul>

      {editingTodoIndex !== null && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Edit Todo</h2>
            <textarea
              value={editPopupText}
              onChange={e => setEditPopupText(e.target.value)}
              rows={3}
              autoFocus
            />
            
            <label className="reminder-toggle">
              <input
                type="checkbox"
                className="todo-checkbox"
                checked={editHasReminder}
                onChange={handleReminderToggle}
              />
              Enable Reminder
            </label>
            
            {editHasReminder && (
              <div className="reminder-inputs">
                <input
                  type="date"
                  value={editReminderDate}
                  onChange={e => setEditReminderDate(e.target.value)}
                />
                <input
                  type="time"
                  value={editReminderTime}
                  onChange={e => setEditReminderTime(e.target.value)}
                />
              </div>
            )}
            
            <div className="modal-actions">
              <button className="btn-secondary" onClick={closeEditModal}>Cancel</button>
              <button className="btn-primary small" onClick={saveEditModal}>Save</button>
            </div>
          </div>
        </div>
      )}
      
      <footer className="footer-copyright">
        copyright 2026 - made by <a href="https://atifhasan.com" target="_blank" rel="noopener noreferrer"><strong>Atif Hasan</strong></a>
      </footer>
    </div>
  );
}
