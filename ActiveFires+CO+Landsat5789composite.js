//General Settings:

//Date range for active fire and carbon monoxide data:
var start_date_fire_co = '2023-06-01';
var end_date_fire_co = '2023-06-15';

//Date range for Landsat imagery:
var start_date_landsat = '2023-06-01';
var end_date_landsat = '2023-07-10';

//Datasets
//Provincial Boundary
var Ontario = ee.FeatureCollection('FAO/GAUL_SIMPLIFIED_500m/2015/level1')
  .filter(
      ee.Filter.eq('ADM1_NAME','Ontario')
      );

//FIRMS Active Fires
var Fire_dataset = ee.ImageCollection('FIRMS') //Adjust the name of the dataset
.filter(
    ee.Filter.date(start_date_fire_co, end_date_fire_co) //filters the data to a date range
    );
var fires = Fire_dataset.select('T21').mean(); //selects a 'band' in Fire_dataset called 'T21'

//Tropomi/Sentinel-5P Carbon Monoxide
var CO_collection = ee.ImageCollection('COPERNICUS/S5P/NRTI/L3_CO')
  .select('CO_column_number_density')
  .filterDate(start_date_fire_co, end_date_fire_co); //filters the collection of images by date

//Landsat 9
// function to apply Landsat scaling factors.
function applyScaleFactors(image) {
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0);
  return image.addBands({srcImg: opticalBands, overwrite: true})
              .addBands({srcImg: thermalBands, overwrite: true});
}

function QALandsat(image) {
      var qa = image.select('QA_PIXEL');
      // QA flags are stored as a bitmask. We need to decode the information in the 16 bit binary number.
      // the leftShift function shifts a binary number by the specified number of positions e.g. 0000001 to 0000010.
      // This allows us to extract the bit we want to check without converting to/from binary numbers.
      // First we identify the bit we're interested in for each quality flag:
      // Note: the first bit position is bit 0
      var DilatedCloud = ee.Number(1).leftShift(1);  // 000000010 i.e. from shifting 0000001 left by 1 position
      var Cirrus =       ee.Number(1).leftShift(2);  // 000000100 i.e. from shifting 0000001 left by 2 positions
      var Cloud =        ee.Number(1).leftShift(3);  // 000001000
      var CloudShadow =  ee.Number(1).leftShift(4);  // 000010000
      var Snow =         ee.Number(1).leftShift(5);  // 000100000
      var Clear =        ee.Number(1).leftShift(6);  // 001000000
      var Water =        ee.Number(1).leftShift(7);  // 010000000

      // Next we test if the bit value in the QA pixel 
      // and our value defined above are set to 0 in the bit position we're interested in
      // i.e. bitwiseAnd of 110111000 and 
      //                    001000000 is 0000000000, or equal to 0
      // whereas bitwiseAnd of  001001000 and
      //                        001000000 is 001000000, or not equal to 0
      // we test each of the bits we're interested in separately:
      
      //Two options:
      var clearPixels1 = qa.bitwiseAnd(Clear).neq(0);
      
      var clearPixels2 = 
             qa.bitwiseAnd(DilatedCloud).eq(0) 
        .and(qa.bitwiseAnd(Cirrus).eq(0))
        .and(qa.bitwiseAnd(Cloud).eq(0))
        .and(qa.bitwiseAnd(CloudShadow).eq(0))
        .and(qa.bitwiseAnd(Snow).eq(0))
        //.and(qa.bitwiseAnd(Water).eq(0)); // we can comment/uncomment each line to select what we wish to mask
        
      return image.updateMask(clearPixels2); //applies the mask to each pixel in the image
    }

// Assign a common name to the sensor-specific bands.
var LC9_BANDS = ['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7', 'ST_B10']; // Landsat 8
var LC8_BANDS = ['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7', 'ST_B10']; // Landsat 8
var LC7_BANDS = ['SR_B1', 'SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B7', 'ST_B6']; // Landsat 7
var LC5_BANDS = ['SR_B1', 'SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B7', 'ST_B6']; // Landsat 5
var STD_NAMES = ['blue', 'green', 'red', 'nir', 'swir1', 'swir2', 'temp'];

