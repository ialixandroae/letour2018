var locationPath = window.location.pathname.replace(/\/[^\/]+$/, '/');

window.dojoConfig = {
    has: {
        "esri-featurelayer-webgl": 1
    },
    deps: ['app/main'],
    packages: [{
        name: 'app',
        location: locationPath + '/app',
        main: 'main'
    },{
        name: 'app',
        location: 'http://127.0.0.1:8081' + '/app',
        main: 'main'
    }]
};

