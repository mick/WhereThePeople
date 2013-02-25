var request = require("request");
var async = require("async");
var fs = require("fs");

var apiKey = process.env.WTP_API_KEY;


module.exports.getPetitionWithSignatures = function(petitionId, cb){

  var petition = {};
  var responseCount = 0;
  var pages = [];
  var signatures = [];
  var pageResponses = 0;

  var getSignatures = function(page){

    request('https://petitions.whitehouse.gov/api/v1/petitions/'+petitionId+'/signatures.json?key='+apiKey+'&limit=1000&offset='+(page*1000),
            function (error, response, body) {
              console.log("page response:", page);
              if (!error && response.statusCode == 200) {
                //console.log(body) // Print the google web page.
                var data = JSON.parse(body)

                for(r in data.results){
                  signatures.push(data.results[r]);
                }

                console.log("sig len:", signatures.length);

                pageResponses++;
                cb({status:"active", page:pageResponses, totalPages:pages.length, petition:petition});
                if(pageResponses == pages.length){
                  fs.writeFileSync("data/data/"+petitionId+".json", JSON.stringify(signatures));
                  cb({status:"done", page:pageResponses, totalPages:pages.length, signatures:signatures, petition:petition});
                  console.log("signatures len: ", signatures.length);
                }

              }
            });

  }


  request('https://petitions.whitehouse.gov/api/v1/petitions/'+petitionId+'.json?key='+apiKey, 
          function (error, response, body) {
            if (!error && response.statusCode == 200) {
              console.log(body) 
              var data = JSON.parse(body)
              responseCount = data.results[0]["signature count"];
              petition = data.results[0];
              for(var i =0; i< responseCount / 1000; i++){
                pages.push(i);
              }
              if(fs.existsSync("data/data/"+petitionId+".json")){
                var signatures = JSON.parse(fs.readFileSync("data/data/"+petitionId+".json"));
                cb({status:"done", page:pages.length, totalPages:pages.length, signatures:signatures, petition:petition});
                return;
              }
              //fs.writeFileSync("data/"+petitionId+".json", JSON.stringify(signatures));
              console.log("PAGES:", pages.length);
              async.map(pages, getSignatures, function(err, results){
                // results is now an array of stats for each file

              });



            }
          });


}
