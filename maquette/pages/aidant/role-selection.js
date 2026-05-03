// role-selection.js

document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.role-card');
    const currentPatient = localStorage.getItem('selectedPatient') || 'Marcel';

    cards.forEach(card => {
        card.addEventListener('click', function(e) {
            const role = this.id === 'role-medical' ? 'soignant' : 'famille';
            localStorage.setItem('userRole', role);
            this.style.transform = "scale(0.98) translateY(0)";
        });
    });

    const subtitle = document.querySelector('.subtitle');
    if (subtitle) {
        subtitle.insertAdjacentText(
            'beforeend',
            ` Le patient actuellement sélectionné est ${currentPatient}.`
        );
    }

    document.querySelectorAll('[data-current-patient]').forEach((node) => {
        node.textContent = currentPatient;
    });
});
