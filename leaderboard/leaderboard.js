// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players".




Players = new Meteor.Collection("players");
if (Meteor.isClient) {
  Template.worldMap.rendered = function(){
    // L.Icon.Default.imagePath = 'packages/leaflet/images';
    var map = L.map('map');
    var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osm = new L.TileLayer(osmUrl, {minZoom: 2, maxZoom: 12});
    map.setView(new L.LatLng(51.3, 0.7),2);
    map.addLayer(osm);
    function onMapClick(e) {
      alert("You clicked the map at " + e.latlng);
    }
    map.on('click', onMapClick);
  };

  Template.leaderboard.players = function () {
    return Players.find({}, {sort: {score: -1, name: 1}});
  };

  Template.leaderboard.selected_name = function () {
    var player = Players.findOne(Session.get("selected_player"));
    return player && player.name;
  };

  Template.player.selected = function () {
    return Session.equals("selected_player", this._id) ? "selected" : '';
  };

  Template.leaderboard.events({
    'click input.inc': function () {
      Players.update(Session.get("selected_player"), {$inc: {score: 5}});
    }
  });

  Template.player.events({
    'click': function () {
      Session.set("selected_player", this._id);
    },
    'click input.delete': function() {
      Players.remove(this._id);
    },
    'click input.down': function(){
      Players.update(this._id, {$inc: {score: -5}});
    }
  });

  Template.new_player.events({
    'click input.add': function() {
      var new_player_name = $('#new_player_name').val();
      Players.insert({name: new_player_name, score: 0});
    }
  });

  Template.new_player.error = function() {
    return Session.get("error");
  };

  Template.new_player.events = {
  'click input.add': function () {
    // notice the added trim()
    var new_player_name = document.getElementById("new_player_name").value.trim();

    // here's the valid_name check
    if (Validation.valid_name(new_player_name)) {
      Players.insert({name: new_player_name, score: 0});
    }
  }
};
}

Validation = {
  clear: function () {
    return Session.set("error", undefined); 
  },
  set_error: function (message) {
    return Session.set("error", message);
  },
  valid_name: function (name) {
    this.clear();
    if (name.length === 0) {
      this.set_error("Name can't be blank");
      return false;
    } else if (this.player_exists(name)) {
      this.set_error("Player already exists");
      return false;
    } else {
      return true;
    }
  },
  player_exists: function(name) {
    return Players.findOne({name: name});
  }
};


// On server startup, create some players if the database is empty.
if (Meteor.isServer) {
  Meteor.startup(function () {
    if (Players.find().count() === 0) {
      var names = ["Black Mamba",
                  "Snake Charmer",
                  "Cotton Mouth",
                  "Copperhead",
                  "California Mountain Snake",
                  "Sidewinder",
                  "ShaoBow"];
      for (var i = 0; i < names.length; i++)
        Players.insert({name: names[i], score: Math.floor(Random.fraction()*10)*5});
    }
  });
}
