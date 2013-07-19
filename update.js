var request = require('request');
var parseString = require('xml2js').parseString;
var assert = require('assert');
var moment = require('moment');
var util = require('util');

var sorlUpdate = 'http://index.websolr.com/solr/57e828ba9ce/update/json';
var rssFeeds = [
  'http://feeds.bbci.co.uk/news/world/rss.xml',
  'http://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
  'http://feeds.bbci.co.uk/news/technology/rss.xml',
  /* 'http://www.norwaypost.no/index.php?format=feed&type=rss', */
  'http://news.nationalgeographic.com/index.rss'
];

// Get feed
for(var j = 0; j < rssFeeds.length; j++) {
  request({url: rssFeeds[j]}, function (err, res, body) {
    if(err) {
      console.log('Rss Error:', err);
      return;
    }
    // Parse xml to json
    parseString(body, function (err, result) {
      if(err) {
        console.log('XML Error:', err);
        return;
      }
      // Transform json to documents
      assert(result.rss.channel[0]);
      var channel = result.rss.channel[0];
      var items = channel.item;

      var collection = [];
      console.log('Parsing: ', channel.title[0]);
      for( var i = 0; i < items.length; i++) {
        var entry = items[i];
        var dx = moment(entry.pubDate[0]);

        var doc = {
          title: entry.title[0],
          description: entry.description[0],
          link: entry.link[0],
          creator: channel.title[0],
          pubDate: dx.format('LLLL'),
          date: dx.utc().format('YYYY-MM-DD[T]HH:mm:ss[Z]')
        };
        if(entry['media:thumbnail'] && entry['media:thumbnail'][0]){
          doc.imgsrc = entry['media:thumbnail'][0].$.url;
          if(entry['media:thumbnail'][1]) {
            doc.imgsrc = entry['media:thumbnail'][1].$.url;
          }
        }
        collection.push(doc);
        // console.log(doc)
        // break;
      }
      console.log('Found', collection.length, 'docs.');
      // return;

      //Send documents to solr
      request.post({
        uri: sorlUpdate,
        qs: {
          commit: true
        },
        json: true,
        body: collection
      }, function (err, res, body) {
        if(err) {
          return console.log('Update Error', err);
        }
        console.log(channel.title[0], ' > ', res.statusCode);
        console.log(body);
      });
    });
  });
}
