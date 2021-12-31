
var maxDaysForRedMarker = 365
var maxDaysForYellowMarker = 365 * 2
var GOOGLE_MAPS_API_KEY = "";



// Entry Point
function initMap() {
	setupGmap();
	document.getElementById('fileinput').addEventListener('change', readMultipleFiles, false);
}

function setupGmap() {
	gmap.map = new google.maps.Map(document.getElementById('map'), {
		zoom: 13,
		center: {lat: 39.943302, lng: -88.4942455},
	});
	//gmap.map.addListener('zoom_changed', callback);

	gmap.geocoder = new google.maps.Geocoder();
}

// Data
function School(index, name, address, provider, futureIssue, contact, note, lat, long) {
	this.index = index;
	this.name = name;
	this.address = address
	this.provider = provider;
	this.futureIssue = futureIssue;
	this.contact = contact;
	this.note = note;

	this.daysUntilReissue = null;
	if(futureIssue && futureIssue != "?") {
		this.daysUntilReissue = daysBetween(new Date(), new Date(this.futureIssue));
	}


	if(lat && long)
		this.point = google.maps.LatLng(lat, long);
}

var allSchools = [];
var filteredSchools = [];
var gmap = {
	map: null,
	geocoder: null,
	markers: [],
};

async function onLoadData(data) {
	var offset = 0;
	var index = 0;
	for(var row = 0; row < data.length; ++row) {
		schoolData = data[row];

		school = new School(
			index,
			data[row][offset + 0], // name
			data[row][offset + 0], // address
			data[row][offset + 2], // provider
			data[row][offset + 3], // futureIssue
			data[row][offset + 4], // contact
			data[row][offset + 6], // note
			data[row][offset + 7], // lat
			data[row][offset + 8]  // long
		);

		if(school.name) {
			allSchools.push(school);
			++index;
		}
	}

	await computeSchoolPoints();
}

// mouseover label
function makeLabelForSchool(school) {
	var string = "";
	string += "<table style='width:100%>'";

	string += "<tr>";
	string += "<td>" + "Name" + "</td>";
	string += "<td>" + school.name + "</td>";
	string += "</tr>";

	string += "<tr>";
	string += "<td>" + "Provider" + "</td>";
	string += "<td>" + school.provider + "</td>";
	string += "</tr>";

	string += "<tr>";
	string += "<td>" + "Future Issue" + "</td>";
	string += "<td>" + school.futureIssue + " (" + school.daysUntilReissue + " days)" +  "</td>";
	string += "</tr>";

	string += "<tr>";
	string += "<td>" + "Last Contact" + "</td>";
	string += "<td>" + school.contact + "</td>";
	string += "</tr>";

	string += "<tr>";
	string += "<td>" + "Note" + "</td>";
	string += "<td>" + school.note + "</td>";
	string += "</tr>";

	string += "</table>";
	return string;
}

async function computeSchoolPoints() {
	for(var i = 0; i < allSchools.length; ++i) {
		assignPoint(allSchools[i], i == allSchools.length - 1);
	}

	// wait for all gecodes to finish
	sleep(30);
	onHaveAllPoints();
}

var totalPointsNeeded = 0;
var totalPoints=0;
async function assignPoint(school) {
	// if we have a latlong
	if(school.point)
		return;
	totalPointsNeeded += 1;
	//sleep(1);

	data = await getLatLong(school.address);
	if (data && data.results && data.results[0] && data.results[0].geometry) {
		geo = data.results[0].geometry;
		school.point = geo.location;
	} else
		alert("Geocode failed:" + data.status + " " + school.address);

	createMarker(school);
}

function onHaveAllPoints() {
	gmap.map.setCenter(allSchools[0].point);
	gmap.map.setZoom(7);
	refreshMarkers();
}

function refreshMarkers() {
	updateMarkerView(null); 
	gmap.markers.length = 0; // clear markers

	allSchools.forEach(school => {
		createMarker(school);
	});
}

var first = 0;
function createMarker(school) {
	if(first == 0)
	{
		first = 1;
		gmap.map.setCenter(allSchools[0].point);
		gmap.map.setZoom(7);
	}

	var infowindow =  new google.maps.InfoWindow({
		content: ""
	});

	var marker = new google.maps.Marker({
		map: gmap.map,
		position: school.point,
		icon:
		{
			url: findIconUrlForSchool(school)
		}
	});
	marker.schoolIndex = school.index; // let us find this marker later
	bindInfoWindow(marker, gmap.map, infowindow, makeLabelForSchool(school));
	gmap.markers.push(marker);
}

function findIconUrlForSchool(school) {
	let colorByProvider = !!document.getElementById('colorByProvider').checked;
	if(colorByProvider)
		return getColorIconFromProvider(school);
	else
		return getColorIconFromFutureIssue(school);
}

function getColorIconFromProvider(school) {
	let provider = school.provider.toLowerCase();
	if(provider == "kendall king" || provider == "kings fci")
		return "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
	if(provider == "first midstate" || provider == "kevil wills")
		return "http://maps.google.com/mapfiles/ms/icons/ltblue-dot.png";
	if(provider == "stifel")
		return "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
	if(provider == "bernardi")
		return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
	if(provider == "pma")
		return "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";

	return "http://maps.google.com/mapfiles/ms/icons/purple-dot.png";
}

function getColorIconFromFutureIssue(school) {
	if(!school.daysUntilReissue)
		return "http://maps.google.com/mapfiles/ms/icons/purple-dot.png"; // no valid value

	let days = school.daysUntilReissue
	if(days < maxDaysForRedMarker)
		return "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
	if(days < maxDaysForYellowMarker) // two years
		return "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
	else
		return "http://maps.google.com/mapfiles/ms/icons/ltblue-dot.png";
}

function bindInfoWindow(marker, map, infowindow, html) {
	google.maps.event.addListener(marker, "mouseover", function() {
		infowindow.setContent(html); 
		infowindow.open(map, marker); 
	});
	google.maps.event.addListener(marker, "mouseout", function() {
		infowindow.close(map, marker); 
	});
}

function updateMarkerView(map) {
	gmap.markers.forEach(marker => {
		marker.setMap(map);
	});
}

// Utility
function sleep(milliseconds) {
	var currentTime = new Date().getTime();

	while (currentTime + milliseconds >= new Date().getTime()) {
	}
}

function daysBetween(firstDate, secondDate) {
	var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
	var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime())/(oneDay)));
	return diffDays;
}

async function getLatLong (address) {
	let url = "https://maps.googleapis.com/maps/api/geocode/json?address="
	+ address + 
	"&key=" + GOOGLE_MAPS_API_KEY;
	let response = await fetch(url);
	let data = await response.json();
	return data;
}

function readMultipleFiles(evt) {
    //Retrieve all the files from the FileList object
    var files = evt.target.files;

    if (files) {
        for (var i = 0, file; file = files[i]; i++) {
            var fileReader = new FileReader();
            
            fileReader.onload = (function (file) {
                return function (e) {
                    onLoadData(readTsv(e.target.result));
                };
            })
            (file);

            fileReader.readAsText(file);
        }
    } else {
        alert("Failed to load files");
    }
}

function readTsv(values) {
	var startX = 7;
	var startY = 4;

	var x = values.split('\n');
	for (var i=0; i<x.length; i++) {
	    y = x[i].split('\t');
	    x[i] = y.slice(startY, y.length);
	}
	x = x.slice(startX, x.length);
	return x;
}


