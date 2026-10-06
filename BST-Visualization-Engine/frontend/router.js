class Router {
    constructor(app) {
        this.app = app;
        this.routes = {};
        window.addEventListener('hashchange', () => this.handleRoute());
    }

    addRoute(path, renderFn) {
        this.routes[path] = renderFn;
    }

    navigate(path) {
        window.location.hash = path;
    }

    handleRoute() {
        let path = window.location.hash.slice(1) || '/';
        
        // Update sidebar active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === '#' + path) {
                item.classList.add('active');
            }
        });

        // Clear errors/messages
        if (this.app && this.app.ui) {
            this.app.ui.setStatus('', '');
        }

        // Find exact match or default
        const render = this.routes[path] || this.routes['/'];
        if (render) {
            render();
        }
    }
}
window.Router = Router;
