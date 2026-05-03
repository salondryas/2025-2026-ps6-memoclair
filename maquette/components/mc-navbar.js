/**
 * <mc-navbar active="statistics" dir="aidant">
 * active : profile | media | statistics
 * dir    : aidant | statistics  (controls relative paths)
 */
class McNavbar extends HTMLElement {
    static get observedAttributes() { return ['active', 'dir']; }

    connectedCallback() { this._render(); }
    attributeChangedCallback() { this._render(); }

    _render() {
        const active = this.getAttribute('active') || 'statistics';
        const dir    = this.getAttribute('dir')    || 'aidant';

        const isStats  = dir === 'statistics';
        const prefix   = isStats ? '../aidant/' : '';
        const statsHref = isStats ? 'statistics.html' : '../statistics/statistics.html';

        // Chemin vers l'index (relatif selon le dossier d'origine)
        const homeHref = '../index/index.html';

        // Récupération du patient actuel
        const currentPatient = localStorage.getItem('selectedPatient') || 'Marcel';

        const links = [
            { key: 'profile',    href: prefix + 'profile.html',   label: 'Profil'          },
            { key: 'media',      href: prefix + 'media.html',     label: 'Médias'          },
            { key: 'statistics', href: statsHref,                  label: 'Statistiques'    },
            { key: 'home',       href: homeHref,                   label: 'Accueil'         },
        ];

        this.innerHTML = `
<nav class="navbar">
    <a href="${homeHref}" class="navbar__logo" style="text-decoration: none; color: inherit;">MemoClair</a>
    
    <div class="navbar__center">
        <select id="patient-selector" class="patient-select">
            <option value="Marcel" ${currentPatient === 'Marcel' ? 'selected' : ''}>Marcel</option>
            <option value="Jean" ${currentPatient === 'Jean' ? 'selected' : ''}>Jean</option>
            <option value="Paul" ${currentPatient === 'Paul' ? 'selected' : ''}>Paul</option>
        </select>
    </div>

    <div class="navbar__links">
        ${links.map(l =>
            `<a href="${l.href}" class="nav-item${l.key === active ? ' active' : ''}">${l.label}</a>`
        ).join('\n        ')}
    </div>
</nav>`;

        // Logique de changement de patient
        const selector = this.querySelector('#patient-selector');
        if (selector) {
            selector.addEventListener('change', (e) => {
                const newPatient = e.target.value;
                localStorage.setItem('selectedPatient', newPatient);
                sessionStorage.setItem('activePatient', newPatient.toLowerCase());

                // On prévient la page actuelle que le patient a changé
                window.dispatchEvent(new CustomEvent('patientChanged', { detail: newPatient }));
            });
        }
    }
}

customElements.define('mc-navbar', McNavbar);
