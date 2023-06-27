//General Settings:
var start_date = '2023-05-01';
var end_date = '2023-06-30';

//Datasets
//Provincial Boundary
var Ontario = ee.FeatureCollection('FAO/GAUL_SIMPLIFIED_500m/2015/level1')
  .filter(
      ee.Filter.eq('ADM1_NAME','Ontario')
      );

//FIRMS Active Fires
var Fire_dataset = ee.ImageCollection('FIRMS') //Adjust the name of the dataset
.filter(
    ee.Filter.date(start_date, end_date) //filters the data to a date range
    );
var fires = Fire_dataset.select('T21'); //selects a 'band' in Fire_dataset called 'T21'

//Tropomi/Sentinel-5P Carbon Monoxide
var CO_collection = ee.ImageCollection('COPERNICUS/S5P/NRTI/L3_CO')
  .select('CO_column_number_density')
  .filterDate(start_date, end_date); //filters the collection of images by date

// Visualization settings
var firesVis = { 
  min: 325.0,
  max: 400.0,
  palette: ['red', 'orange', 'yellow'],
};
var COviz = { 
  min: 0,
  max: 0.05,
  palette: ['black', 'blue', 'purple', 'cyan', 'green', 'yellow', 'red']
};


//Add layers to the map:
Map.centerObject({object: Ontario, zoom: 4}); //Centers the map on Ontario, at zoom level 4

Map.addLayer(CO_collection.mean(), COviz, 'S5P CO'); //adds mean CO column density to the map
Map.addLayer({eeObject: Ontario, opacity: 0.5, name: 'Ontario'}); // add Ontario to the map
Map.addLayer({eeObject: fires, visParams: firesVis, name: 'Fires'}); //adds the fires to the map
