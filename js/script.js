
const expenseForm = document.getElementById("expense-form");
const expenseTitle = document.getElementById("expense-title");
const expenseAmount = document.getElementById("expense-amount");
const expenseCategory = document.getElementById("expense-category");
const expenseDate = document.getElementById("expense-date");
const expenseId = document.getElementById("expense-id");

const totalExpenses = document.getElementById("total-expenses");
const monthlyExpenses = document.getElementById("monthly-expenses");
const transactionCount = document.getElementById("transaction-count");

const expenseList = document.getElementById("expense-list");
const searchInput = document.getElementById("search-expense");
const categoryFilter = document.getElementById("filter-category");
const sortSelect = document.getElementById("sort-expenses");

const budgetSpent = document.getElementById("budget-spent");
const budgetProgress = document.getElementById("budget-progress-fill");
const budgetMessage = document.getElementById("budget-message");

const categoryBreakdown = document.getElementById("category-breakdown");
const spendingChart = document.getElementById("spending-chart");

const formHeading = document.getElementById("form-heading");
const saveButton = document.getElementById("save-expense-btn");
const cancelButton = document.getElementById("cancel-edit-btn");

const addExpenseButton = document.getElementById("add-expense-btn");
const exportButton = document.getElementById("export-csv-btn");
const themeToggle = document.getElementById("theme-toggle");

const budgetLimit = 20000;
const storageKey = "spendwise-expenses";
const themeKey = "spendwise-theme";

let expenses = [];

const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
});

function formatCurrency(amount) {
    return currencyFormatter.format(amount);
}

function getLocalDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function isValidDate(date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return false;
    }

    const parsedDate = new Date(date + "T00:00:00");

    return !Number.isNaN(parsedDate.getTime()) &&
        parsedDate.getFullYear() === Number(date.slice(0, 4)) &&
        parsedDate.getMonth() + 1 === Number(date.slice(5, 7)) &&
        parsedDate.getDate() === Number(date.slice(8, 10));
}

function formatDate(date) {
    return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function generateId() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return Date.now().toString() + Math.random().toString(16).slice(2);
}

function saveExpenses() {
    try {
        localStorage.setItem(storageKey, JSON.stringify(expenses));
    } catch (error) {
        alert("Unable to save expenses. Your browser storage may be full or disabled.");
    }
}

function loadExpenses() {
    try {
        const savedExpenses = JSON.parse(localStorage.getItem(storageKey)) || [];

        if (!Array.isArray(savedExpenses)) {
            expenses = [];
            return;
        }

        expenses = savedExpenses.filter(expense => {
            return expense &&
                typeof expense.id === "string" &&
                typeof expense.title === "string" &&
                expense.title.trim() !== "" &&
                typeof expense.amount === "number" &&
                Number.isFinite(expense.amount) &&
                expense.amount > 0 &&
                typeof expense.category === "string" &&
                isValidDate(expense.date);
        });
    } catch (error) {
        expenses = [];
    }
}

function getCurrentMonthExpenses() {
    const currentMonth = getLocalDate().slice(0, 7);

    return expenses.filter(expense => {
        return expense.date.startsWith(currentMonth);
    });
}

