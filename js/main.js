const blueLowestColour = "#fff7fb";
const blueMiddleColour = "#045a8d";
const blueHighestColour = "#023858";

const redLowestColour = "#fff7ec";
const redMiddleColour = "#b30000";
const redHighestColour = "#7f0000";

const redOutlineColour = "#67001f";
const blueOutlineColour = "#053061";

const defaultColour = "#737373";

var map;
var geojson;
var changedGeojson;
var results;

var layerControl;
// var yearIndicatorControl;
var exitOverlayButton;
var voteMarginLegend;

var overlayBackground;

var mousePosition;
var hoverPopup;

const years = ["2006", "2011", "2015", "2020", "2025"];
const maxIndex = years.length - 1;
var displayedYear = years[maxIndex]; // default to latest year
var yearIndex = maxIndex;
let btnPrev;
let btnNext;

// leaflet controls
let decrementButton;
let incrementButton;
let yearInfo;

let container;

const maxBounds = L.latLngBounds([
  [1.5509, 103.4033],
  [1.102, 104.2177],
]);

const equivalentBoundaryNames = [
  ["West Coast", "West Coast-Jurong West"],
  ["Jurong", "Jurong East-Bukit Batok"],
  ["Marine Parade", "Marine Parade-Braddell Heights"],
];

function doesBoundaryNameMatch(compare, against) {
  // First check against equivalent boundary names
  for (const entry of equivalentBoundaryNames) {
    const isCompareMatch =
      compare.localeCompare(entry[0]) == 0 ||
      compare.localeCompare(entry[1]) == 0;
    const isAgainstMatch =
      against.localeCompare(entry[0]) == 0 ||
      against.localeCompare(entry[1]) == 0;

    if (isCompareMatch && isAgainstMatch) {
      return true;
    }
  }

  return compare.localeCompare(against) == 0;
}

const boundariesData = [
  "./data/2006 Electoral Boundaries.geojson",
  "./data/2011 Electoral Boundaries.geojson",
  "./data/2015 Electoral Boundaries.geojson",
  "./data/2020 Electoral Boundaries.geojson",
  "./data/2025 Electoral Boundaries.geojson",
];

function getBoundariesDataOfYear(year) {
  return year.localeCompare("2006") == 0
    ? boundariesData[0]
    : year.localeCompare("2011") == 0
    ? boundariesData[1]
    : year.localeCompare("2015") == 0
    ? boundariesData[2]
    : year.localeCompare("2020") == 0
    ? boundariesData[3]
    : year.localeCompare("2025") == 0
    ? boundariesData[4]
    : "";
}

const boundariesChangedData = [
  "./data/2006 - 2011 Electoral Boundaries Changes.geojson",
  "./data/2011 - 2015 Electoral Boundaries Changes.geojson",
  "./data/2015 - 2020 Electoral Boundaries Changes.geojson",
  "./data/2020 - 2025 Electoral Boundaries Changes.geojson",
];

function getChangedBoundariesDataOfYear(year) {
  return year.localeCompare("2006") == 0
    ? boundariesChangedData[0]
    : year.localeCompare("2011") == 0
    ? boundariesChangedData[1]
    : year.localeCompare("2015") == 0
    ? boundariesChangedData[2]
    : year.localeCompare("2020") == 0
    ? boundariesChangedData[3]
    : "";
}

function canYearBeIncremented() {
  return yearIndex < maxIndex;
}

function updateButtons({ years, yearIndex }) {
  incrementButton.update({ years, yearIndex });
  decrementButton.update({ years, yearIndex });
  yearInfo.update({ years, yearIndex });
}

function incrementYear() {
  if (canYearBeIncremented()) {
    yearIndex += 1;
    displayedYear = years[yearIndex];
    updateButtons({ years, yearIndex });
    initialiseBoundariesOfYear(displayedYear);
  }
}

function canYearBeDecremented() {
  return yearIndex > 0;
}

function decrementYear() {
  if (canYearBeDecremented()) {
    yearIndex -= 1;
    displayedYear = years[yearIndex];
    updateButtons({ years, yearIndex });
    initialiseBoundariesOfYear(displayedYear);
  }
}

function getFollowingYear() {
  if (canYearBeIncremented()) {
    return years[yearIndex + 1];
  } else return displayedYear;
}