var preprocessLandsat = function (startDate,endDate) {
    var QALandsat = function(image) {
      var qa = image.select('QA_PIXEL');
      var DilatedCloud = 1 << 1;
      var Cirrus = 1 << 2;
      var Cloud = 1 << 3;
      var CloudShadow = 1 << 4;
      var Snow = 1 << 5;
      var Water = 1 << 7;
      var mask = qa
        .bitwiseAnd(DilatedCloud)
        .eq(0)
        .and(qa.bitwiseAnd(Cirrus).eq(0))
        .and(qa.bitwiseAnd(Cloud).eq(0))
        .and(qa.bitwiseAnd(CloudShadow).eq(0))
        .and(qa.bitwiseAnd(Snow).eq(0));
      // .and(qa.bitwiseAnd(Water).eq(0));

      return image.updateMask(mask);
    };
 var Landsat9 = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2')
    .filterDate(startDate,endDate)
    .map(applyScaleFactors)
    .map(QALandsat)
    .select(LC9_BANDS, STD_NAMES);
    
  var Landsat8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filterDate(startDate,endDate)
    .map(applyScaleFactors)
    .map(QALandsat)
    .select(LC8_BANDS, STD_NAMES);
  
  var Landsat7 = ee.ImageCollection('LANDSAT/LE07/C02/T1_L2')
    .filterDate(startDate,endDate)
    .map(applyScaleFactors)
    .map(QALandsat)
    .select(LC7_BANDS, STD_NAMES);
  
  var Landsat5 = ee.ImageCollection('LANDSAT/LT05/C02/T1_L2')
    .filterDate(startDate,endDate)
    .map(applyScaleFactors)
    .map(QALandsat)
    .select(LC5_BANDS, STD_NAMES);

var Landsat_merge = Landsat9.merge(Landsat8).merge(Landsat7).merge(Landsat5);

   
return Landsat_merge.median().rename(STD_NAMES);
};

var Landsat_composite =  preprocessLandsat(start_date_landsat, end_date_landsat)
print(Landsat_composite.getInfo())
// NDVI = (NIR-RED)/(NIR+RED)
var NDVI = Landsat_composite.select('nir').subtract(Landsat_composite.select('red'))
   .divide(Landsat_composite.select('nir').add(Landsat_composite.select('red')));

// NBR = (NIR-SWIR)/(NIR+SWIR)
var NBR = Landsat_composite.select('nir').subtract(Landsat_composite.select('swir2'))
  .divide(Landsat_composite.select('nir').add(Landsat_composite.select('swir2')));


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

//Landsat True Colour
var visualizationTrueColor = {
  bands: ['red', 'green', 'blue'],
  min: 0.0,
  max: 0.3
};

//Landsat False Colour - Vegetation
var visualizationFC = {
  bands: ['nir', 'red', 'green'],
  min: 0.0,
  max: 0.5
};

//Landsat False Colour - Fire
var visualizationFire = {
  bands: ['swir2', 'nir', 'red'],
  min: 0.0,
  max: 0.5
};


//Add layers to the map:

Map.centerObject({object: Ontario, zoom: 4}); //Centers the map on Ontario, at zoom level 4

Map.addLayer(CO_collection.mean(), COviz, 'S5P CO'); //adds mean CO column density to the map
Map.addLayer(Landsat_composite, visualizationTrueColor, 'True Colour (432)');
Map.addLayer(Landsat_composite, visualizationFire, 'False Colour (754)');
Map.addLayer(Landsat_composite, visualizationFC, 'False Colour (543)');
Map.addLayer(
  {eeObject: NDVI,
   visParams: {palette : ['purple','white','green'], 
   min: 0, max: 0.7},
   name: 'NDVI'
  });
Map.addLayer(
  {eeObject: NBR,
    visParams: {palette : ['purple','white','green'], 
    min: -0.7, max: 0.7},
    name: 'NBR'
  });
Map.addLayer({eeObject: fires, visParams: firesVis, name: 'Active Fires'}); //adds the fires to the map
Map.addLayer({eeObject: Ontario, opacity: 0.5, name: 'Ontario'}); // add Ontario to the map

  
  
