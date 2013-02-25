var fs = require("fs");

var days = {};
//var counties = {};

//var data = JSON.parse(fs.readFileSync("data/511da0556ce61c8522000016.json"));
//var data = JSON.parse(fs.readFileSync("data/50cac54dc988d4d27b00000b.json"));
//var data = JSON.parse(fs.readFileSync("data/5111bfdd0aa04d9c7700000b.json"));
//var data = JSON.parse(fs.readFileSync("data/50cac54dc988d4d27b00000b.json"));

var zipcodes = JSON.parse(fs.readFileSync("data/zipcodes.json"));

module.exports.genMap = function(data, petitionId, cb){ 


  var baseCounties = {};
  for(z in zipcodes){
    var zip = zipcodes[z];
    baseCounties[parseInt(zip.stateFips, 10)+""+zip.countyFips] = {count:0, pop:zip.population}
  }


  var found =0;


  var min, max;

  data.forEach(function(d){
    if((min === undefined) || (min > d.created))
      min = d.created;
    if((max === undefined) || (max < d.created))
      max = d.created;

  });
  console.log("min/max:", min, max, Math.round((((max-min)/60)/60)/24));



  data.forEach(function(d){
    if(d.zip == null)
      return;

    if(days[Math.floor(d.created/86400)*86400+""] === undefined){
      days[Math.floor(d.created/86400)*86400+""] = {};
      for(c in baseCounties){
        days[Math.floor(d.created/86400)*86400+""][c] = {};
        days[Math.floor(d.created/86400)*86400+""][c].count = baseCounties[c].count;
        days[Math.floor(d.created/86400)*86400+""][c].pop = baseCounties[c].pop;
      }
    }


    var counties = days[Math.floor(d.created/86400)*86400+""];

    var zipcode = d.zip.trim();
    zipcode = zipcode.split("-")[0];

    if(zipcodes[zipcode] == undefined){
      //console.log("didnt find", zipcode);
      return;
    }
    
    var stateFips = zipcodes[zipcode].stateFips;
    if(stateFips.substring(0,1) === "0"){
      stateFips = stateFips.substring(1,2);
    }

    found++;
    if(counties[stateFips+zipcodes[zipcode].countyFips] !== undefined)
      counties[stateFips+zipcodes[zipcode].countyFips].count+=1;
    else
      counties[stateFips+zipcodes[zipcode].countyFips]={count:1, pop:zipcodes[zipcode].population};

  });


  var count = 0;
  var countytotal ={};
  var max = 0;
  for(d in days){

    var output = "id\trate\n";

    for(c in days[d]){
      if(!countytotal[c])
        countytotal[c] = 0;
      var county = days[d][c];

      countytotal[c] += county.count;
      if(county.pop == 0)
        output += c+"\t0\n";
      else
        output += c+"\t"+(countytotal[c]/county.pop)+"\n";


      if( (max < countytotal[c] / county.pop) && (county.pop != 0)){        
        max = countytotal[c] / county.pop;
        console.log(max)
      }
      
    }
    fs.writeFileSync("data/petition/"+petitionId+"-petition-"+count+".tsv", output);
    count++;
  }
  
  cb({dayCount:count-1, maxVal:max});

};