function interpolate(color1, color2, percent) {
  // Convert the hex colors to RGB values
  const r1 = parseInt(color1.substring(1, 3), 16);
  const g1 = parseInt(color1.substring(3, 5), 16);
  const b1 = parseInt(color1.substring(5, 7), 16);

  const r2 = parseInt(color2.substring(1, 3), 16);
  const g2 = parseInt(color2.substring(3, 5), 16);
  const b2 = parseInt(color2.substring(5, 7), 16);

  // Interpolate the RGB values
  const r = Math.round(r1 + (r2 - r1) * percent);
  const g = Math.round(g1 + (g2 - g1) * percent);
  const b = Math.round(b1 + (b2 - b1) * percent);

  // Convert the interpolated RGB values back to a hex color
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function getConstituencyWinMarginFillColour(winMargin) {
  // PAP won
  if (winMargin >= 0.0) {
    // Win margins are typically within 50%, so have the largest colour difference be between 0% - 50%
    if (winMargin <= 50.0) {
      return interpolate(
        redLowestColour,
        redMiddleColour,
        winMargin * 2.0 / 100.0,
      );
    }
    else {
      return interpolate(
        redMiddleColour,
        redHighestColour,
        (winMargin - 50.0) * 2.0 / 100.0,
      );
    }
  }
  // From lowest to middle colour
  else if (winMargin < 0.0) {
    const flippedWinMargin = winMargin * -1.0;
    
    if (flippedWinMargin <= 50.0) {
      return interpolate(
        blueLowestColour,
        blueMiddleColour,
        flippedWinMargin * 2.0 / 100.0,
      );
    }
    else {
      return interpolate(
        blueMiddleColour,
        blueHighestColour,
        (flippedWinMargin - 50.0) * 2.0 / 100.0,
      );
    }
  } else {
    return defaultColour;
  }
}

function getConstituencyOutlineColour(winMargin) {
  if (winMargin >= 0.0) {
    return redOutlineColour;
  } else if (winMargin < 0.0) {
    return blueOutlineColour;
  } else {
    return defaultColour;
  }
}

function resetHoverPopup() {
  if (hoverPopup) {
    hoverPopup.close();
    hoverPopup = null;
  }
}

fetch("./data/Election Results.csv")
  .then((response) => response.text())
  .then((data) => {
    results = Papa.parse(data).data;
    console.log(results);

    initialiseMap();
    initialiseBoundariesOfYear(displayedYear);
  });

function getPAPVoteShare(constituencyName) {
  const found = results.find(
    (element) =>
      element[0].localeCompare(displayedYear) == 0 &&
      element[1].localeCompare(constituencyName) == 0 &&
      element[4].localeCompare("PAP") == 0,
  );

  if (found) {
    voteShare = found[6];
    
    if (voteShare.localeCompare("na") == 0) {
      return 100.0;
    } else {
      return found[6] * 100.0;
    }
  } else {
    return -1;
  }
}

function getWinMargin(voteShare) { 
  if (voteShare >= 0.0) {
    return voteShare - (100.0 - voteShare);
  }
  else {
    return "NA";
  }
}

function onEachConstituency(feature, layer) {
  layer.on({
    mouseover: highlightConstituency,
    mouseout: resetConstituencyHighlight,
  });
}

function highlightConstituency(e) {
  const layer = e.target;
  
  const mainConstituencyName =
    layer.feature.properties["Constituency Name"];
  const mainConstituencyDescription =
    layer.feature.properties["Description"];

  layer.setStyle({
    weight: 3,
    fillOpacity: "0.8",
  });

  hoverPopup = L.popup(mousePosition, {
    offset: L.point(0, -15),
    autoPan: false,
    bubblingMouseEvents: true,
    closeButton: false,
    className: "hover-popup",
    pane: "hoverPopup",
  })
    .setContent(getConstituencyDefaultText(mainConstituencyName, mainConstituencyDescription))
    .openOn(map);

  layer.bringToFront();
}

function getConstituencyDefaultText(constituencyName, constituencyDescription) {
  const papVoteShare = getPAPVoteShare(constituencyName);
  const winMargin = getWinMargin(papVoteShare);

  return (
    "<h2>" +
    constituencyDescription +
    "</h2>\n" +
    getConstituencyResultsText(papVoteShare, winMargin)
  );
}

function getConstituencyResultsText(papVoteShare, winMargin) {
  return (papVoteShare >= 100.0
        ? "PAP Won Uncontested"
        : papVoteShare >= 0.0
        ? "PAP Vote Share: " + papVoteShare.toFixed(2) + "%" +
          "<h4>PAP Win Margin: " + winMargin.toFixed(2) + "%</h4>"
        : "No Data")
}

function resetConstituencyHighlight(e) {
  const layer = e.target;
  geojson.resetStyle(layer);
  layer.bringToBack();

  resetHoverPopup();
}

function onEachChangedBoundary(feature, layer) {
  layer.on({
    mouseover: highlightChangedBoundary,
    mouseout: resetChangedBoundaryHighlight,
    click: zoomToFeature,
  });
}

function highlightChangedBoundary(e) {
  const layer = e.target;

  layer.setStyle({
    weight: 3,
    fillOpacity: "0.35",
  });
  
  const papVoteShare = getPAPVoteShare(layer.feature.properties['Old Constituency Name']);
  const winMargin = getWinMargin(papVoteShare);

  hoverPopup = L.popup(mousePosition, {
    offset: L.point(0, -15),
    autoPan: false,
    bubblingMouseEvents: true,
    closeButton: false,
    className: "hover-popup",
    pane: "hoverPopup",
  })
    .setContent(
      "<h2>Changed Boundaries:</h2>\n" +
        "<h3>" +
        displayedYear +
        ": " +
        layer.feature.properties["Old Description"] +
        "</h3>\n" +
        getConstituencyResultsText(papVoteShare, winMargin) +
        "<h3>" +
        getFollowingYear() +
        ": " +
        layer.feature.properties["New Description"] + 
        "</h3>"
    )
    .openOn(map);

  layer.bringToFront();
}

function resetChangedBoundaryHighlight(e) {
  changedGeojson.resetStyle(e.target);

  resetHoverPopup();
}
function exitOverlay() {
  resetOverlay();
  resetGeojsons();
}

function resetOverlay() {
  resetHoverPopup();
  map.setMaxBounds(maxBounds);

  if (exitOverlayButton) {
    exitOverlayButton.remove();
    exitOverlayButton = null;
  }
  if (overlayBackground) {
    overlayBackground.remove();
    overlayBackground = null;
  }

  if (voteMarginLegend) {
    voteMarginLegend.remove();
    voteMarginLegend = null;
  }
}

function resetGeojsons() {
  geojson.resetStyle();
  geojson.eachLayer(function (layer) {
    layer.off();
    onEachConstituency(layer.feature, layer);
  });

  changedGeojson.resetStyle();
  changedGeojson.eachLayer(function (layer) {
    layer.off();
    onEachChangedBoundary(layer.feature, layer);
  });
}

function initialiseMap() {
  var blank = L.tileLayer("");

  var osmHOT = L.tileLayer(
    "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution:
        "© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team hosted by OpenStreetMap France",
    },
  );

  map = L.map("map", {
    layers: [blank],
    zoomControl: false,
  })
    .setView([1.3521, 103.8198], 10.5)
    .setMinZoom(10.5)
    .setMaxZoom(15)
    .setMaxBounds(maxBounds);

  var baseMaps = {
    Blank: blank,
    "OpenStreetMap.HOT": osmHOT,
  };

  layerControl = L.control.layers(baseMaps).addTo(map);

  var hoverPopupPane = map.createPane("hoverPopup");
  hoverPopupPane.style.zIndex = 1500;
  hoverPopupPane.style.pointerEvent = "none";

  map.addEventListener("mousemove", (event) => {
    mousePosition = event.latlng;

    if (hoverPopup) {
      hoverPopup.setLatLng(mousePosition);
    }
  });

  yearInfo = new LControlInfo(container);
  yearInfo.addTo(map);

  decrementButton = new LControlDecrementButton(container);
  decrementButton.addTo(map);

  incrementButton = new LControlIncrementButton(container);
  incrementButton.addTo(map);
  updateButtons({ years, yearIndex });

  // initialiseConstituencyLegend
  var legend = L.control({ position: "bottomright" });

  legend.onAdd = function (map) {
    var div = L.DomUtil.create("div", "mainLegend");
    div.innerHTML += "<h4>Legend</h4>";
    div.innerHTML += "<h3>PAP Win Margin</h3>";
    div.innerHTML += "<h2L>-100%</h2L>";
    div.innerHTML += "<h2R>100%</h2R><br><br>";
    for (let i = -100; i < 100; ++i) {
      div.innerHTML += '<i style="background:' + getConstituencyWinMarginFillColour(i) + '"></i>';
    }

    return div;
  };

  legend.addTo(map);
}

