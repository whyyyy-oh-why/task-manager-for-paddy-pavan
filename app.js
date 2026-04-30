(() => {

  let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  let filter = 'all';

  const form        = document.getElementById('taskForm');
  const input       = document.getElementById('taskInput');
  const list        = document.getElementById('taskList');
  const emptyState  = document.getElementById('emptyState');
  const footer      = document.getElementById('footer');
  const itemsLeft   = document.getElementById('itemsLeft');
  const clearBtn    = document.getElementById('clearCompleted');
  const themeToggle = document.getElementById('themeToggle');
  const filterBtns  = document.querySelectorAll('.filter-btn');


  const save = () => localStorage.setItem('tasks', JSON.stringify(tasks));


  const applyTheme = (dark) => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    themeToggle.textContent = dark ? '☀️' : '🌙';
    themeToggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  };
  let darkMode = localStorage.getItem('theme') === 'dark';
  applyTheme(darkMode);
  themeToggle.addEventListener('click', () => {
    darkMode = !darkMode;
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    applyTheme(darkMode);
  });

 
  const render = () => {
    const visible = tasks.filter(t =>
      filter === 'all' ? true : filter === 'active' ? !t.done : t.done
    );

    list.innerHTML = '';
    visible.forEach(t => list.appendChild(createItem(t)));

    const active = tasks.filter(t => !t.done).length;
    const hasCompleted = tasks.some(t => t.done);

    emptyState.hidden = visible.length > 0;
    footer.hidden = tasks.length === 0;
    itemsLeft.textContent = `${active} item${active !== 1 ? 's' : ''} left`;
    clearBtn.style.visibility = hasCompleted ? 'visible' : 'hidden';
  };


  const createItem = (task) => {
    const li = document.createElement('li');
    li.className = `task-item${task.done ? ' done' : ''}`;
    li.dataset.id = task.id;
    li.setAttribute('role', 'listitem');

    li.innerHTML = `
      <label class="checkbox-wrap" aria-label="${task.done ? 'Mark incomplete' : 'Mark complete'}">
        <input type="checkbox" ${task.done ? 'checked' : ''} aria-label="Toggle task completion" />
        <span class="checkmark"></span>
      </label>
      <span class="task-text">${escHtml(task.text)}</span>
      <div class="actions">
        <button class="action-btn edit" aria-label="Edit task" title="Edit">✏️</button>
        <button class="action-btn delete" aria-label="Delete task" title="Delete">🗑️</button>
      </div>`;

    li.querySelector('input[type="checkbox"]').addEventListener('change', () => toggle(task.id));
    li.querySelector('.edit').addEventListener('click', () => startEdit(li, task));
    li.querySelector('.delete').addEventListener('click', () => removeTask(li, task.id));

    return li;
  };

 
  const escHtml = (str) =>
    str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  
  const addTask = (text) => {
    tasks.unshift({ id: Date.now(), text, done: false });
    save();
    render();
  };

  const toggle = (id) => {
    tasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    save();
    render();
  };

  const removeTask = (li, id) => {
    li.classList.add('removing');
    li.addEventListener('animationend', () => {
      tasks = tasks.filter(t => t.id !== id);
      save();
      render();
    }, { once: true });
  };

  const startEdit = (li, task) => {
    const span = li.querySelector('.task-text');
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'edit-input';
    editInput.value = task.text;
    editInput.setAttribute('aria-label', 'Edit task text');
    span.replaceWith(editInput);
    editInput.focus();

    const commit = () => {
      const val = editInput.value.trim();
      if (val && val !== task.text) {
        tasks = tasks.map(t => t.id === task.id ? { ...t, text: val } : t);
        save();
      }
      render();
    };

    editInput.addEventListener('blur', commit);
    editInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') editInput.blur();
      if (e.key === 'Escape') { editInput.value = task.text; editInput.blur(); }
    });
  };


  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addTask(text);
    input.value = '';
    input.focus();
  });


  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filter = btn.dataset.filter;
      filterBtns.forEach(b => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
      });
      render();
    });
  });


  clearBtn.addEventListener('click', () => {
    tasks = tasks.filter(t => !t.done);
    save();
    render();
  });

  render();
})();
