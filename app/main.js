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
    
    let highlight;
    const routesList = document.getElementById('routesAccordion');
    const btnResetRoutes = document.getElementById('btnResetRoutes');
    const divInfoAndChart = document.getElementById('tabInfoAndChart');
    const createIAC = createInfoAndChart;
    const fltrRoutes = filterRoutes;

    esriConfig.request.corsEnabledServers.push("https://fly.maptiles.arcgis.com");
    esriConfig.request.corsEnabledServers.push("https://wtb.maptiles.arcgis.com");

    const routeRenderer = {
        type: "simple",
        symbol: {
            type: 'simple-line',
            style: 'solid',
            width: 3,
            color: '#FFB901'
        }
    };

    const routesStart2D = new FeatureLayer({
        url: "https://services6.arcgis.com/MLuUQwq7FiARivuF/arcgis/rest/services/LeTourdeFrance2018_RoutesStart/FeatureServer/0",
        outFields: ["*"],
        renderer : {
            type: 'simple',
            symbol: {
                type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
                color: "#ef7204",
                size: 6,
                outline: { // autocasts as new SimpleLineSymbol()
                    color: "#0a000e",
                    width: 1
                }
            }
        }
    });

    const routesStart3D = new FeatureLayer({
        url: "https://services6.arcgis.com/MLuUQwq7FiARivuF/arcgis/rest/services/LeTourdeFrance2018_RoutesStart/FeatureServer",
        elevationInfo: {
            // elevation mode that will place points on top of the buildings or other SceneLayer 3D objects
            mode: "relative-to-ground"
        },
        renderer: {
            type: 'simple',
            symbol: {
                type: "point-3d",  // autocasts as new PointSymbol3D()
                symbolLayers: [{
                    type: "icon",  // autocasts as new IconSymbol3DLayer()
                    resource: { primite: "circle"},
                    material: { color: "#ef7204" },
                    size: 12,
                    outline: {
                        color: "#0a000e",
                        size: 1
                    }
                }],
                verticalOffset: {
                    screenLength: 300,
                    maxWorldLength: 5000,
                    minWorldLength: 30
                },
                callout: {
                    type: "line", // autocasts as new LineCallout3D()
                    color: "#ef7204",
                    size: 0.5,
                    border: {
                        color: "#ef7204"
                    }
                }
            }
        },
        outFields: ["*"],
        labelingInfo: [
            {
                labelExpressionInfo: {
                    value: "{Name}"
                },
                symbol: {
                    type: "label-3d", // autocasts as new LabelSymbol3D()
                    symbolLayers: [{
                        type: "text", // autocasts as new TextSymbol3DLayer()
                        material: {
                            color: "white"
                        },
                        // we set a halo on the font to make the labels more visible with any kind of background
                        halo: {
                            size: 1,
                            color: "#0a000e"
                        },
                        size: 12
                    }]
                }
            }],
        labelsVisible: true
    });

    const allRoutes3D = new FeatureLayer({
        url: 'https://services6.arcgis.com/MLuUQwq7FiARivuF/arcgis/rest/services/LeTourdeFrance2018_Routes/FeatureServer/0',
        outFields: ['*'],
        popupTemplate: {
            title: '{StartFinish} - {Distance} km',
            content:
                '<p>{Name}</p>' +
                '<p>{Overview}</p>'
        },
        renderer: routeRenderer
    });

    const allRoutes2D = new FeatureLayer({
        url: 'https://services6.arcgis.com/MLuUQwq7FiARivuF/ArcGIS/rest/services/LeTourdeFrance2018_Routes/FeatureServer/0',
        outFields: ['*'],
        popupTemplate: {
            title: '{StartFinish} - {Distance} km'
        },
        renderer: routeRenderer
    });

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
        map: map3D,
        highlightOptions: {
            color: '#ef7204'
        },
        qualityProfile: "high",
        environment: {
            lighting: {
                directShadowsEnabled: true,
                ambientOcclusionEnabled: true
            },
            atmosphereEnabled: true,
            atmosphere: {
                quality: "high"
            },
            starsEnabled: true
        }
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
            map3D.add(routesStart3D);
            map2D.add(allRoutes2D);
            map2D.add(routesStart2D);
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
                    
                    fltrRoutes.init([allRoutes2D, allRoutes3D, routesStart2D, routesStart3D], divInfoAndChart, view3D, view2D);

                    btnResetRoutes.addEventListener('click', function () {
                        createIAC.resetDivRouteRender(divInfoAndChart);
                        if (highlight) {
                            highlight.remove();
                        }
                        Array.from(document.getElementsByClassName('accordion-section')).map(function (element) {
                            if (element.classList.contains('is-active')){
                                element.classList.toggle('is-active');
                            } 
                        });

                        allRoutes2D.definitionExpression = "1=1";
                        allRoutes3D.definitionExpression = "1=1";
                        routesStart2D.definitionExpression = "1=1";
                        routesStart3D.definitionExpression = "1=1";
                        
                        view3D.popup.visible = false;
                        
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
                
                const lat = response.results[0].mapPoint.latitude;
                const long = response.results[0].mapPoint.longitude;
            
                const point = new Point({
                    latitude: lat,
                    longitude: long
                });

                const spatialQuery = new Query();
                spatialQuery.geometry = point;
                spatialQuery.distance = 10000;
                spatialQuery.returnGeometry = true;
                spatialQuery.outFields = ["*"];
                spatialQuery.spatialRelationship = 'intersects';
                spatialQuery.units = 'meters'

                view3D.whenLayerView(allRoutes3D)
                    .then(function(lyrView){
                        allRoutes2D.queryFeatures(spatialQuery).then(function (res) {

                            if (res.features.length > 0) {
                                if (highlight) {
                                    highlight.remove();
                                }
                                highlight = lyrView.highlight(res.features);
                                const featureGeometry = res.features[0].geometry;
                                const routeName = res.features[0].attributes.StartFinish;
                                createIAC.create(routeName, res, allRoutes3D, view3D.map.ground.layers.getItemAt(0), divInfoAndChart, view3D);
                                view2D.goTo(featureGeometry);
                                view3D.goTo(featureGeometry);
                            } else {
                                createIAC.resetDivRouteRender(divInfoAndChart);

                                if (highlight) {
                                    highlight.remove();
                                }
                            }
                        });
                    });
            });
    });

    function goToRoute(element){
        disableCheckboxes();
        if (Array.from(element.classList).includes('is-active')) {
            
            const query = new Query();
            query.where = `StartFinish = '${element.getElementsByClassName('accordion-title')[0].textContent}'`;
            query.returnGeometry = true;
            query.outFields = ["*"];
            
            
            view3D.whenLayerView(allRoutes3D)
                .then(function(lyrView){
                    allRoutes3D.queryFeatures(query)
                        .then(function (route) {
            
                            if (highlight) {
                                highlight.remove();
                            }
                            highlight = lyrView.highlight(route.features);

                            createIAC.create(element.getElementsByClassName('accordion-title')[0].textContent, route, allRoutes3D, view3D.map.ground.layers.getItemAt(0), divInfoAndChart, view3D);
                            allRoutes3D.definitionExpression = `StartFinish = '${element.getElementsByClassName('accordion-title')[0].textContent}'`;
                            allRoutes2D.definitionExpression = `StartFinish = '${element.getElementsByClassName('accordion-title')[0].textContent}'`;
                            routesStart2D.definitionExpression = `StartFinish = '${element.getElementsByClassName('accordion-title')[0].textContent}'`;
                            routesStart3D.definitionExpression = `StartFinish = '${element.getElementsByClassName('accordion-title')[0].textContent}'`;
                            view3D.goTo(
                                {
                                    target: route.features[0].geometry
                                }, {
                                    options: { duration: 1000, easing: 'ease-in' }
                                });

                            view2D.goTo(route.features[0].geometry, { duration: 2000, easing: 'ease-in' });
                            return route
                        }).then(function (route) {
                            view3D.popup.visible = true;
                            view3D.popup.title = `${route.features[0].attributes.StartFinish} - ${route.features[0].attributes.Distance} km`;
                            view3D.popup.content = `<p>${route.features[0].attributes.Name}</p>` +
                                `<p>${route.features[0].attributes.Overview}</p>`;
                        });   
                })
            
        }
    };

    function disableCheckboxes(){
        const toggles = document.getElementsByClassName('toggle-switch-input');
        Array.from(toggles).forEach(function(toggle){
            if(toggle.checked == true){
                toggle.checked = false;
                toggle.nextElementSibling.style.backgroundColor = 'white';
                toggle.nextElementSibling.style.borderColor = '#CCC';
            };
        });
    }
});