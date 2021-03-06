$(document).ready(function(){
    $("#mapLoading").hide();
    $("#mapNotice").hide();
    // https://ridb.recreation.gov/api/v1/facilities.json?latitude=40.73&longitude=-105.38&radius=25&apikey=27A8045829414015AD38729C8FDB3DDC
    var config = {
        // http://usda.github.io/RIDB/#get-all-facilities
        recFacilitiesBaseUrl: "https://ridb.recreation.gov/api/v1/facilities.json?",
        recAPIKey: "27A8045829414015AD38729C8FDB3DDC",
        //basemapUrl: "http://a.tiles.mapbox.com/v4/brightrain.map-iu0vg7z1/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYnJpZ2h0cmFpbiIsImEiOiJyMjgtNGk4In0.Y64dPMiS4Xi8BXRiDhWXyg#10"
        basemapUrl: "https://a.tiles.mapbox.com/v4/brightrain.ooac5jf6/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYnJpZ2h0cmFpbiIsImEiOiJyMjgtNGk4In0.Y64dPMiS4Xi8BXRiDhWXyg"
    }
    var recFacilities = null;
    var icons = {
        campground: L.icon({
            iconUrl: 'images/icon-camp.png',
            iconSize:     [25, 19]
        }),
        trail: L.icon({
            iconUrl: 'images/icon-trail.png',
            iconSize:     [25, 40]
        }),
        ski: L.icon({
            iconUrl: 'images/icon-ski.png',
            iconSize:     [50, 42]
        }),
        picnic: L.icon({
            iconUrl: 'images/icon-picnic.png',
            iconSize:     [30, 20]
        }),
        fish: L.icon({
            iconUrl: 'images/icon-fish.png',
            iconSize:     [28, 30]
        }),
        tower: L.icon({
            iconUrl: 'images/icon-lookout-tower.png',
            iconSize:     [24, 34]
        }),
        default: L.icon({
            iconUrl: 'images/icon-map-marker.png',
            iconSize:     [23, 34]
        })
    }

    var map = L.map('map', {
        center: [40.6, -105.4],
        zoom: 10,
        zoomControl: false
    });
    new L.Control.Zoom({ position: 'bottomright' }).addTo(map);
    
    map.attributionControl.addAttribution("<span>Rec Facilities by<a href='http://usda.github.io/RIDB/' target='_blank'> Recreation.gov</a></span>");
    var geocoder = L.control.geocoder('search-RCzImpw', 
                                      { markers: {
                                          icon: L.icon({
                                              iconUrl: 'images/icon-search-marker.png',
                                              iconSize: [32, 32] })
                                      }})
    .addTo(map);

    L.control.locate({ 
        icon: "fa fa-location-arrow",
        drawCircle: false,
        metric: false,
        keepCurrentZoomLevel: true
    }).addTo(map);

    //$("#mapZoomLevel").html("20");
    var searchRadiusCircle = L.circle(map.getCenter(), 0, { fill:false, color:"#006400", weight:3, dashArray:"5, 5"}).addTo(map);

    var imageryBasemapLayer = new L.TileLayer(config.basemapUrl, {
        attribution: '<span><a href="http://mapbox.com/about/maps/" target="_blank">MapBox</a></span>'
    });
    map.addLayer(imageryBasemapLayer);

    recFacilities = L.layerGroup().addTo(map);
    var facilitiesLayer = L.markerClusterGroup({maxClusterRadius: 20});
    map.addLayer(facilitiesLayer);

    getFacilities(30);

    map.on("moveend", function() {
        // since the max number of facilities returned is 50 we need to manage the search radius
        // according to the current zoom level
        var zoomLevel = map.getZoom();
        //$("#mapZoomLevel").html(zoomLevel);
        $("#mapNotice").hide();
        var radius = 20;
        if(zoomLevel >= 16) {
            radius = 5; 
        }
        else if(zoomLevel >= 14) {
            radius = 10;
        }
        else if(zoomLevel >= 12) {
            radius = 20;
        }
        else if(zoomLevel >= 10) {
            radius = 30;
        }
        else if(zoomLevel < 10) {
            radius = 120;
        }
        getFacilities(radius);
    });

    function getFacilities(radius) {
        $("#mapLoading").show();
        $("#mapLoadingText").text(" Loading Recreation Facilities...");
        var ll = map.getCenter();
        searchRadiusCircle
            .setRadius(radius * 1609.34)
            .setLatLng(ll);

        $("#radius").html(radius);
        var offset = 0;
        var url = config.recFacilitiesBaseUrl + "latitude=" + ll.lat + "&longitude=" + ll.lng + "&radius=" + radius.toString() +
            "&apikey=" + config.recAPIKey;
        $.getJSON(url, function(data) {
            if(data.METADATA.RESULTS.TOTAL_COUNT > data.METADATA.RESULTS.CURRENT_COUNT) {
                offset += data.METADATA.RESULTS.CURRENT_COUNT;
                getMoreFacilities(url, offset);
            }
            if(data.RECDATA.length == 50) {
                $("#mapNotice").show();
                $("#facilityCount").html(data.METADATA.RESULTS.TOTAL_COUNT);
            }
            else {
                $("#mapNotice").hide();
                $("#facilityCount").html(data.METADATA.RESULTS.TOTAL_COUNT);
            }
            recFacilities.clearLayers();
            facilitiesLayer.clearLayers();
            displayFacilities(data.RECDATA);

            function displayFacilities(facilities) {
                facilities.forEach(function(facility) {
                    var ll = L.latLng(facility.FacilityLatitude, facility.FacilityLongitude);
                    var icon, img;
                    //console.log(facility.FacilityName + " | " + facility.FacilityTypeDescription);
                    if(facility.FacilityName.toString().toLowerCase().indexOf("camp") != -1) {
                        icon = icons.campground;
                        img = "<img src='images/icon-camp.png' />";
                    }
                    else if(facility.FacilityName.toString().toLowerCase().indexOf("trail") != -1) {
                        icon = icons.trail;
                        img = "<img src='images/icon-trail.png' />";
                    }
                    else if(facility.FacilityName.toString().toLowerCase().indexOf("ski") != -1) {
                        icon = icons.ski;
                        img = "<img src='.images/icon-ski.png' />";
                    }
                    else if(facility.FacilityName.toString().toLowerCase().indexOf("picnic") != -1) {
                        icon = icons.picnic;
                        img = "<img src='images/icon-picnic.png' />";
                    }
                    else if(facility.FacilityName.toString().toLowerCase().indexOf("fish") != -1) {
                        icon = icons.fish;
                        img = "<img src='images/icon-fish.png' />";
                    }
                    else if(facility.FacilityName.toString().toLowerCase().indexOf("lookout") != -1) {
                        icon = icons.tower;
                        img = "<img src='images/icon-lookout-tower.png' />";
                    }
                    else {
                        icon = icons.default;
                        img = "<img src='images/icon-map-marker.png' />";
                    }
                    L.marker(ll, {
                        title: facility.FacilityName,
                        icon: icon
                        //}).addTo(recFacilities)
                    }).addTo(facilitiesLayer)
                        .bindPopup(img + "<h3>" + facility.FacilityName + "</h3>" + facility.FacilityDescription, 
                                   { maxHeight: 400, autoPan: false, offset: [0, -15] });
                });
            }
            function getMoreFacilities(url, offset) {
                $("#mapLoading").show();
                $("#mapLoadingText").text(" Loading More Recreation Facilities...");    
                $.getJSON(url + "&offset=" + offset, function(data) {
                    if(offset < data.METADATA.RESULTS.TOTAL_COUNT) {
                        offset += data.METADATA.RESULTS.CURRENT_COUNT;
                        getMoreFacilities(url, offset);
                    }
                    else {
                        $("#mapLoading").hide();   
                    }
                    displayFacilities(data.RECDATA);
                }).then(function() {
                    //$("#mapLoading").hide();
                });
            }
        }).then(function() {
            $("#mapLoading").hide();
        });
    }
});