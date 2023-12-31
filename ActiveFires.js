var start_date = '2023-05-01';
var end_date = '2023-06-30';

var Ontario = ee.FeatureCollection('FAO/GAUL_SIMPLIFIED_500m/2015/level1')
  .filter(
      ee.Filter.eq('ADM1_NAME','Ontario')
      );
Map.addLayer({eeObject: Ontario, opacity: 0.25, name: 'Ontario'}); // add Ontario to the map
var Fire_dataset = ee.ImageCollection('FIRMS') //Adjust the name of the dataset
.filter(
    ee.Filter.date(start_date, end_date) //filters the data to a date range
    );
var fires = Fire_dataset.select('T21'); //selects a 'band' in Fire_dataset called 'T21'
var firesVis = { //sets up visualization settings 
  min: 325.0,
  max: 400.0,
  palette: ['red', 'orange', 'yellow'],
};
//Map.setCenter(-119.086, 47.295, 6); //Focuses on an area of interest
Map.centerObject({object: Ontario, zoom: 4}); //Centers the map on Ontario, at zoom level 4
Map.addLayer({eeObject: fires, visParams: firesVis, name: 'Fires'}); //adds the fires to the map

