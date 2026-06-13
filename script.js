// Smooth console effect
console.log("Bantunala IT Consultant loaded 🚀");

// Simple scroll effect (optional upgrade)
window.addEventListener("scroll", () => {
  document.querySelectorAll(".card").forEach(card => {
    const rect = card.getBoundingClientRect();
    if (rect.top < window.innerHeight - 100) {
      card.style.opacity = 1;
    }
  });
});