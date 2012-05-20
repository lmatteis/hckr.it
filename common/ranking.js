// https://github.com/schmidek/News-aggregator/blob/master/views/rank/reduce.js
exports.findScore =  function(points, jsonDate) { 
    var s = points + 1; 
    var order = Math.log(Math.max(Math.abs(s),1)) / Math.log(10);
    var sign = s > 0 ? 1 : (s<0 ? -1 : 0);
    var seconds = (new Date(jsonDate).getTime()    /1000) - 1134028003;
    return Math.round((order + sign * seconds / 45000) * 10000000) / 10000000; 
}
exports.getUnique = function(arr){
   var u = {}, a = [];
   for(var i = 0, l = arr.length; i < l; ++i){
      if(arr[i] in u)
         continue;
      a.push(arr[i]);
      u[arr[i]] = 1;
   }
   return a;
}
exports.getPoints = function(voted) {
    if(!voted) voted = [];
    var arr = exports.getUnique(voted);
    var points = arr.length;
    return points;
}
