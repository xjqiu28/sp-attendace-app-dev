// Paste your deployed Apps Script Web App URL here:
const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbyiKasAHQVaTZWMROTFV88caPB7jGAtDecnbTj3MVZdAqZs8x9YCcFEkKbwKIiLWOtZEg/exec";

const REQUEST_TIMEOUT_MS = 20000; // 20 seconds

const nameSelect = document.getElementById("name");
const statusEl = document.getElementById("status");

// Wraps fetch with a hard timeout so a stalled connection can never
// leave the UI stuck on "Checking..." forever — it always eventually
// resolves or throws.
async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function loadNames() {
  try {
    const response = await fetchWithTimeout(WEB_APP_URL + "?action=getNames");
    const result = await response.json();
    const names = result.names || [];

    nameSelect.innerHTML = "";

    if (names.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "No names found";
      nameSelect.appendChild(opt);
      return;
    }

    const placeholderOpt = document.createElement("option");
    placeholderOpt.value = "";
    placeholderOpt.textContent = "Select your name";
    nameSelect.appendChild(placeholderOpt);

    names.forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      nameSelect.appendChild(opt);
    });

    nameSelect.disabled = false;
  } catch (err) {
    nameSelect.innerHTML = '<option value="">Couldn\'t load names</option>';
    statusEl.textContent =
      "Couldn't load the name list — check the Web App URL.";
    statusEl.className = "error";
  }
}

loadNames();

async function submitAttendance() {
  const name = nameSelect.value;
  const code = document.getElementById("code").value.trim();
  const submitBtn = document.getElementById("submitBtn");

  if (!name || !code) {
    statusEl.textContent = "Please select your name and enter your personal code.";
    statusEl.className = "error";
    return;
  }

  submitBtn.disabled = true;
  statusEl.textContent = "Checking...";
  statusEl.className = "";

  try {
    // Content-Type text/plain avoids a CORS preflight request, which
    // Apps Script web apps don't handle. The script still parses the
    // body as JSON on its end.
    const response = await fetchWithTimeout(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ name, code }),
    });

    const result = await response.json();

    if (result.success) {
      statusEl.textContent = result.message;
      statusEl.className = "success";
      document.getElementById("code").value = "";
    } else {
      statusEl.textContent = result.error;
      statusEl.className = "error";
    }
  } catch (err) {
    if (err.name === "AbortError") {
      statusEl.textContent =
        "This is taking too long. Please check the sheet before submitting again — your entry may have already gone through.";
    } else {
      statusEl.textContent = "Network error — please try again.";
    }
    statusEl.className = "error";
  } finally {
    submitBtn.disabled = false;
  }
}
