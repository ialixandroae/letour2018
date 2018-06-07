require([
    "esri/WebMap",
    "esri/views/MapView",
    "esri/views/SceneView",
    "esri/WebScene",
    "esri/layers/FeatureLayer",
    "esri/tasks/support/Query",
    "esri/geometry/Point",
    "esri/config",
    "../app/createInfoAndChart.js",
    "../app/filterRoutes.js",
    "dojo/domReady!"
], function (WebMap, MapView, SceneView, WebScene, FeatureLayer,
    Query, Point, esriConfig, createInfoAndChart, filterRoutes ) {

    const routesList = document.getElementById('routesAccordion');
    const btnResetRoutes = document.getElementById('btnResetRoutes');
    const divInfoAndChart = document.getElementById('tabInfoAndChart');
    const createIAC = createInfoAndChart;
    const fltrRoutes = filterRoutes;

    esriConfig.request.corsEnabledServers.push("https://fly.maptiles.arcgis.com");
    esriConfig.request.corsEnabledServers.push("https://wtb.maptiles.arcgis.com");

    const allRoutes3D = new FeatureLayer({
        url: 'https://services.arcgis.com/WQ9KVmV6xGGMnCiQ/ArcGIS/rest/services/LeTourDeFranceRoute_WFL1/FeatureServer/3',
        outFields: ['*'],
        popupTemplate: {
            title: '{StartFinish} - {Distance} km',
            content:
                '<p>{Name}</p>' +
                '<p>{Overview}</p>'
        }
    });

    const allRoutes2D = new FeatureLayer({
        url: 'https://services.arcgis.com/WQ9KVmV6xGGMnCiQ/ArcGIS/rest/services/LeTourDeFranceRoute_WFL1/FeatureServer/3',
        outFields: ['*'],
        popupTemplate: {
            title: '{StartFinish} - {Distance} km'
        }
    });

    // https://services.arcgis.com/WQ9KVmV6xGGMnCiQ/ArcGIS/rest/services/LeTourDeFranceRoute_WFL1/FeatureServer/3

    const map3D = new WebScene({
        portalItem: {
            id: "03c915392f55473eaab7db341db741b0"  // ID of the WebScene on arcgis.com
        }
    });

    const view3D = new SceneView({
        popup: {
            dockEnabled: true,
            dockOptions: {
                position: "top-right",
                buttonEnabled: false,
                breakpoint: false,
            }
        },
        container: "mainMap",
        map: map3D
    });

    const map2D = new WebMap({
        portalItem: { 
            id: "5723dcceab464f3eb6e06caaf353642f"
        }
    });

    
    const view2D = new MapView({
        popup: {
            dockEnabled: true,
            dockOptions: {
                buttonEnabled: false,
                breakpoint: false,
            }
        },
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
        }).then(function () {
            map3D.add(allRoutes3D);
            map2D.add(allRoutes2D);
            fltrRoutes.init([allRoutes2D, allRoutes3D], divInfoAndChart);
        }).then(function () {
            allRoutes2D.queryFeatures()
                .then(function (results) {
                    const records = results.features;
                    records.map(function (record) {
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
                .then(function () {
                    Array.from(document.getElementsByClassName('accordion-section')).map(function (element) {
                        element.addEventListener('click', function () {
                            element.classList.toggle('is-active');
                            goToRoute(element);
                        });
                    });

                    btnResetRoutes.addEventListener('click', function () {
                        createIAC.resetDivRouteRender(divInfoAndChart);
                        allRoutes2D.definitionExpression = "1=1";
                        allRoutes3D.definitionExpression = "1=1";
                        view3D.popup.visible = false
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
                    });
                });
        });
    });

    // Click event 
    view3D.on("click", event => {
        view3D.hitTest(event)
            .then(function (response) {
                console.log(response);
                const lat = response.results[0].mapPoint.latitude;
                const long = response.results[0].mapPoint.longitude;
                console.log(lat, long);

                const point = new Point({
                    latitude: lat,
                    longitude: long
                });

                const spatialQuery = new Query();
                spatialQuery.geometry = point;
                spatialQuery.distance = 3000;
                spatialQuery.returnGeometry = true;
                spatialQuery.outFields = ["*"];
                spatialQuery.spatialRelationship = 'intersects';
                spatialQuery.units = 'meters'

                allRoutes2D.queryFeatures(spatialQuery).then(function(res){
                    
                    if(res.features.length > 0){
                        console.log(res);
                        const featureGeometry = res.features[0].geometry;
                        const routeName = res.features[0].attributes.StartFinish;
                        createIAC.create(routeName, res, allRoutes3D, view3D.map.ground.layers.getItemAt(0), divInfoAndChart);
                        view2D.goTo(featureGeometry);
                        view3D.goTo(featureGeometry);
                    } else {
                        createIAC.resetDivRouteRender(divInfoAndChart);
                    }
                });

            });
    });

    function goToRoute(element){
        console.log('click rute');
        console.log(Array.from(element.classList))
        disableCheckboxes();
        if (Array.from(element.classList).includes('is-active')) {
            console.log(element.getElementsByClassName('accordion-title')[0].textContent);
            
            const query = new Query();
            query.where = `StartFinish = '${element.getElementsByClassName('accordion-title')[0].textContent}'`
            query.returnGeometry = true;
            query.outFields = ["*"];
            
            

            allRoutes3D.queryFeatures(query)
                .then(function(route){
                    console.log(route);
                    createIAC.create(element.getElementsByClassName('accordion-title')[0].textContent, route, allRoutes3D, view3D.map.ground.layers.getItemAt(0), divInfoAndChart);
                    allRoutes3D.definitionExpression = `StartFinish = '${element.getElementsByClassName('accordion-title')[0].textContent}'`;
                    allRoutes2D.definitionExpression = `StartFinish = '${element.getElementsByClassName('accordion-title')[0].textContent}'`;
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

    function disableCheckboxes(){
        const toggles = document.getElementsByClassName('toggle-switch-input');
        Array.from(toggles).forEach(function(toggle){
            if(toggle.checked == true){
                toggle.checked = false;
            };
        });
    }
});