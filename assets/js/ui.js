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


export {
    showElement,
    hideElement,
    setElementText,
    clearElement,
    showToastMessage
};