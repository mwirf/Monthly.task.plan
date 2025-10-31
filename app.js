// Add months to roadmap with empty array of tasks
const roadmap = [
  {
    month: "Month 1",
    tasks: [],
  },

  {
    month: "Month 2",
    tasks: [],
  },
  {
    month: "Month 3",
    tasks: [],
  },
  {
    month: "Month 4",
    tasks: [],
  },
  {
    month: "Month 5",
    tasks: [],
  },
  {
    month: "Month 6",
    tasks: [],
  },
  {
    month: "Month 7",
    tasks: [],
  },
  {
    month: "Month 8",
    tasks: [],
  },
  {
    month: "Month 9",
    tasks: [],
  },
];

// Set DOM references
const roadmapContainer = document.getElementById("roadmap");
const progressBarFill = document.getElementById("progress-bar-fill");
const motivationMsg = document.getElementById("motivation_msg");

// LocalStorage key for custom tasks
const CUSTOM_TASKS_KEY = "customTasksByMonth";

// In-memory copy of the saved custom tasks map
let customTasksMap = {};

function saveCustomTasksMap(map) {
  try {
    localStorage.setItem(CUSTOM_TASKS_KEY, JSON.stringify(map));
    customTasksMap = map || {};
  } catch (e) {
    console.warn("Could not save custom tasks map", e);
  }
}

// Load custom tasks
function loadCustomTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(CUSTOM_TASKS_KEY)) || {};
    customTasksMap = saved || {};
    // Saved should be an object where keys are monthIndex and values are arrays
    Object.keys(saved).forEach((monthKey) => {
      const monthIndex = parseInt(monthKey, 10);
      const tasks = saved[monthKey];
      if (!Number.isFinite(monthIndex) || !Array.isArray(tasks)) return;
      // Make sure the month exists in roadmap
      if (!roadmap[monthIndex]) return;
      tasks.forEach((task) => {
        if (!roadmap[monthIndex].tasks.includes(task)) roadmap[monthIndex].tasks.push(task);
      });
    });
  } catch (e) {
    console.warn("Could not load custom tasks map", e);
  }
}

// Add task to selected month
function addTaskToSelectedMonth() {
  const input = document.getElementById("new-task-input");
  const select = document.getElementById("month-select");
  if (!input || !select) return;
  const text = input.value.trim();
  if (!text) return;

  const monthIndex = parseInt(select.value, 10) || 0;
  if (!roadmap[monthIndex]) return;

  // Add to in-memory roadmap
  roadmap[monthIndex].tasks.push(text);

  // Persist to the map
  const existingMap = JSON.parse(localStorage.getItem(CUSTOM_TASKS_KEY)) || {};
  existingMap[monthIndex] = existingMap[monthIndex] || [];
  existingMap[monthIndex].push(text);
  saveCustomTasksMap(existingMap);

  // Re-render and restore progress state
  renderRoadmap();
  loadProgress();

  // Clear input and focus values
  input.value = "";
  input.focus();
}

function deleteTask(monthIndex, taskText) {
  // Only delete custom tasks (stored in customTasksMap)
  if (!customTasksMap || !Array.isArray(customTasksMap[monthIndex])) return;

  // Remove from roadmap in-memory
  const taskIdx = roadmap[monthIndex].tasks.indexOf(taskText);
  if (taskIdx === -1) return;
  roadmap[monthIndex].tasks.splice(taskIdx, 1);

  // Remove from customTasksMap
  customTasksMap[monthIndex] = customTasksMap[monthIndex].filter((t) => t !== taskText);
  if (customTasksMap[monthIndex].length === 0) delete customTasksMap[monthIndex];
  saveCustomTasksMap(customTasksMap);

  // Re-render and restore/cleanup progress state
  renderRoadmap();
  // Clear progress entries and re-save based on current checkboxes
  saveProgress();
  loadProgress();
}

// Save progress to localStorage
function saveProgress() {
  const progressData = {};
  document.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
    const month = checkbox.dataset.month;
    const task = checkbox.dataset.task;
    if (!progressData[month]) progressData[month] = {};
    progressData[month][task] = checkbox.checked;
  });
  localStorage.setItem("progressData", JSON.stringify(progressData));
}

