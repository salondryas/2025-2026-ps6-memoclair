document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.patient-card');
    const lastPatient = localStorage.getItem('selectedPatient') || 'Marcel';
    const lastPatientEl = document.getElementById('last-patient');

    if (lastPatientEl) {
        lastPatientEl.textContent = lastPatient;
    }

    cards.forEach((card) => {
        if (card.dataset.patient === lastPatient) {
            card.classList.add('is-last');
        }

        card.addEventListener('click', () => {
            const patientName = card.dataset.patient;
            const patientId = card.dataset.id;

            localStorage.setItem('selectedPatient', patientName);
            sessionStorage.setItem('activePatient', patientId);
            window.location.href = 'games.html';
        });
    });
});
