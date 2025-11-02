(() => {
    const config = window.styleDesignerConfig || {};
    const defaultEntryRaw = typeof config.defaultEntry === 'string' ? config.defaultEntry.trim() : '';
    const defaultEntry = defaultEntryRaw || 'index.html';

    const StyleStorageRef = window.StyleStorage;
    const viewer = document.getElementById('viewer');
    const viewSelector = document.getElementById('viewSelector');
    const emptyState = document.getElementById('emptyState');
    const newWindowButton = document.getElementById('openNewWindow');
    const configForm = document.getElementById('configForm');
    const configMessages = document.getElementById('configMessages');
    const resetConfigButton = document.getElementById('resetConfig');
    const downloadConfigButton = document.getElementById('downloadConfig');
    const configPanel = document.getElementById('configPanel');
    const previewPanel = document.getElementById('previewPanel');
    const configTab = document.getElementById('configTab');

    if (!viewer || !viewSelector || !emptyState || !newWindowButton || !configPanel || !previewPanel || !configTab) return;

    const buttons = Array.from(viewSelector.querySelectorAll('[data-view]'));
    const state = {
        sources: {},
        activeView: null
    };

    const rootPath = (() => {
        if (StyleStorageRef && typeof StyleStorageRef.scope === 'string') {
            const scope = StyleStorageRef.scope || '/';
            return scope.endsWith('/') ? scope : `${scope}/`;
        }
        return '/';
    })();

    const defaultConfigValues = {
        name: 'base',
        title: 'Default',
        version: '2025',
        compatibility: '3.0',
        author: 'eXeLearning.net',
        license: 'Creative Commons by-sa',
        'license-url': 'http://creativecommons.org/licenses/by-sa/3.0/',
        description: 'Minimally-styled, feature rich responsive style for eXe.\n\niDevice icons by Francisco Javier Pulido Cuadrado.',
        downloadable: '0'
    };

    const configFields = [
        'name',
        'title',
        'version',
        'compatibility',
        'author',
        'license',
        'license-url',
        'description',
        'downloadable'
    ];

    function showConfigMessage(type, text) {
        if (!configMessages) return;
        configMessages.innerHTML = `<div class="alert alert-${type} mb-2" role="status">${text}</div>`;
    }

    function setPreviewVisibility(show) {
        if (show) {
            previewPanel.classList.remove('d-none');
            configPanel.classList.add('d-none');
            configTab.classList.remove('active');
            configTab.setAttribute('aria-pressed', 'false');
        } else {
            previewPanel.classList.add('d-none');
            configPanel.classList.remove('d-none');
        }
    }

    function activateConfigTab() {
        configTab.classList.add('active');
        configTab.setAttribute('aria-pressed', 'true');
    }

    function deactivateConfigTab() {
        configTab.classList.remove('active');
        configTab.setAttribute('aria-pressed', 'false');
    }

    function escapeXml(value) {
        return value.replace(/[<>&'"]/g, (char) => {
            switch (char) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
                default: return char;
            }
        });
    }

    function sanitizeValue(value = '') {
        return String(value || '').trim();
    }

    function buildConfigXml(values) {
        const sanitized = { ...defaultConfigValues, ...values };
        const description = sanitizeValue(sanitized.description)
            .replace(/\r?\n/g, '\n  ');

        return [
            '<?xml version="1.0"?>',
            '<theme>',
            `  <name>${escapeXml(sanitizeValue(sanitized.name))}</name>`,
            `  <title>${escapeXml(sanitizeValue(sanitized.title))}</title>`,
            `  <version>${escapeXml(sanitizeValue(sanitized.version))}</version>`,
            `  <compatibility>${escapeXml(sanitizeValue(sanitized.compatibility))}</compatibility>`,
            `  <author>${escapeXml(sanitizeValue(sanitized.author))}</author>`,
            `  <license>${escapeXml(sanitizeValue(sanitized.license))}</license>`,
            `  <license-url>${escapeXml(sanitizeValue(sanitized['license-url']))}</license-url>`,
            description
                ? `  <description>${escapeXml(description)}</description>`
                : '  <description></description>',
            `  <downloadable>${sanitizeValue(sanitized.downloadable) === '1' ? '1' : '0'}</downloadable>`,
            '</theme>',
            ''
        ].join('\n');
    }

    function extractConfigValues(doc) {
        const values = { ...defaultConfigValues };
        configFields.forEach((field) => {
            const node = doc.querySelector(field);
            if (node && typeof node.textContent === 'string') {
                values[field] = node.textContent.trim();
            }
        });
        values.downloadable = values.downloadable === '1' ? '1' : '0';
        return values;
    }

    function populateConfigForm(values) {
        if (!configForm) return;
        configFields.forEach((field) => {
            const element = configForm.elements.namedItem(field);
            if (!element) return;
            if (field === 'description') {
                element.value = values[field] || '';
            } else {
                element.value = typeof values[field] === 'string' ? values[field] : '';
            }
        });
    }

    async function loadConfig() {
        if (!configForm || !StyleStorageRef || !StyleStorageRef.readText) return;
        let xml = null;
        try {
            xml = await StyleStorageRef.readText('theme/config.xml');
        } catch (err) {
            console.warn('Unable to read config.xml:', err);
        }

        let values = defaultConfigValues;
        if (xml) {
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(xml, 'application/xml');
                if (!doc.querySelector('parsererror')) {
                    values = extractConfigValues(doc);
                } else {
                    showConfigMessage('warning', 'config.xml is malformed. Showing defaults.');
                }
            } catch (err) {
                console.warn('Unable to parse config.xml:', err);
                showConfigMessage('warning', 'config.xml could not be parsed. Showing defaults.');
            }
        }
        populateConfigForm(values);
        if (configForm) {
            configForm.classList.remove('was-validated');
        }
    }

    function gatherConfigFormValues() {
        if (!configForm) return { ...defaultConfigValues };
        const formData = new FormData(configForm);
        const values = {};
        configFields.forEach((field) => {
            const raw = formData.get(field);
            values[field] = raw == null ? '' : sanitizeValue(raw.toString());
        });
        values.name = values.name.replace(/\s+/g, '');
        values.downloadable = values.downloadable === '1' ? '1' : '0';
        return values;
    }

    async function handleConfigSubmit(event) {
        event.preventDefault();
        if (!configForm || !StyleStorageRef || !StyleStorageRef.saveText) return;

        configForm.classList.add('was-validated');
        if (!configForm.checkValidity()) {
            configForm.reportValidity();
            return;
        }

        const values = gatherConfigFormValues();
        const xml = buildConfigXml(values);

        try {
            await StyleStorageRef.saveText('theme/config.xml', xml);
            showConfigMessage('success', 'config.xml saved successfully.');
        } catch (err) {
            console.error(err);
            showConfigMessage('danger', `Unable to save config.xml: ${err && err.message ? err.message : err}`);
        }
    }

    function handleConfigReset() {
        populateConfigForm(defaultConfigValues);
        configForm.classList.remove('was-validated');
        showConfigMessage('info', 'Default values restored. Remember to save to apply changes.');
    }

    function handleConfigDownload() {
        if (!configForm) return;
        configForm.classList.add('was-validated');
        if (!configForm.checkValidity()) {
            configForm.reportValidity();
            return;
        }
        const values = gatherConfigFormValues();
        const xml = buildConfigXml(values);
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${sanitizeValue(values.name) || 'style'}.config.xml`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
    }

    async function setupConfigSection() {
        if (!configForm) return;
        await loadConfig();
        configForm.addEventListener('submit', handleConfigSubmit);
        if (resetConfigButton) {
            resetConfigButton.addEventListener('click', handleConfigReset);
        }
        if (downloadConfigButton) {
            downloadConfigButton.addEventListener('click', handleConfigDownload);
        }
        configTab.setAttribute('aria-pressed', 'false');
        configTab.addEventListener('click', () => {
            activateConfigView();
        });
    }

    function buildCandidates(viewId) {
        const base = `${rootPath}contents/${viewId}`;
        const candidates = [];

        if (viewId === 'page') {
            candidates.push(`${base}/index.html`);
            candidates.push(`${base}/html/${defaultEntry}`);
            candidates.push(`${base}/html/index.html`);
        } else {
            if (defaultEntry !== 'index.html') {
                candidates.push(`${base}/html/${defaultEntry}`);
            }
            candidates.push(`${base}/index.html`);
            candidates.push(`${base}/html/index.html`);
        }

        return candidates;
    }

    function withCacheBuster(url) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}v=${Date.now()}`;
    }

    async function resourceExists(url) {
        const target = withCacheBuster(url);
        try {
            const response = await fetch(target, { method: 'GET', cache: 'no-store' });
            return response.ok;
        } catch (_) {
            return false;
        }
    }

    function updateActiveButton(activeViewId) {
        buttons.forEach((btn) => {
            const isActive = btn.dataset.view === activeViewId;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', String(isActive));
        });
        if (activeViewId === 'config') {
            activateConfigTab();
        } else {
            deactivateConfigTab();
        }
    }

    function setViewerSource(viewId) {
        const baseSrc = state.sources[viewId];
        if (!baseSrc) return;

        const src = withCacheBuster(baseSrc);
        viewer.src = src;
        viewer.hidden = false;
        setPreviewVisibility(true);
        state.activeView = viewId;

        updateActiveButton(viewId);
        newWindowButton.disabled = false;
    }

    function activateConfigView() {
        setPreviewVisibility(false);
        updateActiveButton('config');
        state.activeView = 'config';
        newWindowButton.disabled = true;
    }

    async function prepareViews() {
        const availableViews = [];

        for (const button of buttons) {
            const viewId = button.dataset.view;
            const candidates = buildCandidates(viewId);

            for (const candidate of candidates) {
                // skip duplicate checks for the same path
                if (state.sources[viewId] === candidate) continue;
                if (await resourceExists(candidate)) {
                    state.sources[viewId] = candidate;
                    availableViews.push(viewId);
                    break;
                }
            }

            if (!state.sources[viewId]) {
                button.classList.add('d-none');
            }
        }

        return availableViews;
    }

    function selectInitialView(availableViews) {
        const preferredOrder = ['web', 'page', 'scorm'];
        return preferredOrder.find((view) => availableViews.includes(view)) || availableViews[0];
    }

    function displayStorageError(details) {
        if (emptyState) {
            emptyState.hidden = false;
            emptyState.innerHTML = `
                <div class="alert alert-warning mb-2">
                    Unable to initialise the preview storage. Please ensure your browser supports Service Workers and reload the page.${details ? `<br><small class="text-muted">${details}</small>` : ''}
                </div>
            `;
        }
        if (viewSelector) viewSelector.hidden = true;
        if (viewer) viewer.hidden = true;
        if (newWindowButton) newWindowButton.disabled = true;
        configPanel.classList.add('d-none');
        configTab.disabled = true;
    }

    async function init() {
        if (!StyleStorageRef || !StyleStorageRef.init) {
            displayStorageError('Missing StyleStorage helper.');
            return;
        }

        try {
            await StyleStorageRef.init();
        } catch (err) {
            console.error(err);
            displayStorageError(err && err.message ? err.message : '');
            return;
        }

        await setupConfigSection();
        configTab.disabled = false;

        const availableViews = await prepareViews();

        if (!availableViews.length) {
            activateConfigView();
            viewer.hidden = true;
            viewSelector.hidden = true;
            if (emptyState) emptyState.hidden = true;
            showConfigMessage('info', 'No preview content available yet. Upload your exported packages from the Upload page.');
            return;
        }

        emptyState.hidden = true;
        viewSelector.hidden = false;

        buttons
            .filter((btn) => !btn.classList.contains('d-none'))
            .forEach((btn) => {
                btn.addEventListener('click', () => setViewerSource(btn.dataset.view));
            });

        newWindowButton.addEventListener('click', () => {
            if (state.activeView && state.activeView !== 'config') {
                window.open(viewer.src, '_blank', 'noopener,noreferrer');
            }
        });

        const initialView = selectInitialView(availableViews);
        if (initialView) {
            setViewerSource(initialView);
        }
    }

    document.addEventListener('DOMContentLoaded', init, { once: true });
})();
