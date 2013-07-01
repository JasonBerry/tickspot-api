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

Tickspot.prototype._xmlValidator = function (xpath, currentValue, newValue) {
    // Ensure that things which should be arrays stay as arrays
    if (xpath == '/clients' && !_.isArray(newValue.client)) {
        return { 'client': [ newValue.client ] };
    } else if (xpath == '/entries' && !_.isArray(newValue.entry)) {
        return { 'entry': [ newValue.entry ] };
    } else if (xpath == '/users' && !_.isArray(newValue.user)) {
        return { 'user': [ newValue.user ] };
    } else if (['/projects', '/clients/client/projects'].indexOf(xpath) > -1 && !_.isArray(newValue.project)) {
        return { 'project': [ newValue.project ] };
    } else if (['/tasks', '/projects/project/tasks', '/clients/client/projects/project/tasks'].indexOf(xpath) > -1 && !_.isArray(newValue.task)) {
        return { 'task': [ newValue.task ] };
    }
    return newValue;
};

Tickspot.prototype.makeRequest = function (method, params) {
    var scope = this;
    var deferred = Q.defer();
    request.post({
        uri: this.host + '/api/' + method,
        form: _.extend({
            email: this.email,
            password: this.password
        }, params || {})
    }, function (error, response, body) {
        if (!error && [200, 201, 204].indexOf(response.statusCode) > -1) {
            parseString(body, {
                ignoreAttrs: true,
                explicitArray: false,
                validator: scope._xmlValidator
            }, deferred.makeNodeResolver());
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
    var deferred = Q.defer();
    var params = {};
    if (typeof project_id !== 'undefined') {
        if (typeof project_id === 'function') {
            callback = project_id;
        } else {
            params.project_id = project_id;
        }
    }
    if (typeof open !== 'undefined') {
        if (typeof open === 'function') {
            callback = open;
        } else {
            params.open = !!open;
        }
    }
    if (typeof project_billable !== 'undefined') {
        if (typeof project_billable === 'function') {
            callback = project_billable;
        } else {
            params.project_billable = !!project_billable;
        }
    }
    this.makeRequest('projects', params).then(function (arr) {
        deferred.resolve(arr.projects.project);
    }, function (err) {
        deferred.reject(err);
    });

    return deferred.promise.nodeify(callback);
};

Tickspot.prototype.tasks = function(project_id, task_id, open, task_billable, callback) {
    var deferred = Q.defer();
    var params = {
        project_id: project_id
    };
    if (typeof project_id !== 'number') {
        throw new TypeError('project_id is required');
    }
    if (typeof task_id !== 'undefined') {
        if (typeof task_id === 'function') {
            callback = task_id;
        } else {
            params.task_id = task_id;
        }
    }
    if (typeof open !== 'undefined') {
        if (typeof open === 'function') {
            callback = open;
        } else {
            params.open = !!open;
        }
    }
    if (typeof task_billable !== 'undefined') {
        if (typeof task_billable === 'function') {
            callback = task_billable;
        } else {
            params.task_billable = !!task_billable;
        }
    }
    this.makeRequest('tasks', params).then(function (arr) {
        deferred.resolve(arr.tasks.task);
    }, function (err) {
        deferred.reject(err);
    });

    return deferred.promise.nodeify(callback);
};

module.exports = Tickspot;