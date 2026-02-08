document.addEventListener("DOMContentLoaded", loadTasks);

const taskInput = document.getElementById("task-input");
const taskDateInput = document.getElementById("task-date"); // Fixed: match HTML id
const calendarIcon = document.getElementById("calendar-icon");
const addTaskBtn = document.getElementById("add-task-btn");
const taskList = document.getElementById("task-list");
const pendingTaskCount = document.getElementById("pending-tasks");
const clearAllBtn = document.getElementById("clear-all-btn");

let selectedDate = "";

calendarIcon.addEventListener("click", () => taskDateInput.showPicker());

taskDateInput.addEventListener("change", (e) => {
    selectedDate = e.target.value;
});

addTaskBtn.addEventListener("click", addTask);
clearAllBtn.addEventListener("click", clearAllTasks);

function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText === "" || selectedDate === "") {
        alert("Please enter a task and select a due date");
        return;
    }

    const taskItem = createTaskElement(taskText, false, selectedDate);
    taskList.appendChild(taskItem);
    saveTaskToLocalStorage(taskText, false, selectedDate);
    taskInput.value = "";
    selectedDate = "";

    updatePendingTasks();
}

function createTaskElement(taskText, isCompleted, taskDate) {
    const li = document.createElement("li");
    const daysLeft = calculateDaysLeft(taskDate);
    const daysLeftText = daysLeft === 0 ? "Task Overdue" : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`;
    let color = daysLeft < 3 ? "red" : daysLeft <= 5 ? "orange" : "green";

    li.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${isCompleted ? "checked" : ""}>
        <span class="task-text ${isCompleted ? "completed" : ""}">${taskText}</span>
        <span class="days-left" style="color: ${color};">${daysLeftText}</span>
        <button class="edit-btn">✎</button>
        <button class="delete-btn">❌</button>
    `;

    const editBtn = li.querySelector(".edit-btn");
    const deleteBtn = li.querySelector(".delete-btn");
    const taskTextElement = li.querySelector(".task-text");

    li.querySelector(".task-checkbox").addEventListener("change", (e) => {
        const isChecked = e.target.checked;
        taskTextElement.classList.toggle("completed", isChecked);
        updateTaskStatus(taskText, isChecked, taskDate);
        updatePendingTasks();
    });

    editBtn.addEventListener("click", () => editTask(li, taskText, taskDate));
    deleteBtn.addEventListener("click", () => {
        removeTaskFromLocalStorage(taskText);
        li.remove();
        updatePendingTasks();
    });

    return li;
}

function editTask(li, oldText, oldDate) {
    const taskTextElement = li.querySelector(".task-text");
    const daysLeftElement = li.querySelector(".days-left");
    const editBtn = li.querySelector(".edit-btn");

    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.value = taskTextElement.textContent;
    textInput.classList.add("edit-input");

    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.value = oldDate;
    dateInput.classList.add("edit-date");

    const saveBtn = document.createElement("button");
    saveBtn.innerHTML = "💾";
    saveBtn.classList.add("save-btn");

    li.replaceChild(textInput, taskTextElement);
    li.replaceChild(dateInput, daysLeftElement);
    li.replaceChild(saveBtn, editBtn);

    saveBtn.addEventListener("click", () => saveEditedTask(li, oldText, textInput.value, dateInput.value));
}

function saveEditedTask(li, oldText, newText, newDate) {
    if (!newText.trim() || !newDate) {
        alert("Task name and date cannot be empty!");
        return;
    }

    const daysLeft = calculateDaysLeft(newDate);
    const daysLeftText = daysLeft === 0 ? "Task Overdue" : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`;
    let color = daysLeft < 3 ? "red" : daysLeft <= 5 ? "orange" : "green";

    const taskTextElement = document.createElement("span");
    taskTextElement.textContent = newText;
    taskTextElement.classList.add("task-text");

    const daysLeftElement = document.createElement("span");
    daysLeftElement.textContent = daysLeftText;
    daysLeftElement.style.color = color;
    daysLeftElement.classList.add("days-left");

    const editBtn = document.createElement("button");
    editBtn.innerHTML = "✎";
    editBtn.classList.add("edit-btn");

    li.replaceChild(taskTextElement, li.querySelector(".edit-input"));
    li.replaceChild(daysLeftElement, li.querySelector(".edit-date"));
    li.replaceChild(editBtn, li.querySelector(".save-btn"));

    editBtn.addEventListener("click", () => editTask(li, newText, newDate));

    updateTaskInLocalStorage(oldText, newText, newDate);
    loadTasks();
}

function calculateDaysLeft(taskDate) {
    const today = new Date();
    const dueDate = new Date(taskDate);
    const timeDiff = dueDate - today;
    const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Fixed math
    return daysLeft < 0 ? 0 : daysLeft;
}

function saveTaskToLocalStorage(taskText, isCompleted, taskDate) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.push({ text: taskText, completed: isCompleted, date: taskDate });
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function updateTaskInLocalStorage(oldText, newText, newDate) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks = tasks.map(task =>
        task.text === oldText ? { text: newText, completed: task.completed, date: newDate } : task
    );
    localStorage.setItem("tasks", JSON.stringify(tasks)); // Fixed key
}

function removeTaskFromLocalStorage(taskText) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks = tasks.filter(task => task.text !== taskText); // Fixed logic
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadTasks() {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.sort((a, b) => calculateDaysLeft(a.date) - calculateDaysLeft(b.date));

    taskList.innerHTML = "";
    tasks.forEach(task => {
        const taskItem = createTaskElement(task.text, task.completed, task.date);
        taskList.appendChild(taskItem);
    });

    updatePendingTasks();
}

function updateTaskStatus(taskText, isCompleted, taskDate) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks = tasks.map(task =>
        task.text === taskText ? { ...task, completed: isCompleted } : task
    );
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function clearAllTasks() {
    localStorage.removeItem("tasks");
    taskList.innerHTML = "";
    updatePendingTasks();
}

function updatePendingTasks() {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    let pendingCount = tasks.filter(task => !task.completed).length;
    pendingTaskCount.textContent = `You have ${pendingCount} pending tasks.`;
    clearAllBtn.style.display = tasks.length > 0 ? "inline-block" : "none";
}
