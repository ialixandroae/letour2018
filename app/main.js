require([
    "esri/Map",
    "esri/views/MapView",
    "esri/views/SceneView",
    "esri/layers/FeatureLayer",
    "esri/tasks/support/Query",
    "../app/createInfoAndChart.js",
    "dojo/domReady!"
], function (Map, MapView, SceneView, FeatureLayer,
            Query, createInfoAndChart ) {

    const routesList = document.getElementById('routesAccordion');
    const btnResetRoutes = document.getElementById('btnResetRoutes');
    const divInfoAndChart = document.getElementById('tabInfoAndChart');
    const createIAC = createInfoAndChart;
    
    const allRoutes3D = new FeatureLayer({
        url: 'https://services.arcgis.com/WQ9KVmV6xGGMnCiQ/ArcGIS/rest/services/LeTourDeFranceRoute_WFL1/FeatureServer/3'
    });

    const allRoutes2D = new FeatureLayer({
        url: 'https://services.arcgis.com/WQ9KVmV6xGGMnCiQ/ArcGIS/rest/services/LeTourDeFranceRoute_WFL1/FeatureServer/3',
        outFields: ['*']
    });

    // https://services.arcgis.com/WQ9KVmV6xGGMnCiQ/ArcGIS/rest/services/LeTourDeFranceRoute_WFL1/FeatureServer/3

    const map3D = new Map({
        basemap: "hybrid",
        ground: "world-elevation"
    });

    const view3D = new SceneView({
        container: "mainMap",
        map: map3D,
        scale: 50000000,
        center: [-101.17, 21.78]
    });

    
    const map2D = new Map({
        basemap: "dark-gray"
    });

    

    const view2D = new MapView({
        container: "secondMap",
        map: map2D,
        zoom: 5,
        center: [4.5, 46] // longitude, latitude
    });

    view3D.when(function () {
        view3D.goTo({
            center: [3, 46],
            zoom: 7,
            tilt: 40,
            heading: 0
        });
    }).then(function () {
        map2D.add(allRoutes2D);
        map3D.add(allRoutes3D);
    }).then(function () {
        allRoutes2D.queryFeatures()
            .then(function (results) {
                const records = results.features;
                records.map(function (record){
                    const stageName = record.attributes.Name;
                    const stageStartFinish = record.attributes.StartFinish;
                    const stageOverview = record.attributes.Overview;
                    const routeAccordion = 
                        `<div class="accordion-section">` +
                            `<h4 class="accordion-title">` +
                                `<span class="accordion-icon">` +
                                    `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 32 32" class="svg-icon">` +
                                        `<path d="M28 9v5L16 26 4 14V9l12 12L28 9z" />` +
                                    `</svg>` +
                                `</span>` +
                                `${stageStartFinish}` +
                            `</h4>` +
                            `<div class="accordion-content">` +
                                `<p>${stageName}</p>` +
                                `<p>${stageOverview}</p>` +
                            `</div>` +
                        `</div>`;

                    routesList.innerHTML += routeAccordion;
                     
                });
            })
            .then(function(){
                Array.from(document.getElementsByClassName('accordion-section')).map(function (element) {
                    element.addEventListener('click', function(){
                        element.classList.toggle('is-active');
                        goToRoute(element);
                    });
                });

                btnResetRoutes.addEventListener('click', function(){
                    resetDivRouteRender(divInfoAndChart);
                    allRoutes2D.definitionExpression = "1=1";
                    allRoutes3D.definitionExpression = "1=1";
                    view3D.goTo({
                        center: [3, 46],
                        zoom: 7,
                        tilt: 40,
                        heading: 0
                    });
                    view2D.goTo({
                        center: [4.5, 46],
                        zoom: 5
                    });
                })
            })
    });

    function goToRoute(element){
        console.log('click rute');
        console.log(Array.from(element.classList))
        if (Array.from(element.classList).includes('is-active')) {
            console.log(element.getElementsByClassName('accordion-title')[0].textContent);
            
            const query = new Query();
            query.where = `StartFinish = '${element.getElementsByClassName('accordion-title')[0].textContent}'`
            query.returnGeometry = true;
            query.outFields = ["*"];
            
            allRoutes3D.definitionExpression = `StartFinish = '${element.getElementsByClassName('accordion-title')[0].textContent}'`;
            allRoutes2D.definitionExpression = `StartFinish = '${element.getElementsByClassName('accordion-title')[0].textContent}'`;

            allRoutes3D.queryFeatures(query)
                .then(function(route){
                    console.log(route);
                    createIAC.create(element.getElementsByClassName('accordion-title')[0].textContent, route, allRoutes3D, view3D.map.ground.layers.getItemAt(0), divInfoAndChart);
                    view3D.goTo(
                        {
                            target: route.features[0].geometry
                        },{
                            options: { duration: 1000, easing: 'ease-in' } 
                    });

                    view2D.goTo(route.features[0].geometry, { duration: 2000, easing: 'ease-in' });
                });
        }
        
    };

    function resetDivRouteRender(render){
        while (render.firstChild) {
            render.removeChild(render.firstChild);
        };

        const description = document.createElement('p');
        description.innerHTML = 'Select a route from the Routes tab or click a route in the scene to get info';
        render.appendChild(description);
    };
});