var webshot = require('webshot');
var fs      = require('fs'),
loki = require('lokijs'),
db = new loki('db.json');

var requestURL = 'faz.net';
var timestamp = new Date().getTime()/1000;
openFolder(timestamp, function(folderPath){
	db.loadDatabase({}, function () {
	var cachedImages = db.getCollection('cachedImages');
	if(cachedImages === null){
		db.addCollection('cachedImages');
		var cachedImages = db.getCollection('cachedImages');
	}


	var view = cachedImages.addDynamicView('usableCachedPictures'); 
	view.applyWhere(function (obj) {
	 return obj.url == requestURL;
	});
	view.applyWhere(function (obj) {
	 return obj.time > (timestamp-3600); 
	});
	var cachedImages = view.data();
	if(cachedImages.length){
		var filename = hash(cachedImages[0].time+cachedImages[0].url)+'.png';
		console.log(folderPath+filename);
	}else{
		var filename = hash(timestamp+requestURL)+'.png';

		webshot(requestURL, folderPath+filename, function(err) {
		  var cachedImages = db.getCollection('cachedImages');
		  //var removalView = cachedImages.addDynamicView('unsableCachedPictures'); 
			cachedImages.removeWhere(function (obj) {
			 return obj.url == requestURL;
			});

			cachedImages.insert({
			  url: requestURL,
			  time: timestamp
			});
			db.saveDatabase();
			console.log(folderPath+filename);
		});
	}
	});

});

//opens or creates folder for new timestamp, deletes old ones
//current timestamp
//callback(folderTitle)
function openFolder(timestamp, callback){
	var timestamp = Math.round(timestamp/1000);
	var path = './cached_images/'+timestamp;

	var fs = require('fs');
	//check if path exists
	try {
	    // Query the entry
	    stats = fs.lstatSync(path);

	    // Is it a directory?
	    if (stats.isDirectory()) {
	        // Yes it is
	        callback(path+'/');
	    }
	}
	catch (e) {
		//delete dbFile
		var del = require('del');
		del(['db.json']).then(function (paths) {
			//delete complete dir
			rmdir = require('rimraf');
			rmdir('./cached_images', function(error){
				var mkdirp = require('mkdirp');

				//create new dirs
				mkdirp('cached_images',function(err){

					mkdirp(path, function(err) {

						callback(path+'/');
					});
				})
			});
		});

		
	}
}





function hash(string){
	  var hash = 0, i, chr, len;
  if (string.length == 0) return hash;
  for (i = 0, len = string.length; i < len; i++) {
    chr   = string.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

