/**
 * <mc-game-card
 *   card-title="Associations du Quotidien"
 *   desc="Retrouvez les objets qui vont ensemble."
 *   href="game-a.html"
 *   icon-type="associations">
 * </mc-game-card>
 *
 * <mc-game-card
 *   card-title="Mémoire &amp; Réminiscence"
 *   desc="Reconnaissez vos proches et vos souvenirs."
 *   href="game-b.html"
 *   icon-type="memoire"
 *   duo>
 * </mc-game-card>
 *
 * icon-type : associations | memoire
 * duo       : boolean attribute — adds Duo mode toggle
 */
class McGameCard extends HTMLElement {
    static get observedAttributes() {
        return ['card-title', 'desc', 'href', 'icon-type', 'duo', 'focus', 'duration', 'memory-axis', 'bullets', 'recommended'];
    }

    connectedCallback()        { this._render(); }
    attributeChangedCallback() { this._render(); }

    _render() {
        const title    = this.getAttribute('card-title') || '';
        const desc     = this.getAttribute('desc')       || '';
        const href     = this.getAttribute('href')       || '#';
        const iconType = this.getAttribute('icon-type')  || 'associations';
        const hasDuo   = this.hasAttribute('duo');
        const focus    = this.getAttribute('focus')      || '';
        const duration = this.getAttribute('duration')   || '';
        const memoryAxis = this.getAttribute('memory-axis') || '';
        const bullets = (this.getAttribute('bullets') || '').split('|').filter(Boolean);
        const isRecommended = this.hasAttribute('recommended');

        const icons = {
            associations: `<svg viewBox="0 0 100 100" aria-hidden="true">
                <path d="M30 22 Q32 14 30 8" fill="none" stroke="#A8C4A2" stroke-width="3" stroke-linecap="round"/>
                <path d="M42 18 Q44 10 42 5"  fill="none" stroke="#A8C4A2" stroke-width="3" stroke-linecap="round"/>
                <path d="M54 22 Q56 14 54 8"  fill="none" stroke="#A8C4A2" stroke-width="3" stroke-linecap="round"/>
                <path d="M18 34 L23 76 Q23 82 50 82 Q77 82 77 76 L82 34 Z" fill="#D4A96A"/>
                <line x1="18" y1="34" x2="82" y2="34" stroke="#B8854A" stroke-width="2"/>
                <ellipse cx="50" cy="44" rx="26" ry="6" fill="#8B5E3C"/>
                <path d="M77 46 Q94 46 94 59 Q94 72 77 70" fill="none" stroke="#B8854A" stroke-width="7" stroke-linecap="round"/>
                <ellipse cx="50" cy="82" rx="32" ry="6" fill="#C49060"/>
            </svg>`,
            memoire: `<svg viewBox="0 0 100 100" aria-hidden="true">
                <rect x="8"  y="10" width="84" height="80" rx="8" fill="#C49A6C"/>
                <rect x="15" y="17" width="70" height="66" rx="5" fill="#F5E9D8"/>
                <rect x="21" y="23" width="58" height="54" rx="4" fill="#A8C4A2"/>
                <ellipse cx="50" cy="65" rx="22" ry="9" fill="#6B8F71"/>
                <circle  cx="38" cy="48" r="9"  fill="#FAD07A"/>
                <rect x="8"  y="10" width="10" height="10" rx="2" fill="#A07850"/>
                <rect x="82" y="10" width="10" height="10" rx="2" fill="#A07850"/>
                <rect x="8"  y="80" width="10" height="10" rx="2" fill="#A07850"/>
                <rect x="82" y="80" width="10" height="10" rx="2" fill="#A07850"/>
            </svg>`,
        };

        const iconSvg = icons[iconType] || icons['associations'];

        const duoSection = hasDuo ? `
                <div class="duo-toggle" id="duo-section">
                    <div class="duo-toggle__row">
                        <span class="duo-toggle__label">Activer le mode duo</span>
                        <label class="toggle-switch" aria-label="Activer le mode duo">
                            <input type="checkbox" id="duo-mode-toggle">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <p class="duo-toggle__copy">L aidant reçoit des suggestions discrètes pour accompagner le souvenir sans corriger frontalement.</p>
                    <span class="duo-badge" id="duo-badge" aria-live="polite"></span>
                </div>` : '';

        const bulletsHtml = bullets.length
            ? `<ul class="game-card__bullets">${bullets.map((item) => `<li>${item}</li>`).join('')}</ul>`
            : '';

        this.innerHTML = `
<article class="game-card${isRecommended ? ' is-recommended' : ''}">
    <div class="game-card__top">
        <span class="game-card__focus">${focus}</span>
        <div class="game-card__icon">${iconSvg}</div>
    </div>
    <div class="game-card__body">
        <h2 class="game-card__title">${title}</h2>
        <p class="game-card__desc">${desc}</p>
        <div class="game-card__meta">
            <span class="game-card__chip">${duration}</span>
            <span class="game-card__chip">${memoryAxis}</span>
        </div>
        ${bulletsHtml}
        ${duoSection}
        <a href="${href}" class="btn-jouer"${hasDuo ? ' id="btn-jouer-b"' : ''}>Jouer</a>
    </div>
</article>`;
    }
}

customElements.define('mc-game-card', McGameCard);
