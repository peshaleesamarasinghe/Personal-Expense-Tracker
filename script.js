const form = document.getElementById("transactionForm");
const typeInput = document.getElementById("type");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");

const filterInput = document.getElementById("filter");
const searchInput = document.getElementById("search");
const tableBody = document.getElementById("transactionTable");
const message = document.getElementById("message");

const storageKey = "personalExpenseTracker";
let transactions = [];

// Restore transactions previously saved in this browser.
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");

  if (!Array.isArray(saved)) {
    throw new Error("Invalid saved data");
  }

  transactions = saved;
} catch {
  message.textContent = "Saved transactions could not be loaded.";
}

// Format integer cents as LKR.
function formatMoney(cents) {
  return "LKR " + (cents / 100).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Set the date using the user's local calendar date.
function setToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  dateInput.value = `${year}-${month}-${day}`;
}

function clearForm() {
  form.reset();
  setToday();
}

// Save first, then update the displayed information.
function saveTransactions(nextTransactions) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(nextTransactions));
    transactions = nextTransactions;
    message.textContent = "";
    render();
    return true;
  } 
  
  catch {
    message.textContent =
      "Unable to save. Please check your browser storage settings.";
    return false;
  }
}

function updateTotals() {
  let income = 0;
  let expenses = 0;

  for (const transaction of transactions) {
    if (transaction.type === "income") {
      income += transaction.amount;
    } else {
      expenses += transaction.amount;
    }
  }

  document.getElementById("totalIncome").textContent =
    formatMoney(income);

  document.getElementById("totalExpenses").textContent =
    formatMoney(expenses);

  document.getElementById("balance").textContent =
    formatMoney(income - expenses);
}

function renderTable() {
  tableBody.replaceChildren();

  const selectedType = filterInput.value;
  const searchText = searchInput.value.trim().toLowerCase();

  const visibleTransactions = transactions.filter(transaction => {
    const matchesType =
      selectedType === "all" || transaction.type === selectedType;

    const matchesSearch =
      transaction.description.toLowerCase().includes(searchText) ||
      transaction.category.toLowerCase().includes(searchText);

    return matchesType && matchesSearch;
  });

  if (visibleTransactions.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 6;
    cell.textContent = "No transactions found.";
    row.appendChild(cell);
    tableBody.appendChild(row);
    return;
  }

  for (const transaction of visibleTransactions) {
    const row = document.createElement("tr");
    const sign = transaction.type === "income" ? "+" : "-";

    const values = [
      transaction.date,
      transaction.description,
      transaction.type === "income" ? "Income" : "Expense",
      transaction.category,
      `${sign} ${formatMoney(transaction.amount)}`
    ];

    values.forEach((value, index) => {
      const cell = document.createElement("td");
      cell.textContent = value;

      if (index === 2 || index === 4) {
        cell.className = transaction.type;
      }

      row.appendChild(cell);
    });

    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");

    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.className = "delete-button";

    deleteButton.addEventListener("click", () => {
      const remaining = transactions.filter(
        item => item.id !== transaction.id
      );

      saveTransactions(remaining);
    });

    actionCell.appendChild(deleteButton);
    row.appendChild(actionCell);
    tableBody.appendChild(row);
  }
}

function render() {
  updateTotals();
  renderTable();
}

form.addEventListener("submit", event => {
  event.preventDefault();

  const description = descriptionInput.value.trim();
  const amount = Number(amountInput.value);
  const amountInCents = Math.round(amount * 100);

  if (
    !form.checkValidity() ||
    !description ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !Number.isSafeInteger(amountInCents) ||
    amountInCents <= 0
  ) {
    message.textContent =
      "Complete all fields and enter a valid amount greater than zero.";
    return;
  }

  const transaction = {
    id: crypto.randomUUID(),
    type: typeInput.value,
    description: description,
    amount: amountInCents,
    category: categoryInput.value,
    date: dateInput.value
  };

  if (saveTransactions([...transactions, transaction])) {
    clearForm();
  }
});

document.getElementById("clearButton").addEventListener("click", () => {
  clearForm();
  message.textContent = "";
});

filterInput.addEventListener("change", renderTable);
searchInput.addEventListener("input", renderTable);

setToday();
render();