(() => {
    const sd = window.sd || {
        init() {
            // Placeholder for future hooks
        }
    };

    if (typeof sd.init === 'function') {
        sd.init();
    }

    window.sd = sd;
})();