function updateSummary() {
    const total = expenses.reduce((sum, expense) => {
        return sum + expense.amount;
    }, 0);

    const monthlyTotal = getCurrentMonthExpenses().reduce((sum, expense) => {
        return sum + expense.amount;
    }, 0);

    totalExpenses.textContent = formatCurrency(total);
    monthlyExpenses.textContent = formatCurrency(monthlyTotal);
    transactionCount.textContent = expenses.length;

    budgetSpent.textContent = formatCurrency(monthlyTotal);

    const percentage = (monthlyTotal / budgetLimit) * 100;
    const progressWidth = Math.min(percentage, 100);

    budgetProgress.style.width = `${progressWidth}%`;

    if (percentage >= 100) {
        budgetProgress.style.background = "#ef4444";
        budgetMessage.textContent =
            `You have exceeded your monthly budget by ${formatCurrency(monthlyTotal - budgetLimit)}.`;
    } else if (percentage >= 80) {
        budgetProgress.style.background = "#f59e0b";
        budgetMessage.textContent =
            `You have used ${percentage.toFixed(1)}% of your monthly budget. Spend carefully.`;
    } else {
        budgetProgress.style.background = "";
        budgetMessage.textContent =
            `${formatCurrency(budgetLimit - monthlyTotal)} remaining in your monthly budget.`;
    }

    budgetProgress.setAttribute("role", "progressbar");
    budgetProgress.setAttribute("aria-valuemin", "0");
    budgetProgress.setAttribute("aria-valuemax", "100");
    budgetProgress.setAttribute("aria-valuenow", Math.round(progressWidth));
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

function renderExpenses() {
    const searchText = searchInput.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value;
    const sortType = sortSelect.value;

    let filteredExpenses = expenses.filter(expense => {
        const matchesSearch =
            expense.title.toLowerCase().includes(searchText) ||
            expense.category.toLowerCase().includes(searchText);

        const matchesCategory =
            selectedCategory === "all" ||
            expense.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    filteredExpenses.sort((a, b) => {
        if (sortType === "newest") {
            return b.date.localeCompare(a.date);
        }

        if (sortType === "oldest") {
            return a.date.localeCompare(b.date);
        }

        if (sortType === "highest") {
            return b.amount - a.amount;
        }

        if (sortType === "lowest") {
            return a.amount - b.amount;
        }

        return 0;
    });

    expenseList.replaceChildren();

    if (filteredExpenses.length === 0) {
        const emptyState = createElement("div", "empty-state");

        const icon = createElement("div", "empty-state-icon", "＋");
        const heading = createElement("h3", "", "No expenses found");
        const message = createElement(
            "p",
            "",
            expenses.length === 0
                ? "Add your first expense to start tracking your money."
                : "Try changing your search or category filter."
        );

        emptyState.append(icon, heading, message);
        expenseList.appendChild(emptyState);

        return;
    }

    filteredExpenses.forEach(expense => {
        const row = createElement("div", "expense-item");

        const title = createElement("span", "expense-name", expense.title);
        const category = createElement(
            "span",
            "expense-category-badge",
            expense.category
        );
        const date = createElement(
            "span",
            "expense-date",
            formatDate(expense.date)
        );
        const amount = createElement(
            "span",
            "expense-amount",
            formatCurrency(expense.amount)
        );

        const actions = createElement("div", "expense-actions");

        const editButton = createElement("button", "action-button", "✎");
        editButton.type = "button";
        editButton.setAttribute("aria-label", `Edit ${expense.title}`);
        editButton.addEventListener("click", () => {
            editExpense(expense.id);
        });

        const deleteButton = createElement(
            "button",
            "action-button delete",
            "×"
        );
        deleteButton.type = "button";
        deleteButton.setAttribute("aria-label", `Delete ${expense.title}`);
        deleteButton.addEventListener("click", () => {
            deleteExpense(expense.id);
        });

        actions.append(editButton, deleteButton);
        row.append(title, category, date, amount, actions);

        expenseList.appendChild(row);
    });
}

function addExpense(event) {
    event.preventDefault();

    const title = expenseTitle.value.trim();
    const amount = Number(expenseAmount.value);
    const category = expenseCategory.value;
    const date = expenseDate.value;

    if (!title) {
        alert("Please enter an expense name.");
        expenseTitle.focus();
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid amount greater than zero.");
        expenseAmount.focus();
        return;
    }

    if (!category) {
        alert("Please select an expense category.");
        expenseCategory.focus();
        return;
    }

    if (!isValidDate(date)) {
        alert("Please select a valid expense date.");
        expenseDate.focus();
        return;
    }

    const existingId = expenseId.value;

    if (existingId) {
        const expenseIndex = expenses.findIndex(expense => {
            return expense.id === existingId;
        });

        if (expenseIndex !== -1) {
            expenses[expenseIndex] = {
                ...expenses[expenseIndex],
                title,
                amount,
                category,
                date
            };
        }
    } else {
        expenses.push({
            id: generateId(),
            title,
            amount,
            category,
            date
        });
    }

    saveExpenses();
    updateDashboard();
    resetForm();
}

function editExpense(id) {
    const expense = expenses.find(item => item.id === id);

    if (!expense) {
        return;
    }

    expenseId.value = expense.id;
    expenseTitle.value = expense.title;
    expenseAmount.value = expense.amount;
    expenseCategory.value = expense.category;
    expenseDate.value = expense.date;

    formHeading.textContent = "Edit Expense";
    saveButton.textContent = "Update Expense";
    cancelButton.style.display = "inline-flex";

    document.getElementById("expense-form-section").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    expenseTitle.focus();
}

function deleteExpense(id) {
    const expense = expenses.find(item => item.id === id);

    if (!expense) {
        return;
    }

    const confirmed = confirm(
        `Are you sure you want to delete "${expense.title}"?`
    );

    if (!confirmed) {
        return;
    }

    expenses = expenses.filter(item => item.id !== id);

    saveExpenses();
    updateDashboard();

    if (expenseId.value === id) {
        resetForm();
    }
}

function resetForm() {
    expenseForm.reset();
    expenseId.value = "";

    formHeading.textContent = "Add New Expense";
    saveButton.textContent = "Save Expense";
    cancelButton.style.display = "none";

    expenseDate.value = getLocalDate();
}

function updateCategoryBreakdown() {
    const monthlyExpensesList = getCurrentMonthExpenses();

    categoryBreakdown.replaceChildren();

    if (monthlyExpensesList.length === 0) {
        categoryBreakdown.appendChild(
            createElement(
                "p",
                "empty-message",
                "Add expenses this month to see your category breakdown."
            )
        );

        return;
    }

    const categoryTotals = {};

    monthlyExpensesList.forEach(expense => {
        categoryTotals[expense.category] =
            (categoryTotals[expense.category] || 0) + expense.amount;
    });

    const total = monthlyExpensesList.reduce((sum, expense) => {
        return sum + expense.amount;
    }, 0);

    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1]);

    sortedCategories.forEach(([category, amount]) => {
        const percentage = (amount / total) * 100;

        const item = createElement("div", "category-item");
        const info = createElement("div", "category-info");

        const name = createElement("span", "", category);
        const value = createElement(
            "span",
            "",
            `${formatCurrency(amount)} (${percentage.toFixed(1)}%)`
        );

        const progress = createElement("div", "category-progress");
        const fill = createElement("div", "category-progress-fill");

        fill.style.width = `${percentage}%`;

        info.append(name, value);
        progress.appendChild(fill);
        item.append(info, progress);

        categoryBreakdown.appendChild(item);
    });
}

function updateSpendingChart() {
    spendingChart.replaceChildren();

    const now = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");

        months.push({
            key: `${year}-${month}`,
            label: date.toLocaleDateString("en-IN", {
                month: "short"
            }),
            total: 0
        });
    }

    expenses.forEach(expense => {
        const month = months.find(item => {
            return item.key === expense.date.slice(0, 7);
        });

        if (month) {
            month.total += expense.amount;
        }
    });

    const maxValue = Math.max(...months.map(month => month.total), 1);

    const svg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
    );

    svg.setAttribute("viewBox", "0 0 600 230");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "230");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Monthly spending for the last six months");

    months.forEach((month, index) => {
        const x = 38 + index * 94;
        const barHeight = (month.total / maxValue) * 135;
        const y = 175 - barHeight;

        const bar = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
        );

        bar.setAttribute("x", x);
        bar.setAttribute("y", y);
        bar.setAttribute("width", "45");
        bar.setAttribute("height", Math.max(barHeight, 3));
        bar.setAttribute("rx", "7");
        bar.setAttribute(
            "fill",
            index === 5 ? "#10b981" : "#8b5cf6"
        );
        bar.setAttribute("opacity", month.total === 0 ? "0.2" : "0.9");

        const label = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
        );

        label.setAttribute("x", x + 22);
        label.setAttribute("y", "202");
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("fill", "currentColor");
        label.setAttribute("font-size", "12");
        label.textContent = month.label;

        const amountLabel = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
        );

        amountLabel.setAttribute("x", x + 22);
        amountLabel.setAttribute("y", Math.max(y - 8, 14));
        amountLabel.setAttribute("text-anchor", "middle");
        amountLabel.setAttribute("fill", "currentColor");
        amountLabel.setAttribute("font-size", "9");
        amountLabel.textContent = month.total > 0
            ? Math.round(month.total).toLocaleString("en-IN")
            : "";

        const title = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "title"
        );

        title.textContent = `${month.label}: ${formatCurrency(month.total)}`;

        bar.appendChild(title);
        svg.append(bar, amountLabel, label);
    });

    spendingChart.appendChild(svg);
}

