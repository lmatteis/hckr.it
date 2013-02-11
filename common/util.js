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

exports.getDomain = function(url) {
    return url.match(/:\/\/(www\.)?(.[^/:]+)/)[2];
}

exports.getNumComments = function(comments) {
    if(comments && comments.length) {
        return comments.length;
    } else {
        return 0;
    }
}

exports.inArray = function(value, arr) {
    if(!arr) return false;
    var i;
    for (i=0; i<arr.length; i++) { 
        if (arr[i] === value) return true; 
    }
    return false;
}

exports.timeDifference = function(current, previous, config) {
    
    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;
    
    var elapsed = current - previous;
    
    if (elapsed < msPerMinute) {
        var val = Math.round(elapsed/1000); 
        if(val == 1) {
            val += ' ' + config.conf_secondago;
        } else {
            val += ' ' + config.conf_secondsago;
        }
        return val;   
    }
    
    else if (elapsed < msPerHour) {
        var val =  Math.round(elapsed/msPerMinute);   
        if(val == 1) {
            val += ' ' + config.conf_minuteago;
        } else {
            val += ' ' + config.conf_minutesago;
        }
        return val;
    }
    
    else if (elapsed < msPerDay ) {
        var val = Math.round(elapsed/msPerHour );   
        if(val == 1) {
            val += ' ' + config.conf_hourago;
        } else {
            val += ' ' + config.conf_hoursago;
        }
        return val;
    }

    else if (elapsed < msPerMonth) {
        var val = Math.round(elapsed/msPerDay);   
        if(val == 1) {
            val += ' ' + config.conf_dayago;
        } else {
            val += ' ' + config.conf_daysago;
        }
        return val;
    }
    
    else if (elapsed < msPerYear) {
        var val = Math.round(elapsed/msPerMonth);   
        if(val == 1) {
            val += ' ' + config.conf_monthago;
        } else {
            val += ' ' + config.conf_monthsago;
        }
        return val;
    }
    
    else {
        var val = Math.round(elapsed/msPerYear );   
        if(val == 1) {
            val += ' ' + config.conf_yearago;
        } else {
            val += ' ' + config.conf_yearsago;
        }
        return val;
    }
}

exports.formatdoc = function(content) {
    // does away with nasty characters
    var escapeHTML = function(s) {
      s = String(s === null ? "" : s);
      return s.replace(/&(?!\w+;)|["<>\\]/g, function(s) {
        switch(s) {
        case "&": return "&amp;";
        case "\\": return "\\\\";
        case '"': return '\"';
        case "<": return "&lt;";
        case ">": return "&gt;";
        default: return s;
        }
      });
    }
    content = escapeHTML(content);

    var newlines = '[\\r\\n]+';

    // first remove the newlines from the beginning and end of the content
    content = content.replace(new RegExp('^' + newlines, 'g'), '');
    content = content.replace(new RegExp(newlines + '$', 'g'), '');

    // then replace each newlines with the paragraphs
    content = '<p>' + content.replace(new RegExp(newlines, 'g'), '</p><p>') + '</p>';


    // convert URL to actual urls trimmed 60 chars
    function replaceURLWithHTMLLinks(text) {
        var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        return text.replace(exp, function(url) {
            var shortUrl = url;
            if(shortUrl.length > 60) shortUrl = shortUrl.substring(0, 60) + '...';
            return '<a href="' + url + '">' + shortUrl + '</a>';
        }); 
    }
    content = replaceURLWithHTMLLinks(content);

    return content;
}
