"use strict";

var async = require('async');
var Categories = module.parent.require('./categories');
var db = module.parent.require('./database');
var plugin = {};

plugin.getPinnedTids = function(data, callback) {
	async.waterfall([
		function (next) {
			Categories.getAllCategories(data.data.uid,next);
		},
		function (categories,next){
			var mysets = getMySets(data,categories,":pinned");
			db.getSortedSetRevUnion({ sets:mysets, start: data.data.start, stop: data.data.stop }, next);
		},
		function (tids, next) {
			next(null, {pinnedTids:tids});
		},
	], callback);
};

plugin.getTopicIds = function(data, callback) {
	async.waterfall([
		function (next) {
			Categories.getAllCategories(data.data.uid,next);
		},
		function (categories,next){
			var mysets = getMySets(data,categories,"");
			db.getSortedSetRevUnion({ sets:mysets, start: data.data.start, stop: data.data.stop }, next);
		},
		function (tids, next) {
			tids = data.allPinnedTids.concat(tids);
			next(null, {tids:tids});
		},
	], callback);
};

function getMySets(data,categories,tag){
	var mysets = [];
	mysets.push('cid:'+data.data.cid+':tids'+tag);
	var catTree = Categories.getTree(categories,data.data.cid);
	//console.dir(catTree);
	if(catTree.length>0){
		function getSets(category){
			if(category){
				var key = 'cid:'+category.cid+':tids'+tag;
				if(mysets.indexOf(key)==-1){
					mysets.push('cid:'+category.cid+':tids'+tag);
				}
				if(category.parent){
					getSets(category.parent);
				}
				if(category.children){
					for(var i=0;i<category.children.length;i++){
						getSets(category.children[i]);
					}
				}
			}
		}
		for(var i=0;i<catTree.length;i++){
			getSets(catTree[i]);	
		}		
	}
	return mysets;
}

module.exports = plugin;