function initialiseBoundariesOfYear(year) {
  resetOverlay();

  if (geojson) {
    geojson.remove();
  }

  function styleMap(feature) {
    const papVoteShare = getPAPVoteShare(feature.properties["Constituency Name"]);    
    const winMargin = getWinMargin(papVoteShare);
    
    return {
      fillColor: getConstituencyWinMarginFillColour(winMargin),
      weight: 1.5,
      opacity: 1,
      color: getConstituencyOutlineColour(winMargin),
      fillOpacity: "0.75",
      dashOpacity: "0.5",
      zIndex: 200,
    };
  }
  
  geojson = L.geoJSON
    .ajax(getBoundariesDataOfYear(year), {
      style: styleMap,
      onEachFeature: onEachConstituency,
    })
    .addTo(map);
    
  console.log(geojson);

  initialiseChangedBoundariesOfYear(year);
}

function initialiseChangedBoundariesOfYear(year) {
  if (changedGeojson) {
    changedGeojson.remove();
    layerControl.removeLayer(changedGeojson);
  }

  changedGeojson = L.geoJSON.ajax(getChangedBoundariesDataOfYear(year), {
    style: styleChangedBoundariesInactive,
    onEachFeature: onEachChangedBoundary,
  });

  var overlayChangedBoundaries = {
    "Show Changed Boundaries": changedGeojson,
  };

  layerControl.addOverlay(changedGeojson, "Show Changed Boundaries");

  function styleChangedBoundariesInactive(feature) {
    return {
      fillColor: "black",
      weight: 2,
      opacity: 1,
      color: "black",
      fillOpacity: "0.55",
      dashOpacity: "1",
      dashArray: "4 5",
      zIndex: 600,
      bubblingMouseEvents: false,
    };
  }
}

