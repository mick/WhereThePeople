var fs = require("fs");
var csv = require("csv");


var output = {};

var population = [];

function getPopulation(state, county){


  for(p in population){
    var pop = population[p];
    if((state === pop[3]) && (county === pop[4])){

      return pop[10];

    }
  }
  return "0";
}


function combineFIPS(zipcodes, population){

  csv()
    .from.stream(fs.createReadStream(__dirname+'/us_fips.csv'))
    .transform( function(data){
      return data;
    })
    .on('record', function(data,index){


      zipcodes.forEach(function(zip){
        
        if((data[0].toLowerCase() === zip[4].toLowerCase()) 
           && (data[1].toLowerCase() === zip[5].toLowerCase())){

          //console.log("Match: ", data[0], " - ", zip[4], "  ", data[1], " - ", zip[5]);

          output[zip[0]] = {state:data[0],
                           stateFips:data[2],
                           countyFips:data[3],
                           lat:parseInt(zip[1]),
                           lon:parseInt(zip[2]),
                           county:data[1],
                           population:getPopulation(data[2], data[3])};
          
          console.log(output[zip[0]].county, output[zip[0]].population);

        }
      });



    })
    .on('end', function(count){
      console.log('Number of lines: '+count);

      fs.writeFileSync("zipcodes.json", JSON.stringify(output));


    })
    .on('error', function(error){
      console.log("fips", error);
    });





}
var ready = false;


var zipcodes = [];
var population = [];

csv()
  .from.stream(fs.createReadStream(__dirname+'/zip_codes.csv'))
  .transform( function(data){
    return data;
  })
  .on('record', function(data,index){

    zipcodes.push(data);

  })
  .on('end', function(count){
    console.log('Number of lines: '+count);

    if(ready)
      combineFIPS(zipcodes, population);
    else
      ready = true
  })
  .on('error', function(error){
    console.log("zipcodes", error);
  });



csv()
  .from.stream(fs.createReadStream(__dirname+'/population.csv'))
  .transform( function(data){
    return data;
  })
  .on('record', function(data,index){

    population.push(data);

  })
  .on('end', function(count){
    console.log('Number of lines: '+count);

    if(ready)
      combineFIPS(zipcodes, population);
    else
      ready = true
  })
  .on('error', function(error){
    console.log("pop", error);
  });


