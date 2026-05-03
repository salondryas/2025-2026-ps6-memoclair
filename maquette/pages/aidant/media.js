document.addEventListener('DOMContentLoaded', function () {
    const galleryGrid = document.getElementById('gallery-grid');
    const galleryEmpty = document.getElementById('gallery-empty');
    const galleryCount = document.getElementById('gallery-count');
    const fileInput = document.getElementById('file-input');
    const dropzone = document.getElementById('dropzone');
    const themesEl = document.getElementById('patient-themes');
    const patientThemeNameEl = document.getElementById('patient-theme-name');

    const themeLabels = {
        famille: 'famille',
        quotidien: 'quotidien',
        musique: 'musique',
        enfance: 'enfance',
        metier: 'métier',
        lieux: 'lieux connus'
    };

    // --- LOGIQUE PATIENT ---

    function getCurrentPatient() {
        return localStorage.getItem('selectedPatient') || 'Marcel';
    }

    // Charger les médias sauvegardés pour le patient
    function loadMedia() {
        const patient = getCurrentPatient();
        document.getElementById('patient-name').textContent = patient;
        if (patientThemeNameEl) patientThemeNameEl.textContent = patient;

        const savedMedia = localStorage.getItem(`media_${patient}`);
        galleryGrid.innerHTML = ''; // Vider la galerie actuelle

        if (savedMedia) {
            const items = JSON.parse(savedMedia);
            items.forEach(item => renderThumb(item.name, item.type));
        } else {
            // Optionnel: charger des données par défaut si vide
            if(patient === 'Marcel') {
                renderThumb('Jardin 2019', 'image');
                renderThumb('Famille Noël', 'image');
            }
        }
        updateThemes(patient);
        updateCount();
    }

    // Sauvegarder l'état actuel de la galerie pour le patient
    function saveMedia() {
        const patient = getCurrentPatient();
        const items = [];
        galleryGrid.querySelectorAll('.thumb').forEach(thumb => {
            items.push({
                name: thumb.querySelector('.thumb__label').textContent,
                type: thumb.classList.contains('thumb--audio') ? 'audio' : 'image'
            });
        });
        localStorage.setItem(`media_${patient}`, JSON.stringify(items));
    }

    // --- RENDU UI ---

    function renderThumb(name, type) {
        const isAudio = type === 'audio';
        const emoji = isAudio ? '🎵' : (name.includes('Famille') ? '👨‍👩‍👧' : '📷');

        const div = document.createElement('div');
        div.className = 'thumb' + (isAudio ? ' thumb--audio' : '');
        div.innerHTML = `
            <div class="thumb__media">${emoji}</div>
            <p class="thumb__label">${name}</p>
            <button class="thumb__remove" title="Supprimer">×</button>
        `;
        galleryGrid.appendChild(div);
    }

    function updateCount() {
        const thumbs = galleryGrid.querySelectorAll('.thumb');
        galleryCount.textContent = '(' + thumbs.length + ')';
        galleryEmpty.hidden = thumbs.length > 0;
    }

    function updateThemes(patient) {
        if (!themesEl) return;

        const rawProfile = localStorage.getItem(`mc_profile_${patient}`);
        if (!rawProfile) {
            themesEl.textContent = 'famille, quotidien';
            return;
        }

        try {
            const profile = JSON.parse(rawProfile);
            const labels = (profile.themes || ['famille', 'quotidien']).map((theme) => themeLabels[theme] || theme);
            themesEl.textContent = labels.join(', ');
        } catch (error) {
            themesEl.textContent = 'famille, quotidien';
        }
    }

    // --- ÉVÉNEMENTS ---

    // Écouter le changement de patient depuis la navbar
    window.addEventListener('patientChanged', () => {
        loadMedia();
    });

    // Suppression (avec sauvegarde automatique)
    galleryGrid.addEventListener('click', function (e) {
        const removeBtn = e.target.closest('.thumb__remove');
        if (!removeBtn) return;
        removeBtn.closest('.thumb').remove();
        updateCount();
        saveMedia();
    });

    // Simulation d'upload (modifiée pour sauvegarder à la fin)
    function simulateUpload(files) {
        // ... (ton code de progression actuel) ...
        // À la fin de l'intervalle :
        setTimeout(function () {
            Array.from(files).forEach(file => {
                const type = file.type.startsWith('audio') ? 'audio' : 'image';
                const name = file.name.replace(/\.[^.]+$/, '');
                renderThumb(name, type);
            });
            updateCount();
            saveMedia(); // On sauvegarde dans le localStorage du patient
        }, 800);
    }

    // Initialisation
    loadMedia();

    // Ré-attacher tes événements de Drag & Drop ici...
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        simulateUpload(e.dataTransfer.files);
    });
    fileInput.addEventListener('change', function() { simulateUpload(this.files); });
});
