define([
    "dojo/_base/declare",
    "esri/geometry/Point",
    "esri/geometry/Polyline",
    "esri/geometry/geometryEngine"
], function(
    declare,
    Point,
    Polyline,
    geometryEngine
){
    var clazz = {
        create: function(routeName, route, allRoutes, ground, divRender, view){
            
            const routeGeometry = route.features[0].geometry;
            const routeDescription = route.features[0].attributes.Overview;
            const routeLength = route.features[0].attributes.Distance;
            const routeStage = route.features[0].attributes.Name;

            while (divRender.firstChild) {
                divRender.removeChild(divRender.firstChild);
            };

            const divStageName = document.createElement('p');
            divStageName.innerHTML = routeStage;

            const divRouteName = document.createElement('p');
            divRouteName.innerHTML = routeName;

            const divRouteLength = document.createElement('p');
            divRouteLength.innerHTML = routeLength + ' km';

            const divRouteDescription = document.createElement('p');
            divRouteDescription.innerHTML = routeDescription;

            const divRouteChart = document.createElement('div');
            divRouteChart.style.height = '200px';
            divRouteChart.style.width = '100%';

            divRender.appendChild(divStageName);
            divRender.appendChild(divRouteName);
            divRender.appendChild(divRouteLength);
            divRender.appendChild(divRouteDescription);
            divRender.appendChild(divRouteChart);

            ground.queryElevation(routeGeometry, {
                
                demResolution: "finest-contiguous"
            }).then((response) => {
               
                let routeData = getProperties();
                let data;
                if(routeData[0].length > 500){
                    data = routeData[0].filter(function (route) {
                        return route.length % 1 == 0;
                    });
                } else {
                    data = routeData[0];
                }
                
                // Functie prelucrare date din geometrie linie 
                // Intoarce un array de obiecte care sunt folosite ca input in grafic
                // Credits: Raluca Nicola -> https://github.com/RalucaNicola/hiking-app/blob/master/src/ts/data/Trail.ts 
                function getProperties() {

                    const points = [];
                    let totalLength = 0;
                    let segmentLength = 0;
                    const path = getLongestPath();
                    const segments = [path[0]];
                    let i = 0, j;
                    points.push({ point: path[0], length: totalLength, value: Math.round(path[0][2]) });
                    while(i <path.length) {
                        for (j = i + 1; j < path.length; j++) {

                            const length = computeLength(path.slice(i, j + 1));

                            segmentLength += length;
                            if (segmentLength > 2000) {
                                const distance = computeLength([segments[segments.length - 1], path[j]]);
                                if (distance > 1000) {
                                    segments.push(path[j]);
                                    segmentLength = 0;
                                }
                            }

                            if (length > 150) {
                                totalLength += length;
                                points.push({ point: path[j], length: Math.round(totalLength / 100) / 10, value: Math.round(path[i][2]) });
                                break;
                            }
                        }
                        i = j;
                    }
                    return [points, segments];
                };

                function getLongestPath() {
                    let longestPath = null;
                    let maxPathLength = 0;
                    for (const path of response.geometry.paths) {
                        const length = computeLength(path);
                        if (length > maxPathLength) {
                            maxPathLength = length;
                            longestPath = path;
                        };
                    };

                    return longestPath;
                };

                function computeLength(path){
                    return geometryEngine.geodesicLength(new Polyline({
                        paths: [path],
                        hasZ: true,
                        spatialReference: { wkid: 4326 }
                    }), "meters");

                };
                
                // Chart creation
                const chart = AmCharts.makeChart(divRouteChart, {
                    "type": "serial",
                    "dataProvider": data,
                    "color": "#4b4b4b",
                    "balloon": {
                        "borderAlpha": 0,
                        "fillAlpha": 0.8,
                        "fillColor": "#FFB901",
                        "shadowAlpha": 0
                    },
                    "graphs": [{
                        "id": "g1",
                        "balloonText": "Distance: <b>[[category]] km</b><br>Elevation:<b>[[value]] m</b>",
                        "fillAlphas": 0.2,
                        "bulletAlpha": 0,
                        "lineColor": "#FFB901",
                        "lineThickness": 1,
                        "valueField": "value"
                    }],
                    "chartCursor": {
                        "limitToGraph": "g1",
                        "categoryBalloonEnabled": false,
                        "zoomable": false
                    },
                    "categoryField": "length",
                    "categoryAxis": {
                        "gridThickness": 0,
                        "axisThickness": 0.1
                    },
                    "valueAxes": [{
                        "strictMinMax": false,
                        "autoGridCount": false,
                        "minimum": 0,
                        "maximum": "auto",
                        "axisThickness": 0,
                        "tickLength": 0
                    }]
                    
                });

                const popup = view.popup;
                
                chart.addListener("changed", (e) => {
                    
                    if (e.index) {
                        const datas = e.chart.dataProvider[e.index];
                        
                        popup.dockEnabled = false;
                        popup.open({
                            title: "Elevation: " + datas.value + " m",
                            location: new Point({
                                spatialReference: { wkid: 4326 },
                                longitude: datas.point[0],
                                latitude: datas.point[1],
                                z: datas.point[2]
                            })
                        });
                        popup.collapsed = true;
                        
                        document.getElementsByClassName('esri-popup__main-container')[0].style.maxHeight = "50px";
                        document.getElementsByClassName('esri-popup__main-container')[0].style.width = "150px";
                    } else {
                        document.getElementsByClassName('esri-popup__main-container')[0].style.maxHeight = "80%";
                        document.getElementsByClassName('esri-popup__main-container')[0].style.width = "340px";
                        popup.collapsed = false;
                        popup.dockEnabled = true;
                        popup.dockOptions.position = "top-right";
                        popup.title = routeName + " - " + routeLength + " km";
                        popup.content = routeDescription;
                    }
                });
            });
        },
        resetDivRouteRender: function(render){
            while (render.firstChild) {
                render.removeChild(render.firstChild);
            };

            const description = document.createElement('p');
            description.innerHTML = 'Select a route from the Routes tab or click a route in the scene to get info';
            render.appendChild(description);
        }
    };
    return clazz;
});