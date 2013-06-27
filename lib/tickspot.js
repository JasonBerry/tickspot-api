var request = require('request'),
    _ = require('underscore'),
    Q = require('q'),
    parseString = require('xml2js').parseString;

function Tickspot(company, email, password) {
    this.company = company;
    this.email = email;
    this.password = password;
    this.host = 'https://' + company + '.tickspot.com/api/';
}

Tickspot.prototype.makeRequest = function (method, params) {
    var deferred = Q.defer();
    request.post({
	uri: this.host + method,
	form: _.extend({
	    email: this.email,
	    password: this.password
	}, params || {})
    }, function (error, response, body) {
	if (!error && [200, 201, 204].indexOf(response.statusCode) > -1) {
	    parseString(body, deferred.makeNodeResolver());
	} else {
	    console.log('error: ' + response.statusCode);
	    console.log(body);
	    deferred.reject(error || body);
	}
    });
    return deferred.promise;
};

module.exports = Tickspot;