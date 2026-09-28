/* UI HELPERS */

function showElement(element) {
  if (!element) {
    return;
  }

  element.classList.remove("d-none");
}

function hideElement(element) {
  if (!element) {
    return;
  }

  element.classList.add("d-none");
}

function setElementText(element, text) {
  if (!element) {
    return;
  }

  element.textContent = text;
}

function clearElement(element) {
  if (!element) {
    return;
  }

  element.innerHTML = "";
}

function showToastMessage(message) {
  console.log(message);
}

/* ESCAPE HTML */
/* Untrusted text (project/task titles, comments, member names, activity
   messages, etc. all come from other users' Firestore documents) must be
   escaped before it is interpolated into an innerHTML template. */

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, function (character) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[character];
  });
}

export {
  showElement,
  hideElement,
  setElementText,
  clearElement,
  showToastMessage,
  escapeHtml,
};
