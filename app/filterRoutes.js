define([
    "dojo/_base/declare",
    "../app/createInfoAndChart.js"
], function (
    declare,
    createInfoAndChart
) {
        var clazz = {
            init: function (routesLyr, divRender){
                
                const createIAC = createInfoAndChart;

                const toggles = document.getElementsByClassName('toggle-switch-input');
                Array.from(toggles).forEach(function(toggle){
                    toggle.addEventListener('click', function(tog){
                        if(tog.target.checked == true){
                            const routesType = tog.path[1].getElementsByTagName("span")[0].innerText;
                            
                            createIAC.resetDivRouteRender(divRender);
                            routesLyr.forEach(function(route){
                                route.definitionExpression = `Type = '${routesType}'`;
                            });

                            const source = tog.target.id;
                            const _toggles = document.getElementsByClassName('toggle-switch-input');
                            Array.from(_toggles).forEach(function (_toggle) {

                                if (_toggle.id !== source && _toggle.checked == true) {
                                    _toggle.checked = false;
                                }
                            });
                        } else {
                            createIAC.resetDivRouteRender(divRender);
                            routesLyr.forEach(function (route) {
                                route.definitionExpression = '1=1';
                            });
                        } 
                        
                    });
                });
            }
        };
        return clazz;
    });