const DEFAULT_PROFILE = {
    stage: 'modere',
    vision: 'leger',
    motor: 'leger',
    themes: ['famille', 'quotidien'],
    attention: '5'
};

const LABELS = {
    stage: {
        leger: 'stimulation douce avec davantage de choix possibles',
        modere: 'repères concrets et rythme apaisé',
        avance: 'formats très courts avec repères visuels forts'
    },
    vision: {
        leger: 'texte confortable',
        modere: 'contraste renforcé',
        important: 'grands repères visuels et cibles larges'
    },
    motor: {
        leger: 'interactions simples',
        modere: 'zones tactiles très larges',
        important: 'peu de gestes et beaucoup de temps'
    },
    themes: {
        famille: 'famille',
        quotidien: 'quotidien',
        musique: 'musique',
        enfance: 'enfance',
        metier: 'métier',
        lieux: 'lieux connus'
    }
};

function getCurrentPatient() {
    return localStorage.getItem('selectedPatient') || 'Marcel';
}

function getStorageKey(patient) {
    return `mc_profile_${patient}`;
}

function loadStoredProfile(patient) {
    try {
        const raw = localStorage.getItem(getStorageKey(patient));
        return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : { ...DEFAULT_PROFILE };
    } catch (error) {
        return { ...DEFAULT_PROFILE };
    }
}

function saveStoredProfile(patient, profile) {
    localStorage.setItem(getStorageKey(patient), JSON.stringify(profile));
}

function setActiveButton(group, value) {
    group.querySelectorAll('.chip').forEach((chip) => {
        chip.classList.toggle('active', chip.dataset.value === value);
    });
}

function updateSummary(profile) {
    const summary = document.getElementById('profile-summary');
    if (!summary) return;

    const themes = profile.themes.length
        ? profile.themes.map((theme) => LABELS.themes[theme] || theme).join(', ')
        : 'aucun thème prioritaire';

    summary.innerHTML = `
        <p><strong>Posture conseillée :</strong> ${LABELS.stage[profile.stage]}.</p>
        <p><strong>Repères visuels :</strong> ${LABELS.vision[profile.vision]}.</p>
        <p><strong>Interactions :</strong> ${LABELS.motor[profile.motor]}.</p>
        <p><strong>Thèmes à privilégier :</strong> ${themes}.</p>
        <p><strong>Durée maximale conseillée :</strong> ${profile.attention} minutes.</p>
    `;
}

function applyProfileToPage(profile) {
    document.querySelectorAll('[data-field="stage"], [data-field="vision"], [data-field="motor"], [data-field="attention"]').forEach((group) => {
        const field = group.dataset.field;
        setActiveButton(group, profile[field]);
    });

    document.querySelectorAll('#themes-group .chip').forEach((chip) => {
        chip.classList.toggle('active', profile.themes.includes(chip.dataset.theme));
    });

    updateSummary(profile);
}

function bindSingleChoice(profile) {
    document.querySelectorAll('[data-field]').forEach((group) => {
        group.addEventListener('click', (event) => {
            const chip = event.target.closest('.chip');
            if (!chip) return;

            const field = group.dataset.field;
            profile[field] = chip.dataset.value;
            setActiveButton(group, profile[field]);
            updateSummary(profile);
        });
    });
}

function bindThemeChoices(profile) {
    const themesGroup = document.getElementById('themes-group');
    if (!themesGroup) return;

    themesGroup.addEventListener('click', (event) => {
        const chip = event.target.closest('.chip');
        if (!chip) return;

        const theme = chip.dataset.theme;
        if (profile.themes.includes(theme)) {
            if (profile.themes.length === 1) return;
            profile.themes = profile.themes.filter((item) => item !== theme);
        } else {
            profile.themes.push(theme);
        }

        chip.classList.toggle('active', profile.themes.includes(theme));
        updateSummary(profile);
    });
}

function updatePageForPatient(patient, profile) {
    const patientName = document.getElementById('patient-name');
    if (patientName) patientName.textContent = patient;

    applyProfileToPage(profile);

    const saveStatus = document.getElementById('save-status');
    if (saveStatus) saveStatus.textContent = '';
}

document.addEventListener('DOMContentLoaded', () => {
    let currentPatient = getCurrentPatient();
    let currentProfile = loadStoredProfile(currentPatient);

    bindSingleChoice(currentProfile);
    bindThemeChoices(currentProfile);
    updatePageForPatient(currentPatient, currentProfile);

    const saveButton = document.getElementById('btn-save');
    const saveStatus = document.getElementById('save-status');

    if (saveButton) {
        saveButton.addEventListener('click', () => {
            saveStoredProfile(currentPatient, currentProfile);
            if (saveStatus) {
                saveStatus.textContent = `Profil de ${currentPatient} enregistré pour les prochaines séances.`;
            }
        });
    }

    window.addEventListener('patientChanged', (event) => {
        currentPatient = event.detail;
        currentProfile = loadStoredProfile(currentPatient);
        updatePageForPatient(currentPatient, currentProfile);
    });
});
