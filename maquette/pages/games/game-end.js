// pages/games/game-end.js

document.addEventListener('DOMContentLoaded', function () {
    var startTime = sessionStorage.getItem('mc_sessionStart');
    var durationEl = document.getElementById('end-duration');
    var durationText = document.getElementById('duration-text');
    var sessionTitleEl = document.getElementById('end-session-title');
    var sessionNoteEl = document.getElementById('end-session-note');
    var subtitleEl = document.getElementById('end-subtitle');
    var patientName = localStorage.getItem('selectedPatient') || 'votre proche';
    var lastSessionTitle = sessionStorage.getItem('mc_lastSessionTitle');
    var lastSessionNote = sessionStorage.getItem('mc_lastSessionNote');

    if (subtitleEl) {
        subtitleEl.textContent = 'La séance de ' + patientName + ' est terminée.';
    }

    if (sessionTitleEl && lastSessionTitle) {
        sessionTitleEl.textContent = lastSessionTitle;
    }

    if (sessionNoteEl && lastSessionNote) {
        sessionNoteEl.textContent = lastSessionNote;
    }

    if (startTime && durationEl && durationText) {
        var elapsed = Math.round((Date.now() - parseInt(startTime)) / 60000);
        if (elapsed < 1) elapsed = 1;
        durationText.textContent = 'Session : ' + elapsed + ' min';
        durationEl.hidden = false;
    }

    // Nettoyer le sessionStorage de session
    sessionStorage.removeItem('mc_sessionStart');
    sessionStorage.removeItem('mc_questionCount');
    sessionStorage.removeItem('mc_lastSessionTitle');
    sessionStorage.removeItem('mc_lastSessionNote');
    sessionStorage.removeItem('mc_duoMode');
});
