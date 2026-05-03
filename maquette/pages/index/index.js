// index.js

document.addEventListener('DOMContentLoaded', () => {
    // Initialisation du patient par défaut si vide
    if (!localStorage.getItem('selectedPatient')) {
        localStorage.setItem('selectedPatient', 'Marcel');
    }

    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        // Feedback au clic (enfoncement léger)
        card.addEventListener('mousedown', () => {
            card.style.transform = "translateY(-5px) scale(0.98)";
        });

        card.addEventListener('mouseup', () => {
            card.style.transform = "translateY(-10px) scale(1)";
        });
    });

    console.log("Accueil MemoClair : pret.");
});
