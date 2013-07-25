Players = new Meteor.Collection("players");
Places = new Meteor.Collection("places");
CurrentGame = new Meteor.Collection("currentgame");

if (Meteor.isClient) {
  Meteor.startup(function () {
    Template.worldMap.rendered = function(){
    var map = L.map('map');
    var osmUrl='http://otile3.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png';
    var osm = new L.TileLayer(osmUrl, {minZoom: 2, maxZoom: 2});
    map.setView(new L.LatLng(30, 0),2);
    map.dragging.disable();
    map.addLayer(osm);
    function onMapClick(e) {
        console.log("You clicked the map at " + e.latlng);
        var currentGPS = CurrentGame.findOne();
        var dist = e.latlng.distanceTo(L.latLng(currentGPS.lat, currentGPS.lon));
        setScore(dist/1000);

        L.marker(e.latlng, {color:'red'}).addTo(map);
      }
      var clickMap = _.throttle(onMapClick,2000);
      map.on('click', clickMap);
    };

    var userid = Players.insert({username: 'scoobyClone', score: 0});
    Session.set('id', userid);
  });

  var setScore = function(dist){
    var newScore = 0;
    if(dist<1500) {
      newScore = Math.ceil(10*(1-(dist/2000)));
      if(dist<250) {
        Meteor.call('begin_round');
      }
    }
    Players.update({_id:Session.get('id')}, {$inc: {score: newScore}});
  };


  Meteor.setInterval(function(){
    Players.update({_id:Session.get('id')}, {$set: {lastPlayed: Date.now()}});
  }, 1000*30);

  Template.currentPlace.show = function(){
    return (CurrentGame.findOne()) ? CurrentGame.findOne().name : "Welcome";
  };

  Template.currentUser.user = function(){
    return Session.get('name');
  };

  Template.currentPlayers.players = function(){
    return Players.find({lastPlayed: {$gt: Date.now() - 1000*45 }}, {sort: {score:-1, name: 1}});
  };

  Template.currentUser.events = {
    'click input.add': function () {
      // notice the added trim()
      var new_player_name = document.getElementById("enter_user").value.trim();
      Session.set('name', new_player_name);
      Players.update({_id:Session.get('id')}, {$set: {username: new_player_name, lastPlayed: Date.now()}});
    }
  };
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    var places = [
      {
        name: "Machu Picchu",
        lat: -13.1583300,
        lon: -72.5313900
      },
      {
        name: "Great Sphinx",
        lat: 29.975309,
        lon: 31.137751
      },
      {
        name: "Hanging Gardens of Babylon",
        lat: 32.478476,
        lon: 44.441039
      },
      {
        name: "Mount Rushmore",
        lat: 43.880154,
        lon: -103.4593
      }
    ];

    if(Places.find().count() === 0){
      _(places).each(function(place){
        Places.insert(place);
      });
    }
    Meteor.methods({
      begin_round: function(){
        CurrentGame.remove({});
        var placeIndex = Math.floor(Math.random()*4);
        var place = places[placeIndex];
        CurrentGame.insert({name: place.name, lat:place.lat, lon:place.lon});
      }
    });

    Meteor.setInterval(function(){
      Meteor.call('begin_round');
    }, 5000);
  });
}
