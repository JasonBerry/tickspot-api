var request = require('request'),
    _ = require('underscore'),
    Q = require('q'),
    parseString = require('xml2js').parseString;

function Tickspot(company, email, password) {
    this.company = company;
    this.email = email;
    this.password = password;
    this.host = 'https://' + company + '.tickspot.com';
}

Tickspot.prototype.makeRequest = function (method, params) {
    var deferred = Q.defer();
    request.post({
        uri: this.host + '/api/' + method,
        form: _.extend({
            email: this.email,
            password: this.password
        }, params || {})
    }, function (error, response, body) {
        if (!error && [200, 201, 204].indexOf(response.statusCode) > -1) {
            parseString(body, { ignoreAttrs: true, explicitArray: false }, deferred.makeNodeResolver());
        } else {
            deferred.reject(error || body);
        }
    });
    return deferred.promise;
};

Tickspot.prototype.clients = function(open, callback) {
    var deferred = Q.defer();
    var params = {};
    if (typeof open !== 'undefined') {
        if (typeof open === 'function') {
            callback = open;
        } else {
            params.open = !!open;
        }
    }
    this.makeRequest('clients', params).then(function (arr) {
        deferred.resolve(arr.clients.client);
    }, function (err) {
        deferred.reject(err);
    });

    return deferred.promise.nodeify(callback);
};

Tickspot.prototype.projects = function(project_id, open, project_billable, callback) {
    var params = {};
    if (typeof project_id !== 'undefined') {
        params.project_id = project_id;
    }
    if (typeof open !== 'undefined') {
        params.open = open;
    }
    if (typeof project_billable !== 'undefined') {
        params.project_billable = project_billable;
    }

    return this.makeRequest('projects', params).nodeify(callback);
};

module.exports = Tickspot;