// Load progress from localStorage
function loadProgress() {
  const progressData = JSON.parse(localStorage.getItem("progressData")) || {};
  document.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
    const month = checkbox.dataset.month;
    const task = checkbox.dataset.task;
    if (progressData[month] && progressData[month][task]) {
      checkbox.checked = true;
    }
  });
  updateProgress();
}

// Update progress bar
function updateProgress() {
  const totalTasks = roadmap.reduce((sum, month) => sum + month.tasks.length, 0);
  const completedTasks = document.querySelectorAll("input[type='checkbox']:checked").length;
  const progress = Math.round((completedTasks / totalTasks) * 100);

  progressBarFill.style.width = `${progress}%`;
  progressBarFill.textContent = `${progress}%`;

  // Fix NaN display for zero tasks
  if (totalTasks === 0) {
    progressBarFill.style.width = `0%`;
    progressBarFill.textContent = `0%`;
    setMotivation(0);
    return true;
  }

  setMotivation(progress);

  saveProgress();
}

// Display motivation message
function setMotivation(progress) {
  if (!motivationMsg) return;
  // Clear previous classes
  motivationMsg.className = "";

  let text = "";
  let cls = "motivation";

  if (progress === 100) {
    text = "Great job! You completed all tasks! Take that well deserved victory lap.";
    cls += " complete";
  } else if (progress >= 80) {
    text = "Getting so close! Keep up the focus and push through the final steps.";
    cls += " high";
  } else if (progress >= 50) {
    text = "You are more than halfway there! Keep up the momentum.";
    cls += " med_high";
  } else if (progress >= 20) {
    text = "Nice progress — steady wins the race. One task at a time!";
    cls += " medium";
  } else if (progress >= 1) {
    text = "Way to take your first step! You are off to a great start. Keep it going!";
    cls += " low";
  } else {
    text = "Let's get started with your journey!";
    cls += " zero";
  }

  motivationMsg.textContent = text;
  motivationMsg.className = cls;
}

function renderRoadmap() {
  // Clear existing content to avoid duplicates on re-render
  roadmapContainer.innerHTML = "";

  roadmap.forEach((monthData, monthIndex) => {
    const monthDiv = document.createElement("div");
    monthDiv.classList.add("month");

    const monthTitle = document.createElement("h2");
    monthTitle.textContent = monthData.month;
    monthDiv.appendChild(monthTitle);

    monthData.tasks.forEach((task, taskIndex) => {
      const taskDiv = document.createElement("div");
      taskDiv.classList.add("task");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.dataset.month = monthIndex;
      checkbox.dataset.task = taskIndex;
      checkbox.addEventListener("change", updateProgress);

      const label = document.createElement("label");
      label.textContent = task;

      // Add delete button for added tasks
      const addedTask =
        customTasksMap[monthIndex] &&
        Array.isArray(customTasksMap[monthIndex]) &&
        customTasksMap[monthIndex].includes(task);
      let delBtn = null;
      if (addedTask) {
        delBtn = document.createElement("button");
        delBtn.className = "delete-task-btn";
        delBtn.type = "button";
        delBtn.title = "Delete custom task";
        delBtn.textContent = "Delete";
        delBtn.addEventListener("click", () => deleteTask(monthIndex, task));
      }

      taskDiv.appendChild(checkbox);
      taskDiv.appendChild(label);
      if (delBtn) taskDiv.appendChild(delBtn);
      monthDiv.appendChild(taskDiv);
    });

    roadmapContainer.appendChild(monthDiv);
  });
}

// Load any previously saved custom tasks before rendering
loadCustomTasks();
renderRoadmap();
loadProgress();

// Populate month dropdown from Months on roadmap
function populateMonthSelect() {
  const select = document.getElementById("month-select");
  if (!select) return;
  // clear any existing
  select.innerHTML = "";
  roadmap.forEach((m, idx) => {
    const opt = document.createElement("option");
    opt.value = idx;
    opt.textContent = m.month || `Month ${idx + 1}`;
    select.appendChild(opt);
  });
}

populateMonthSelect();

// Hook up add-task UI to the generic handler
const addBtn = document.getElementById("add-task-btn");
const newTaskInput = document.getElementById("new-task-input");
if (addBtn) addBtn.addEventListener("click", addTaskToSelectedMonth);
if (newTaskInput)
  newTaskInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") addTaskToSelectedMonth();
  });
