document.addEventListener('DOMContentLoaded', () => {
    const selector = document.getElementById('persona-selector');
    const nameDisplays = document.querySelectorAll('.patient-name-display');
    const recoTitle = document.getElementById('family-reco-title');
    const recoText = document.getElementById('family-reco-text');
    const themeList = document.getElementById('family-theme-list');
    const themeCopy = document.getElementById('family-theme-copy');
    const guidanceList = document.getElementById('family-guidance-list');
    const themeLabels = {
        famille: 'famille',
        quotidien: 'quotidien',
        musique: 'musique',
        enfance: 'enfance',
        metier: 'métier',
        lieux: 'lieux connus'
    };

    const savedPatient = localStorage.getItem('selectedPatient') || 'Marcel';
    selector.value = savedPatient;
    updatePageContent(savedPatient);

    selector.addEventListener('change', (e) => {
        const newPatient = e.target.value;
        localStorage.setItem('selectedPatient', newPatient);
        sessionStorage.setItem('activePatient', newPatient.toLowerCase());
        updatePageContent(newPatient);
    });

    function updatePageContent(name) {
        nameDisplays.forEach(span => {
            span.textContent = name;
        });

        const rawProfile = localStorage.getItem(`mc_profile_${name}`);
        const profile = rawProfile ? JSON.parse(rawProfile) : { themes: ['famille', 'quotidien'], stage: 'modere' };
        const themes = profile.themes?.length ? profile.themes : ['famille', 'quotidien'];

        if (themeList) {
            themeList.innerHTML = themes
                .map((theme) => `<span class="family-theme">${themeLabels[theme] || theme}</span>`)
                .join('');
        }

        if (themes.includes('musique')) {
            recoTitle.textContent = 'Commencer par une musique connue';
            recoText.textContent = `Pour ${name}, une musique familière peut aider à entrer dans l'échange avant même de chercher des mots précis.`;
        } else if (themes.includes('famille') || themes.includes('enfance')) {
            recoTitle.textContent = 'Commencer par une photo très familière';
            recoText.textContent = `Pour ${name}, un souvenir de famille simple et lisible peut ouvrir une conversation sans pression.`;
        } else {
            recoTitle.textContent = 'Commencer par un repère du quotidien';
            recoText.textContent = `Pour ${name}, un souvenir concret ou un lieu bien connu peut aider à démarrer la séance sereinement.`;
        }

        if (themeCopy) {
            themeCopy.textContent = `Les thèmes enregistrés pour ${name} peuvent servir de point d'entrée doux. L'objectif est d'ouvrir un moment partagé, pas d'obtenir une réponse exacte.`;
        }

        if (guidanceList) {
            guidanceList.innerHTML = buildGuidance(profile.stage || 'modere')
                .map((item) => `<li>${item}</li>`)
                .join('');
        }
    }

    function buildGuidance(stage) {
        if (stage === 'avance') {
            return [
                'Laisser plus de silence entre deux relances et rester sur un seul repère à la fois.',
                'Nommer un détail visible plutôt que poser plusieurs questions.',
                'Passer au souvenir suivant dès que la fatigue ou la gêne apparaît.'
            ];
        }

        if (stage === 'leger') {
            return [
                'Commencer par un souvenir concret, puis laisser la conversation s élargir.',
                'Suivre ce qui revient spontanément plutôt que vérifier la précision du souvenir.',
                'Terminer sur un support agréable pour garder une trace positive du moment.'
            ];
        }

        return [
            'Laisser quelques secondes de silence avant de relancer.',
            'Privilégier les questions ouvertes ou les commentaires doux.',
            'Passer au souvenir suivant si une gêne apparaît.'
        ];
    }
});
