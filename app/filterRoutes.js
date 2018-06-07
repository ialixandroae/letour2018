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
                                console.log(_toggle);
                                if (_toggle.id !== source && _toggle.checked == true) {
                                    _toggle.checked = false;
                                    _toggle.nextElementSibling.style.backgroundColor = 'white';
                                }
                                if(_toggle.id == source){
                                    console.log(_toggle.nextElementSibling)
                                    _toggle.nextElementSibling.style.backgroundColor = '#FFB901';
                                    _toggle.nextElementSibling.style.borderColor = '#FFB901';
                                    
                                }
                            });
                        } else {
                            const _toggles = document.getElementsByClassName('toggle-switch-input');
                            Array.from(_toggles).forEach(function (_toggle) {
                                _toggle.nextElementSibling.style.backgroundColor = 'white';
                                _toggle.nextElementSibling.style.borderColor = '#CCC';
                            });
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