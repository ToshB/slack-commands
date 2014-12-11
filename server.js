/*global require, process*/
'use strict';
var express = require('express'),
    app = express(),
    port = process.env.PORT || '9999';

app.get('/', function (req, res) {
    res.send('hi');
});

app.use('/untappd', require('./controllers/untappd.js'));

app.listen(port);
