var width = 960,
height = 500;

var quantize = d3.scale.quantize()
  .domain([0, 0.002])
  .range(d3.range(9).map(function(i) { return "q" + i + "-9"; }));
 var path = d3.geo.path();

 var svg = d3.select("div.petition").append("svg")
   .attr("width", width)
   .attr("height", height);

var count=0;

function loadMap(petitionId, totalCount, dayCount){

  queue()
    .defer(d3.json, "us.json")
    .defer(d3.tsv, "data/petition/"+petitionId+"-petition-"+count+".tsv")
    .await(ready);

  function ready(error, us, unemployment) {
    var rateById = {};

    unemployment.forEach(function(d) { rateById[d.id] = +d.rate; });

    svg.append("g")
      .attr("class", "counties")
      .selectAll("path")
      .data(topojson.object(us, us.objects.counties).geometries)
      .enter().append("path")
      .attr("class", function(d) { return quantize(rateById[d.id]); })
      .attr("d", path);

    svg.append("path")
      .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a.id !== b.id; }))
      .attr("class", "states")
      .attr("d", path);
    count++;
    $("#day").text("Showing day "+count+" of "+dayCount);
    if(count < dayCount)
      setTimeout(function(){ loadMap(petitionId, totalCount, dayCount); }, 50);
  }
}
var sock = new SockJS('/echo');
sock.onopen = function() {
  console.log('open');
  
};
sock.onmessage = function(e) {
  var data = JSON.parse(e.data);
  console.log('message', data);
  $("#title").text(data.petition.title);
  $("#description").text(data.petition.body);
  if(data.status === "active"){
    $("#loading").text("Loading... fetching"+data.page+" of "+data.totalPages )
  }else if(data.status === "done"){
    count=0;
    quantize = d3.scale.quantize()
      .domain([0, (data.maxVal*0.6)])
      .range(d3.range(9).map(function(i) { return "q" + i + "-9"; }));

    loadMap(data.petition.id, data.totalCount, data.dayCount);
    $("#loading").hide();
  }
};
sock.onclose = function() {
  console.log('close');
};

$("#getPetition").click(function(){
  $("#loading").text("loading...");
  $("#loading").show();
  $("#title").text("");
  $("#description").text("");


  count =10000;
  sock.send(JSON.stringify({action:"fetch", "petitionId":$("#petitionId").val()}));
});
