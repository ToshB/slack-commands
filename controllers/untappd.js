'use strict';

var express = require('express'),
    request = require('request'),
    router = express.Router(),
    clientId = process.env.untappdClientId,
    clientSecret = process.env.untappdClientSecret,
    webhook = process.env.slackWebhook;

function notify(text) {
    request({
        uri: webhook,
        method: 'POST',
        json: {
            channel: '@tosh',
            username: 'Untappd',
            text: text,
            icon_emoji: ':beer:'
        }
    }, function (error) {
        if (error) {
            return console.error(error);
        }
    });
}

function getBeerInfo(bid, callback) {
    var url = 'http://api.untappd.com/v4/beer/info/' + bid + '?client_id=' + clientId + '&client_secret=' + clientSecret;
    console.log(url);
    request.get(url, function (err, result, body) {
        if (err) {
            return callback(err);
        }
        var data = JSON.parse(body),
            beer = data.response.beer;

        callback(null, beer);
    });
}

function findBeer(query, callback) {
    var encoded = encodeURIComponent(query),
        url = 'http://api.untappd.com/v4/search/beer?q=' + encoded + '&client_id=' + clientId + '&client_secret=' + clientSecret;

    console.log(url);

    request.get(url, function (err, result, body) {
        if (err) {
            return callback(err);
        }
        var data = JSON.parse(body),
            beers = data.response.beers.items;

        callback(null, beers.length > 0 ? beers[0] : null);
    });
}

module.exports = function () {
    router.get('/', function (req, res) {
        var user = req.query.user_name,
            query = req.query.text;

        findBeer(query, function (error, result) {
            if (error) {
                console.error(error);
                notify(error.message);
                res.send('Sorry, an error occurred');
                return;
            }

            if (!result) {
                res.send('No info found for ' + query);
            }

            getBeerInfo(result.beer.bid, function (error, result) {
                if (error) {
                    console.error(error);
                    notify(error.message);
                    res.send('Sorry, an error occurred');
                    return;
                }

                var str = result.beer_name + ' (' + result.beer_style + ') by ' + result.brewery.brewery_name + ' - Rating: ' + result.rating_score + ' (' + result.rating_count + ' votes)';
                notify(user + ' requested: ' + query + '\n'+str);
                res.send(str);
            });
        });

    });

    return router;
};
