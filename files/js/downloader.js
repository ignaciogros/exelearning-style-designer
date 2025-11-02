(() => {
    const messagesContainer = document.getElementById('downloadMessages');
    const downloadButton = document.getElementById('downloadButton');
    const confirmButton = document.getElementById('confirmDeleteAction');
    const confirmModalElement = document.getElementById('confirmModal');

    const TEXT_EXTENSIONS = new Set([
        '.html', '.htm', '.css', '.js', '.json', '.txt', '.xml', '.xhtml', '.svg'
    ]);

    function getBootstrapModal() {
        if (!confirmModalElement || typeof bootstrap === 'undefined') return null;
        return bootstrap.Modal.getOrCreateInstance(confirmModalElement);
    }

    function clearMessages() {
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
    }

    function showMessage(type, text) {
        if (!messagesContainer) return;
        const div = document.createElement('div');
        div.className = `alert alert-${type}`;
        div.role = 'status';
        div.textContent = text;
        messagesContainer.appendChild(div);
    }

    function getExtension(name) {
        const match = name.toLowerCase().match(/\.[^.]+$/);
        return match ? match[0] : '';
    }

    function isTextExtension(ext) {
        return TEXT_EXTENSIONS.has(ext);
    }

    async function handleDownload() {
        clearMessages();

        if (!window.StyleStorage) {
            showMessage('danger', 'Storage is not available.');
            return;
        }

        if (typeof JSZip === 'undefined') {
            showMessage('danger', 'JSZip library is missing.');
            return;
        }

        try {
            await StyleStorage.init();
        } catch (err) {
            console.error(err);
            showMessage('danger', `Unable to initialise storage. ${err && err.message ? err.message : ''}`);
            return;
        }

        const themePaths = await StyleStorage.list('theme/');
        if (!themePaths.length) {
            showMessage('warning', 'No theme files found. Upload content first.');
            return;
        }

        const zip = new JSZip();
        let themeName = 'style';

        try {
            const configContent = await StyleStorage.readText('theme/config.xml');
            if (configContent) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(configContent, 'application/xml');
                const nameNode = doc.querySelector('name');
                if (nameNode && nameNode.textContent) {
                    const sanitized = nameNode.textContent.trim();
                    if (sanitized) themeName = sanitized;
                }
            } else {
                showMessage('warning', 'config.xml not found. Using default name.');
            }
        } catch (err) {
            console.warn('Unable to read config.xml', err);
            showMessage('warning', 'Could not read config.xml. Using default name.');
        }

        for (const path of themePaths) {
            const relative = path.replace(/^theme\//, '');
            const ext = getExtension(relative);
            const fullPath = `theme/${relative}`;

            if (isTextExtension(ext)) {
                const content = await StyleStorage.readText(fullPath);
                if (content != null) {
                    zip.file(relative, content);
                }
            } else {
                const data = await StyleStorage.readBinary(fullPath);
                if (data != null) {
                    zip.file(relative, data, { binary: true });
                }
            }
        }

        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${themeName}.zip`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);

        showMessage('success', `Downloading ${themeName}.zip…`);
    }

    async function handleDelete() {
        clearMessages();

        if (!window.StyleStorage) {
            showMessage('danger', 'Storage is not available.');
            return;
        }

        try {
            await StyleStorage.init();
            await StyleStorage.clear();
            localStorage.removeItem('style-designer-default-entry');
            showMessage('success', 'All files removed. You can upload a new style now.');
        } catch (err) {
            console.error(err);
            showMessage('danger', `Unable to delete files: ${err && err.message ? err.message : err}`);
            return;
        }

        const modal = getBootstrapModal();
        if (modal) {
            modal.hide();
        }
    }

    function init() {
        if (!downloadButton) return;

        downloadButton.addEventListener('click', () => {
            downloadButton.disabled = true;
            handleDownload().finally(() => {
                downloadButton.disabled = false;
            });
        });

        if (confirmButton) {
            confirmButton.addEventListener('click', () => {
                const button = confirmButton;
                button.disabled = true;
                handleDelete().finally(() => {
                    button.disabled = false;
                });
            });
        }
    }

    document.addEventListener('DOMContentLoaded', init, { once: true });
})();
