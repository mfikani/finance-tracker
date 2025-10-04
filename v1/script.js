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
	let totalWorked = 0;
	let totalPaid = 0;

	schedule[day].forEach(slot => {
	  const today = new Date();
	  const dayIndex = WORKING_DAYS.indexOf(day);
	  const slotDate = new Date(today);
	  const currentDay = today.getDay();
	  const offset = (dayIndex + 1 - currentDay + 7) % 7;
	  slotDate.setDate(today.getDate() + offset);

	  const dateStr = slotDate.toISOString().split("T")[0];
	  const dateKey = dateStr.replace(/-/g, "");
	  const slotKey = `${dateKey}_${day}_${slot.start}-${slot.end}`;

	  const saved = JSON.parse(localStorage.getItem(slotKey)) || {};
	  const worked = parseFloat(saved.worked) || 0;
	  const paid = parseFloat(saved.paid) || 0;

	  totalWorked += worked;
	  totalPaid += paid;
	});
  });
  return schedule;
}

function renderSchedule(duration = DEFAULT_DURATION) {
  const container = document.getElementById("schedule-container");
  container.innerHTML = ""; // Clear previous

  const schedule = generateAppointments(parseFloat(duration));

  // WEEK SUMMARY CALCULATION
  let totalWorkedWeek = 0;
  let totalPaidWeek = 0;

  WORKING_DAYS.forEach(day => {
    schedule[day].forEach(slot => {
      const today = new Date();
      const dayIndex = WORKING_DAYS.indexOf(day);
      const slotDate = new Date(today);
      const currentDay = today.getDay();
      const offset = (dayIndex + 1 - currentDay + 7) % 7;
      slotDate.setDate(today.getDate() + offset);

      const dateStr = slotDate.toISOString().split("T")[0];
      const dateKey = dateStr.replace(/-/g, "");
      const slotKey = `${dateKey}_${day}_${slot.start}-${slot.end}`;

      const saved = JSON.parse(localStorage.getItem(slotKey)) || {};
      totalWorkedWeek += parseFloat(saved.worked) || 0;
      totalPaidWeek += parseFloat(saved.paid) || 0;
    });
  });

  const totalEarnedWeek = (0.4 * totalWorkedWeek).toFixed(2);

  // Load user-defined Previous Left to Pay
  let previousLeftToPay = parseFloat(localStorage.getItem("previousLeftToPay")) || 0;
  let remainingLeftToPay = (previousLeftToPay - totalPaidWeek).toFixed(2);

  // Get current week range
  const monday = new Date();
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const weekRange = `${monday.toISOString().split("T")[0]} to ${sunday.toISOString().split("T")[0]}`;

  // Render summary table
  document.getElementById("week-summary").innerHTML = `
    <table>
      <tr>
        <th>Week</th>
        <th>Total Worked</th>
        <th>Total Earned</th>
        <th>Total Paid</th>
        <th>Previous Left to Pay</th>
        <th>Remaining Left to Pay</th>
      </tr>
      <tr>
        <td>${weekRange}</td>
        <td>${totalWorkedWeek.toFixed(2)} h</td>
        <td>${totalEarnedWeek} €</td>
        <td>${totalPaidWeek.toFixed(2)} €</td>
        <td>
          <input type="number" value="${previousLeftToPay}" 
                 onblur="savePreviousLeftToPay(this)" />
        </td>
        <td>${remainingLeftToPay} €</td>
      </tr>
    </table>
  `;

  // DAILY TABLES
  WORKING_DAYS.forEach(day => {
    const table = document.createElement("table");
    const caption = document.createElement("caption");
    caption.textContent = day;
    table.appendChild(caption);

    const tbody = document.createElement("tbody");
    let totalWorked = 0;
    let totalPaid = 0;

    schedule[day].forEach(slot => {
      const today = new Date();
      const dayIndex = WORKING_DAYS.indexOf(day);
      const slotDate = new Date(today);
      const currentDay = today.getDay();
      const offset = (dayIndex + 1 - currentDay + 7) % 7;
      slotDate.setDate(today.getDate() + offset);

      const dateStr = slotDate.toISOString().split("T")[0];
      const dateKey = dateStr.replace(/-/g, "");
      const slotKey = `${dateKey}_${day}_${slot.start}-${slot.end}`;

      const saved = JSON.parse(localStorage.getItem(slotKey)) || {};
      const isBooked = saved.booked || false;
      const commentText = saved.comment || "Add comment";
      const worked = parseFloat(saved.worked) || 0;
      const paid = parseFloat(saved.paid) || 0;
      const earned = worked ? (0.4 * worked).toFixed(2) : "";
      const toBePaid = (earned && paid) ? (earned - paid).toFixed(2) : "";

      totalWorked += worked;
      totalPaid += paid;

      const row = document.createElement("tr");
      row.className = "slot" + (isBooked ? " booked" : "");

      row.innerHTML = `
        <td>${day} (${dateStr})</td>
        <td>${slot.start}</td>
        <td>${slot.end}</td>
        <td><button onclick="toggleBooking(this, '${slotKey}')">${isBooked ? "Booked" : "Free"}</button></td>
        <td><input type="text" class="comment" value="${commentText}" 
                   onfocus="clearPlaceholder(this)" 
                   onblur="saveComment(this, '${slotKey}')" /></td>
        <td><input type="number" class="worked" value="${worked}" 
                   onblur="saveWorked(this, '${slotKey}')" /></td>
        <td class="earned">${earned}</td>
        <td><input type="number" class="paid" value="${paid}" 
                   onblur="savePaid(this, '${slotKey}')" /></td>
        <td class="toBePaid">${toBePaid}</td>
      `;
      tbody.appendChild(row);
    });

    const totalEarned = (0.4 * totalWorked).toFixed(2);

    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th>Day + Date</th>
        <th>Start</th>
        <th>End</th>
        <th>Status</th>
        <th>Comment</th>
        <th>Worked (Total: ${totalWorked.toFixed(2)})</th>
        <th>Earned (Total: ${totalEarned})</th>
        <th>Paid (Total: ${totalPaid.toFixed(2)})</th>
        <th>To-be-paid</th>
      </tr>
    `;
    table.appendChild(thead);
    table.appendChild(tbody);
    container.appendChild(table);
  });
}
function saveWorked(input, key) {
  const worked = parseFloat(input.value) || 0;
  const existing = JSON.parse(localStorage.getItem(key)) || {};
  existing.worked = worked;
  existing.earned = (0.4 * worked).toFixed(2);
  localStorage.setItem(key, JSON.stringify(existing));
  renderSchedule(document.getElementById("duration").value); // refresh row
}

function savePaid(input, key) {
  const paid = parseFloat(input.value) || 0;
  const existing = JSON.parse(localStorage.getItem(key)) || {};
  existing.paid = paid;
  if (existing.earned) {
    existing.toBePaid = (parseFloat(existing.earned) - paid).toFixed(2);
  }
  localStorage.setItem(key, JSON.stringify(existing));
  renderSchedule(document.getElementById("duration").value); // refresh row
}
function toggleBooking(button, key) {
  const row = button.closest("tr");
  const isBooked = row.classList.toggle("booked");
  button.textContent = isBooked ? "Booked" : "Free";

  const existing = JSON.parse(localStorage.getItem(key)) || {};
  existing.booked = isBooked;
  localStorage.setItem(key, JSON.stringify(existing));
}


function saveComment(input, key) {
  const value = input.value.trim();
  const existing = JSON.parse(localStorage.getItem(key)) || {};
  existing.comment = value || "Add comment";
  localStorage.setItem(key, JSON.stringify(existing));
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

function toggleCompactMode() {
  const container = document.getElementById("schedule-container");
  const isCompact = document.getElementById("compactToggle").checked;
  container.classList.toggle("compact", isCompact);
}

function savePreviousLeftToPay(input) {
  const value = parseFloat(input.value) || 0;
  localStorage.setItem("previousLeftToPay", value.toFixed(2));
  renderSchedule(document.getElementById("duration").value); // refresh summary
}

function clearAllWeek() {
  const preserved = localStorage.getItem("previousLeftToPay");

  // Remove all keys except "previousLeftToPay"
  Object.keys(localStorage).forEach(key => {
    if (key !== "previousLeftToPay") {
      localStorage.removeItem(key);
    }
  });

  // Restore preserved value
  if (preserved !== null) {
    localStorage.setItem("previousLeftToPay", preserved);
  }

  renderSchedule(document.getElementById("duration").value); // refresh view
}