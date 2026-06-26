'use client';

import { useEffect, useState, useRef } from 'react';
import Sortable from 'sortablejs';

type Todo = {
  _id?: string;
  text: string;
  completed: boolean;
  sortOrder: number;
  isEditing?: boolean;
};

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [taskInput, setTaskInput] = useState('');
  const taskListRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [loading, setLoading] = useState(true);

  const fetchTodos = async () => {
    try {
      const res = await fetch('/api/todos');
      const data = await res.json();
      if (data.success) {
        const fetchedTodos = data.data.map((t: Todo) => ({ ...t, isEditing: false }));
        setTodos(sortTodos(fetchedTodos));
      }
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  useEffect(() => {
    if (taskListRef.current) {
      Sortable.create(taskListRef.current, {
        animation: 200,
        ghostClass: 'sortable-ghost',
        fallbackTolerance: 3,
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

            // Sync with DB
            fetch('/api/todos', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedTodos.map(t => ({ _id: t._id, sortOrder: t.sortOrder }))),
            });

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
    let currentTodos = [...todos];
    const currentMinOrder = currentTodos.length > 0 ? Math.min(...currentTodos.map(t => t.sortOrder || 0)) : 0;

    for (let i = 0; i < lines.length; i++) {
      let text = lines[i].trim();
      text = text.replace(/^\d+\.\s*/, '');

      if (text) {
        const newTodoObj = { text: text, completed: false, sortOrder: currentMinOrder - lines.length + i };
        
        try {
          const res = await fetch('/api/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTodoObj),
          });
          const data = await res.json();
          if (data.success) {
            currentTodos.push({ ...data.data, isEditing: false });
          }
        } catch (error) {
          console.error('Failed to add todo:', error);
        }
      }
    }

    setTaskInput('');
    if (inputRef.current) {
      inputRef.current.style.height = '48px';
    }
    setTodos(sortTodos(currentTodos));
  };

  const toggleTodo = async (index: number) => {
    const todo = todos[index];
    const updatedStatus = !todo.completed;
    
    setTodos((prev) => {
      const next = [...prev];
      next[index].completed = updatedStatus;
      return sortTodos(next);
    });

    if (todo._id) {
      await fetch(`/api/todos/${todo._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: updatedStatus }),
      });
    }
  };

  const deleteTodo = async (index: number) => {
    const todo = todos[index];
    setTodos((prev) => prev.filter((_, i) => i !== index));

    if (todo._id) {
      await fetch(`/api/todos/${todo._id}`, { method: 'DELETE' });
    }
  };

  const enableEdit = (index: number) => {
    setTodos((prev) => {
      const next = [...prev];
      next[index].isEditing = true;
      return next;
    });
  };

  const saveEdit = async (index: number, newText: string) => {
    const text = newText.trim();
    if (text === '') {
      await deleteTodo(index);
    } else {
      const todo = todos[index];
      setTodos((prev) => {
        const next = [...prev];
        next[index].text = text;
        next[index].isEditing = false;
        return next;
      });

      if (todo._id) {
        await fetch(`/api/todos/${todo._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
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
      <header>
        <h1>Tasks</h1>
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
              if (todo.isEditing || target.closest('.actions') || target.tagName.toLowerCase() === 'input') {
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
              {todo.isEditing ? (
                <textarea
                  className="edit-input"
                  defaultValue={todo.text}
                  style={{ height: 'auto' }}
                  rows={2}
                  autoFocus
                  onBlur={(e) => saveEdit(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      saveEdit(index, e.currentTarget.value);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                todo.text
              )}
            </div>

            <div className="actions" onClick={(e) => e.stopPropagation()}>
              <button className="btn-icon" onClick={() => enableEdit(index)}>
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
    </div>
  );
}
