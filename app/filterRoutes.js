define([
    "dojo/_base/declare",
    "../app/createInfoAndChart.js"
], function (
    declare,
    createInfoAndChart
) {
        var clazz = {
            init: function (routesLyr, divRender, view3D, view2D){
                
                let highlight;
                const createIAC = createInfoAndChart;

                const toggles = document.getElementsByClassName('toggle-switch-input');
                
                Array.from(toggles).forEach(function(toggle){
                    toggle.addEventListener('click', function(tog){
                        if(tog.target.checked == true){
                            const routesType = tog.path[1].getElementsByTagName("span")[0].innerText;
                            
                            createIAC.resetDivRouteRender(divRender);
                    
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
                            

                            routesLyr.forEach(function(route){
                                route.definitionExpression = `Type = '${routesType}'`;
                            });

                            const source = tog.target.id;
                            const _toggles = document.getElementsByClassName('toggle-switch-input');
                            
                            Array.from(_toggles).forEach(function (_toggle) {
                    
                                if (_toggle.id !== source && _toggle.checked == true) {
                                    _toggle.checked = false;
                                    _toggle.nextElementSibling.style.backgroundColor = 'white';
                                }
                                if(_toggle.id == source){
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