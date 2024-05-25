// script.js

// Select elements
const taskInput = document.getElementById('task-input');
const categorySelect = document.getElementById('category-select');
const taskDateInput = document.getElementById('task-date');
const addTaskButton = document.getElementById('add-task-button');
const taskList = document.getElementById('task-list');
const clearAllButton = document.getElementById('clear-all-button');
const taskStats = document.getElementById('task-stats');

// Add event listeners
addTaskButton.addEventListener('click', addTask);
taskList.addEventListener('click', handleTaskClick);
clearAllButton.addEventListener('click', clearAllTasks);
taskList.addEventListener('dblclick', editTask);
taskList.addEventListener('dragstart', dragStart);
taskList.addEventListener('dragover', dragOver);
taskList.addEventListener('drop', drop);

// Load tasks from local storage on page load
document.addEventListener('DOMContentLoaded', loadTasks);

// Add new task
function addTask() {
    const taskText = taskInput.value.trim();
    const taskCategory = categorySelect.value;
    const taskDate = taskDateInput.value;
    if (taskText === '') return;

    const taskItem = createTaskElement(taskText, taskCategory, taskDate);
    taskList.appendChild(taskItem);

    saveTask(taskText, taskCategory, taskDate);

    taskInput.value = '';
    taskDateInput.value = '';

    updateDashboard();
}

// Create task element
function createTaskElement(taskText, taskCategory, taskDate) {
    const taskItem = document.createElement('li');
    taskItem.className = 'task-item';
    taskItem.setAttribute('draggable', 'true');
    taskItem.id = `task-${Date.now()}`;

    taskItem.addEventListener('dragstart', () => {
        taskItem.classList.add('dragging');
    });

    taskItem.addEventListener('dragend', () => {
        taskItem.classList.remove('dragging');
    });

    const taskSpan = document.createElement('span');
    taskSpan.textContent = `${taskText} (${taskCategory}) - ${taskDate}`;

    const completeButton = document.createElement('input');
    completeButton.type = 'checkbox';

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';

    taskItem.appendChild(completeButton);
    taskItem.appendChild(taskSpan);
    taskItem.appendChild(deleteButton);

    return taskItem;
}

// Handle task click (complete or delete)
function handleTaskClick(event) {
    const item = event.target;

    if (item.tagName === 'INPUT' && item.type === 'checkbox') {
        item.parentElement.classList.toggle('completed');
    }

    if (item.tagName === 'BUTTON') {
        removeTask(item.parentElement);
        item.parentElement.remove();
    }

    updateDashboard();
}

// Save task to local storage
function saveTask(taskText, taskCategory, taskDate) {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.push({ text: taskText, category: taskCategory, date: taskDate });
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Load tasks from local storage
function loadTasks() {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.forEach(task => {
        const taskItem = createTaskElement(task.text, task.category, task.date);
        taskList.appendChild(taskItem);
    });

    updateDashboard();
}

// Remove task from local storage
function removeTask(taskElement) {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const taskText = taskElement.querySelector('span').textContent.split(' (')[0];
    tasks = tasks.filter(task => task.text !== taskText);
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Clear all tasks
function clearAllTasks() {
    taskList.innerHTML = '';
    localStorage.removeItem('tasks');
    updateDashboard();
}

// Enable drag and drop
function dragStart(event) {
    event.dataTransfer.setData('text/plain', event.target.id);
    setTimeout(() => event.target.classList.add('hide'), 0);
}

function dragOver(event) {
    event.preventDefault();
    const afterElement = getDragAfterElement(taskList, event.clientY);
    const draggable = document.querySelector('.dragging');
    if (afterElement == null) {
        taskList.appendChild(draggable);
    } else {
        taskList.insertBefore(draggable, afterElement);
    }
}

function drop(event) {
    event.preventDefault();
    const id = event.dataTransfer.getData('text');
    const draggable = document.getElementById(id);
    draggable.classList.remove('hide');
}

// Helper function to get the drag after element
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Allow task editing
function editTask(event) {
    if (event.target.tagName === 'SPAN') {
        const span = event.target;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = span.textContent.split(' (')[0];
        input.className = 'edit-input';
        
        span.replaceWith(input);
        
        input.focus();
        input.addEventListener('blur', () => saveEdit(input, span));
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveEdit(input, span);
            }
        });
    }
}

// Save edited task
function saveEdit(input, span) {
    const taskText = input.value.trim();
    if (taskText === '') {
        input.parentElement.remove();
        removeTask(input.parentElement);
    } else {
        span.textContent = taskText;
        input.replaceWith(span);

        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const oldText = span.getAttribute('data-old-text');
        const taskIndex = tasks.findIndex(task => task.text === oldText);
        if (taskIndex > -1) {
            tasks[taskIndex].text = taskText;
            localStorage.setItem('tasks', JSON.stringify(tasks));
        }
    }

    updateDashboard();
}

// Update dashboard with task statistics
function updateDashboard() {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const totalTasks = tasks.length;
    const completedTasks = document.querySelectorAll('.task-item.completed').length;
    const importantTasks = tasks.filter(task => task.category === 'important').length;
    
    taskStats.innerHTML = `
        <p>Total Tasks: ${totalTasks}</p>
        <p>Completed Tasks: ${completedTasks}</p>
        <p>Important Tasks: ${importantTasks}</p>
    `;
}
