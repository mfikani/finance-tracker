const WORKING_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DEFAULT_DURATION = 1.25;
const DAY_CONFIG = {
  Monday:    { start: 9, end: 19 },
  Tuesday:   { start: 9, end: 19 },
  Wednesday: { start: 9, end: 19 },
  Thursday:  { start: 9, end: 19 },
  Friday:    { start: 9, end: 19 },
  Saturday:  { start: 9, end: 14 }
};

function formatTime(hourFloat) {
  const hours = Math.floor(hourFloat);
  const minutes = Math.round((hourFloat - hours) * 60);
  return `${pad(hours)}:${pad(minutes)}`;
}

function pad(n) {
  return n.toString().padStart(2, '0');
}

function generateAppointments(duration) {
  const schedule = {};
  WORKING_DAYS.forEach(day => {
    const { start, end } = DAY_CONFIG[day];
    const slots = [];
    let currentTime = start;
    while (currentTime + duration <= end) {
      slots.push({
        start: formatTime(currentTime),
        end: formatTime(currentTime + duration),
        booked: false
      });
      currentTime += duration;
    }
    schedule[day] = slots;
  });
  return schedule;
}

function renderSchedule(duration = DEFAULT_DURATION) {
  const container = document.getElementById("schedule-container");
  container.innerHTML = ""; // Clear previous

  const schedule = generateAppointments(parseFloat(duration));

  WORKING_DAYS.forEach(day => {
    const table = document.createElement("table");
    const caption = document.createElement("caption");
    caption.textContent = day;
    table.appendChild(caption);

    const thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>Day + Date</th><th>Start</th><th>End</th><th>Status</th><th>Comment</th></tr>";
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    schedule[day].forEach(slot => {
      const row = document.createElement("tr");
      row.className = "slot";
	  const today = new Date();
	  const dayOffset = WORKING_DAYS.indexOf(day);
	  const slotDate = new Date(today);
	  slotDate.setDate(today.getDate() + ((dayOffset - today.getDay() + 7) % 7));
	  const dateStr = slotDate.toISOString().split("T")[0];

	  row.innerHTML = `
	    <td>${day} (${dateStr})</td>
	    <td>${slot.start}</td>
	    <td>${slot.end}</td>
	    <td><button onclick="toggleBooking(this)">Free</button></td>
	    <td><input type="text" class="comment" value="Add comment" onfocus="clearPlaceholder(this)"/></td>
	  `;
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);
  });
}

function toggleBooking(button) {
  const row = button.closest("tr");
  const isBooked = row.classList.toggle("booked");
  button.textContent = isBooked ? "Booked" : "Free";
}

function clearPlaceholder(input) {
  if (input.value === "Add comment") {
    input.value = "";
    input.style.fontStyle = "normal";
    input.style.color = "black";
  }
}

document.getElementById("duration").addEventListener("change", (e) => {
  renderSchedule(e.target.value);
});

renderSchedule(); // Initial render