function zoomToFeature(e) {
  const positiveDifferenceHighestColour = "#7f3b08";
  const positiveDifferenceMiddleColour = "#b35806";
  const positiveDifferenceLowestColour = "#fee0b6";
  const positiveDifferenceOutlineColour = "#662506";
  
  const negativeDifferenceHighestColour = "#2d004b";
  const negativeDifferenceMiddleColour = "#542788 ";
  const negativeDifferenceLowestColour = "#4d004b";
  const negativeDifferenceOutlineColour = "#003c30";

  const selectedConstituencyLayer = e.target;
  const selectedConstituencyName =
    selectedConstituencyLayer.feature.properties["Old Constituency Name"];
  const selectedConstituencyDescriptn =
    selectedConstituencyLayer.feature.properties["Old Description"]
  var mainConstituency;
  var allRemovedBoundariesLayers = [];
  var allAddedBoundariesLayers = [];
  var focusedFeatures = [];

  resetHoverPopup();

  changedGeojson.eachLayer(function (layer) {
    const oldConstituencyName =
      layer.feature.properties["Old Constituency Name"];
    const newConstituencyName =
      layer.feature.properties["New Constituency Name"];

    layer.off();

    // Find the list of constituencies that this constituency's boundaries has been moved to
    if (selectedConstituencyName.localeCompare(oldConstituencyName) == 0) {
      layer.on({
        mouseover: highlightRemovedBoundary,
        mouseout: resetRemovedBoundaryHighlight,
      });

      allRemovedBoundariesLayers.push(layer);
      focusedFeatures.push(layer);
    }

    // Find the list of constituencies that have been added to this constituency's boundaries
    else if (
      doesBoundaryNameMatch(newConstituencyName, selectedConstituencyName)
    ) {
      layer.on({
        mouseover: highlightAddedBoundary,
        mouseout: resetAddedBoundaryHighlight,
      });
      allAddedBoundariesLayers.push(layer);
      focusedFeatures.push(layer);
    }

    // Hide all other layers
    else {
      layer.setStyle({
        weight: 1,
        fillOpacity: 0.03,
        opacity: 0.1,
      });
    }
  });

  geojson.eachLayer(function (layer) {
    const constituencyName = layer.feature.properties["Constituency Name"];

    layer.off();

    // Find the main constituency's layer
    if (doesBoundaryNameMatch(constituencyName, selectedConstituencyName)) {
      focusedFeatures.push(layer);

      mainConstituency = layer;

      mainConstituency.on({
        mouseover: highlightMainConstituency,
        mouseout: resetMainConstituencyHighlight,
      });
    } else {
      layer.setStyle({
        weight: 1,
        fillOpacity: 0.05,
        opacity: 0.1,
      });
    }
  });

  styleMainConstituency();
  styleRemovedBoundaries();
  styleAddedBoundaries();

  console.log(focusedFeatures);

  const featureGroup = L.featureGroup(focusedFeatures);
  const featureBounds = featureGroup.getBounds();
  const paddedBounds = featureBounds.pad(1.1);
  const backgroundBounds = maxBounds.pad(1.5);

  const desiredZoom = map.getBoundsZoom(featureBounds, false);
  map.setZoom(desiredZoom);
  map.setMaxBounds(paddedBounds);
  map.fitBounds(featureBounds);

  // Black background
  overlayBackground = L.rectangle(backgroundBounds, {
    fillColor: "black",
    fillOpacity: "0.7",
  })
    .addTo(map)
    .bringToBack();

  // Button to exit the overlay
  L.Control.ExitOverlayButton = L.Control.extend({
    options: {
      position: "bottomleft",
    },
    onAdd: function (map) {
      var button = L.DomUtil.create("span", "info");
      button.innerHTML = "Exit Overlay";
      L.DomEvent.disableClickPropagation(button);
      L.DomEvent.on(button, "click", function () {
        exitOverlay();
        this.remove();
      });

      return button;
    },
    onRemove: function (map) {},
  });

  exitOverlayButton = new L.Control.ExitOverlayButton();
  exitOverlayButton.addTo(map);

  initialiseVoteMarginLegend();

  function initialiseVoteMarginLegend() {
    voteMarginLegend = L.control({ position: "bottomright" });

    voteMarginLegend.onAdd = function (map) {
      var div = L.DomUtil.create("div", "mainLegend");
      div.innerHTML += "<h4>Legend</h4>";
      div.innerHTML += "<h3>PAP Win Margin</h3>";
      // for (let i = 0; i < 100; ++i) {
        // div.innerHTML += '<i style="background:' + getFillColour(i) + '"></i>';
      // }

      return div;
    };

    voteMarginLegend.addTo(map);
  }

  function styleMainConstituency() {
    mainConstituency.setStyle({
      weight: 4,
    });
  }

  function styleRemovedBoundaries() {
    for (const removedBoundary of allRemovedBoundariesLayers) {
      styleRemovedBoundary(removedBoundary);
    }
  }

  function styleRemovedBoundary(removedBoundary) {
    removedBoundary.setStyle({
      fillColor: "#80cdc1",
      weight: 3,
      color: "#01665e",
      fillOpacity: "0.85",
    });
  }

  function styleAddedBoundaries() {
    for (const addedBoundary of allAddedBoundariesLayers) {
      styleAddedBoundary(addedBoundary);
    }
  }

  function styleAddedBoundary(addedBoundary) {
    const addedFromConstituencyName =
      addedBoundary.feature.properties["Old Constituency Name"];
    const selectedConstituencyVoteShare = getPAPVoteShare(
      selectedConstituencyName,
    );
    const selectedConstituencyWinMargin = getWinMargin(
      selectedConstituencyVoteShare,
    );
    const addedFromConstituencyVoteShare = getPAPVoteShare(
      addedFromConstituencyName,
    );
    const addedFromConstituencyWinMargin = getWinMargin(
      addedFromConstituencyVoteShare,
    );
    // From added, minus, selected, to highlight boundary changes from strongholds
    const voteMarginDifference =
      addedFromConstituencyWinMargin - selectedConstituencyWinMargin;

    addedBoundary.setStyle({
      fillColor: getWinMarginDifferenceFillColour(voteMarginDifference),
      color: getWinMarginDifferenceLineColour(voteMarginDifference),
      weight: 3,
      fillOpacity: "0.85",
    });
  }

  function highlightMainConstituency(e) {
    styleMainConstituency();

    const layer = e.target;
    
    const constituencyName = layer.feature.properties["Constituency Name"];
    const constituencyDescription = layer.feature.properties["Description"];

    layer.setStyle({
      fillOpacity: "1.0",
    });

    hoverPopup = L.popup(mousePosition, {
      offset: L.point(0, -15),
      autoPan: false,
      bubblingMouseEvents: true,
      closeButton: false,
      className: "hover-popup",
      pane: "hoverPopup",
    })
      .setContent(getConstituencyDefaultText(constituencyName, constituencyDescription))
      .openOn(map);
  }

  function highlightRemovedBoundary(e) {
    var layer = e.target;
    
    const constituencyName = layer.feature.properties["Old Constituency Name"];
    const constituencyDescription = layer.feature.properties["Old Description"];

    layer.setStyle({
      weight: 3,
      fillOpacity: "1.0",
    });

    hoverPopup = L.popup(mousePosition, {
      offset: L.point(0, -15),
      autoPan: false,
      bubblingMouseEvents: true,
      closeButton: false,
      className: "hover-popup",
      pane: "hoverPopup",
    })
      .setContent(
        getConstituencyDefaultText(constituencyName, constituencyDescription) +
          "<h3>Moved in " + 
          getFollowingYear() +
          " to</h3>" +
          layer.feature.properties["New Description"]
      )
      .openOn(map);

    layer.bringToFront();
  }

  function resetRemovedBoundaryHighlight(e) {
    styleRemovedBoundary(e.target);

    resetHoverPopup();
  }

  function highlightAddedBoundary(e) {
    var layer = e.target;

    const addedConstituencyName =
      layer.feature.properties["Old Constituency Name"];
    const addedConstituencyDescription =
      layer.feature.properties["Old Description"];
      
     const mainConstituencyName =
      mainConstituency.feature.properties["Constituency Name"];
    const mainConstituencyDescription =
      mainConstituency.feature.properties["Description"];

    const mainConstituencyVoteShare = getPAPVoteShare(
      selectedConstituencyName,
    );
    const mainConstituencyWinMargin = getWinMargin(mainConstituencyVoteShare);
    const addedConstituencyVoteShare = getPAPVoteShare(
      addedConstituencyName,
    );
    const addedConstituencyWinMargin = getWinMargin(addedConstituencyVoteShare);

    const WinMarginDifference =
      addedConstituencyWinMargin - mainConstituencyWinMargin;

    layer.setStyle({
      weight: 3,
      fillOpacity: "1.0",
    });

    hoverPopup = L.popup(mousePosition, {
      offset: L.point(0, -15),
      autoPan: false,
      bubblingMouseEvents: true,
      closeButton: false,
      className: "hover-popup",
      pane: "hoverPopup",
    })

      .setContent(
        getConstituencyDefaultText(mainConstituencyName, mainConstituencyDescription) +
          "<h3>Moved in " + 
          getFollowingYear() + 
          " from</h3>" +
          getConstituencyDefaultText(addedConstituencyName, addedConstituencyDescription)
      )
      .openOn(map);

    layer.bringToFront();
  }

  function resetAddedBoundaryHighlight(e) {
    styleAddedBoundary(e.target);

    resetHoverPopup();
  }

  function resetMainConstituencyHighlight(e) {
    styleMainConstituency();

    resetHoverPopup();
  }

  function getWinMarginDifferenceFillColour(percentageDifference) {
    if (percentageDifference > 0.0) {
      if (percentageDifference <= 50.0) {
        return interpolate(
          positiveDifferenceLowestColour,
          positiveDifferenceMiddleColour,
          percentageDifference * 2.0 / 100.0,
        );
      }
      else {
        return interpolate(
          positiveDifferenceMiddleColour,
          positiveDifferenceHighestColour,
          (percentageDifference - 50.0) * 2.0 / 100.0,
        );
      }
    } else {
      const flippedPercentageDifference = percentageDifference * -1.0;
      
      if (flippedPercentageDifference <= 50.0) {
        return interpolate(
          negativeDifferenceLowestColour,
          negativeDifferenceMiddleColour,
          flippedPercentageDifference * 2.0 / 100.0,
        );
      }
      else {
        return interpolate(
          negativeDifferenceMiddleColour,
          negativeDifferenceHighestColour,
          (flippedPercentageDifference - 50.0) * 2.0 / 100.0,
        );
      }
    }
  }

  function getWinMarginDifferenceLineColour(percentageDifference) {
    if (percentageDifference > 0.0) {
      return positiveDifferenceOutlineColour;
    } else {
      return negativeDifferenceOutlineColour;
    }
  }
}