function updateDashboard() {
    updateSummary();
    renderExpenses();
    updateCategoryBreakdown();
    updateSpendingChart();
}

function exportCSV() {
    if (expenses.length === 0) {
        alert("There are no expenses to export.");
        return;
    }

    const headers = ["Expense", "Category", "Date", "Amount"];

    const rows = expenses.map(expense => {
        return [
            expense.title,
            expense.category,
            expense.date,
            expense.amount
        ];
    });

    const escapeCSV = value => {
        let text = String(value);

        if (/^[=+\-@\t\r]/.test(text)) {
            text = "'" + text;
        }

        return `"${text.replace(/"/g, '""')}"`;
    };

    const csvContent = [
        headers.map(escapeCSV).join(","),
        ...rows.map(row => row.map(escapeCSV).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "spendwise-expenses.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

function loadTheme() {
    try {
        const savedTheme = localStorage.getItem(themeKey);

        if (savedTheme === "light") {
            document.body.classList.add("light-theme");
            themeToggle.textContent = "☾";
        } else {
            document.body.classList.remove("light-theme");
            themeToggle.textContent = "☼";
        }
    } catch (error) {
        document.body.classList.remove("light-theme");
        themeToggle.textContent = "☼";
    }
}

function toggleTheme() {
    document.body.classList.toggle("light-theme");

    const isLight = document.body.classList.contains("light-theme");

    themeToggle.textContent = isLight ? "☾" : "☼";

    try {
        localStorage.setItem(themeKey, isLight ? "light" : "dark");
    } catch (error) {
        alert("Your theme preference could not be saved.");
    }
}

function setupNavigation() {
    const navLinks = document.querySelectorAll(".nav-link");

    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            navLinks.forEach(item => item.classList.remove("active"));
            link.classList.add("active");
        });
    });
}

expenseForm.addEventListener("submit", addExpense);

cancelButton.addEventListener("click", resetForm);

searchInput.addEventListener("input", renderExpenses);

categoryFilter.addEventListener("change", renderExpenses);

sortSelect.addEventListener("change", renderExpenses);

exportButton.addEventListener("click", exportCSV);

themeToggle.addEventListener("click", toggleTheme);

addExpenseButton.addEventListener("click", () => {
    resetForm();

    document.getElementById("expense-form-section").scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    expenseTitle.focus();
});

loadExpenses();
loadTheme();
resetForm();
setupNavigation();
updateDashboard();
