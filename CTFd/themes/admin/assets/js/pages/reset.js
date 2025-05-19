import "./main";

function reset(event) {
  event.preventDefault();

  const confirmed = confirm("Are you sure you want to reset your CTFd instance?");
  if (confirmed) {
    const form = document.getElementById("reset-ctf-form");
    form.removeEventListener("submit", reset); // remove this handler
    form.submit(); // then submit normally
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("reset-ctf-form");
  form?.addEventListener("submit", reset);
});
