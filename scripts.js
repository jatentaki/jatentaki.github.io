'use strict';

var map = null;
var circles = null;
var currentStop = 5987;
var ZTMSchedule = null;
var colorTable = null;
var threshold = 100 * 60;
var forward = true;
var nodeLocations = null;
var visualization = null;
const originalMapCenter = {lat: 52.2507055, lng: 21.0250947};

class ArrowPath {
  constructor(map, dijResults) {
    this.dij = dijResults;
    this.polyline = new google.maps.Polyline({
      path: [],
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 2,
      zIndex: 10,
      map: map
    });
  }

  updateDij(dijResults) {
    this.dij = dijResults;
    this.polyline.setPath([]);
  }

  traceTo(destId) {
    if (this.dij[destId] == null) {
      this.polyline.setPath([]);
      return;
    };

    var from = this.dij[destId].f;
    var to   = this.dij[destId].t;

    var path = [];
    while (from !== to) {
      const position = nodeLocations[to];
      if (!Visualization.isPosInAfrica(position)) {
        path.push(position);
      };

      to   = this.dij[from].t;
      from = this.dij[from].f;
    };
    path.push(nodeLocations[to]);
    this.polyline.setPath(path);
  }
}

class Visualization {
  static isPosInAfrica(pos) {
    if (isNaN(pos.lat) || isNaN(pos.lng)) { return true; };
    return (Math.abs(pos.lat - originalMapCenter.lat) > 1. ||
            Math.abs(pos.lng - originalMapCenter.lng) > 1.);
  }

  static defaultFillColor() {
    return '#FFFFFF';
  }

  static defaultStrokeColor() {
    return '#000000';
  }

  constructor(map, voronoi) {
    this.map = map;

    this.pin = new google.maps.Marker({
      map: map,
      clickable: false,
      position: nodeLocations[currentStop]
    });

    this.arrowPath = null;

    this.polygons = [];

    for (var i = 0; i < voronoi.simplexes.length; i++) {
      if (voronoi.simplexes[i].length < 3) {
        this.polygons.push(null);
        continue;
      };

      const paths = voronoi.simplexes[i].map(id => voronoi.nodes[id]);
      const polygon = new google.maps.Polygon({
          paths: paths,
          strokeColor: Visualization.defaultStrokeColor(),
          fillColor: Visualization.defaultFillColor(),
          fillOpacity: 0.60,
          strokeOpacity: 0.5,
          strokeWeight: 0.2
      });

      polygon.setMap(map);

      polygon.addListener('click', ((id, pin) => {
        return () => {
          currentStop = id;
          pin.setOptions({
            position: nodeLocations[id]
          });
          loadDijkstra(this);
        };
      })(i, this.pin));

      polygon.addListener('mouseover', ((id, vis) => {
        return () => {
          if (vis.arrowPath != null) {
            vis.arrowPath.traceTo(id);
          }
        };
      })(i, this));

      this.polygons.push(polygon);
    };
  }

  visualize(dijResults) {
    if (this.arrowPath == null) {
      this.arrowPath = new ArrowPath(this.map, dijResults)
    } else {
      this.arrowPath.updateDij(dijResults);
    };  

    const overThreshold = colorTable[colorTable.length-1];
    function hexIt(time) {
      if (time > threshold) { return overThreshold; };
      const percentage = Math.round((colorTable.length - 1) * time / threshold);
      return colorTable[percentage];
    };

    this.polygons.forEach((polygon, i) => {
      const state = dijResults[i];
      if (polygon == null) { return; };
      const color = state != null ? hexIt(state.s) : '#000000';

      polygon.setOptions({
        fillColor: color
      });
    });
  }

  hideFromView() {
    this.polygons.forEach((polygon, _) => {
      if (polygon != null) {
        polygon.setMap(null);
      };
    });

    this.pin.setMap(null);
  }

  setOpacity(opacity) {
    this.polygons.forEach((polygon, _) => {
      if (polygon != null) {
        polygon.setOptions({
          fillOpacity: opacity
        });
      }
    })
  }
}

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: originalMapCenter,
    mapTypeId: 'terrain'
  });

  Promise.all([
    makeRequest(
      'GET', 'https://jatentaki.github.io/package.sz', {responseType: 'arraybuffer'}
    ),
    
    Rust.wasm_client,
  ])
  .then(values => {
    colorTable = createColorLookupTable();

    const pack = new Uint8Array(values[0]);
    const client = values[1];

    var voronoi = client.initPackage(pack);

    ZTMSchedule = client;

    return voronoi;
  })
  .then(voronoi => {
    nodeLocations = ZTMSchedule.getNodes();
    visualization = new Visualization(map, voronoi);
    loadDijkstra(visualization);
  });
}

function makeRequest (method, url, options) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();

    if (options !== undefined) {
      for (var key in options) {
        xhr[key] = options[key];
      };

      if (options.headers !== undefined) {
        for (var key in options.headers) {
          xhr.setRequestHeader(key, options.headers[key]);
        };
      };
    };

    xhr.open(method, url);
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.response);
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      }
    };
    xhr.onerror = function () {
      reject({
        status: this.status,
        statusText: xhr.statusText
      });
    };
    xhr.send();
  });
};

function createColorLookupTable() {
  var colorTable = [];
  for (var i = 0; i < 100; i++) {
    var code = new w3color(d3.interpolateRdYlBu(i / 100)).toHexString();
    colorTable.push(code); 
  };

  return colorTable;
}

function loadDijkstra(vis) {
  var m = getTime().minute;
  var h = getTime().hour;

  if (currentStop == null) {
    return;
  };

  var dijkstraResults = ZTMSchedule.dijkstraPath(currentStop, h, m, forward);
  vis.visualize(dijkstraResults);
}

function incrementMinute() {
  document.getElementById('timeInput').stepUp();
  loadDijkstra(visualization);
}

function decrementMinute() {
  document.getElementById('timeInput').stepDown();
  loadDijkstra(visualization);
}

function changeDirection() {
  const option = document.getElementById('directionSelect').selectedIndex;

  if (option == 0) {
    forward = true;
  } else {
    forward = false;
  };

  loadDijkstra(visualization);
}

function setThreshold() {
  threshold = document.getElementById('thresholdSlider').value * 60;
  document.getElementById('threshold-span').textContent = (threshold / 60).toString();
  loadDijkstra(visualization);
}

function setOpacity() {
  const opacityPercent = document.getElementById('opacitySlider').value;
  visualization.setOpacity(opacityPercent / 100);
  document.getElementById('opacity-span').textContent = opacityPercent.toString();
}


function getTime() {
  const timeSetter = document.getElementById("timeInput");
  const splits = timeSetter.value.split(':');

  return {
    hour: parseInt(splits[0]),
    minute: parseInt(splits[1])
  };
}

