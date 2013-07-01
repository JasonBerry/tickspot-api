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
    if (xpath == '/clients') {
        return this._ensureArrayWrap(newValue.client);
    } else if (xpath == '/entries') {
        return this._ensureArrayWrap(newValue.entry);
    } else if (xpath == '/users') {
        return this._ensureArrayWrap(newValue.user);
    } else if (['/projects', '/clients/client/projects'].indexOf(xpath) > -1) {
        return this._ensureArrayWrap(newValue.project);
    } else if (['/tasks', '/projects/project/tasks', '/clients/client/projects/project/tasks'].indexOf(xpath) > -1) {
        return this._ensureArrayWrap(newValue.task);
    }
    return newValue;
};

Tickspot.prototype._ensureArrayWrap = function (value) {
    return _.isArray(value) ? value : [ value ];
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
                validator: scope._xmlValidator.bind(scope)
            }, deferred.makeNodeResolver());
        } else {
            deferred.reject(error || body);
        }
    });
    return deferred.promise;
};

Tickspot.prototype.clients = function (open, callback) {
    var params = {};
    if (typeof open !== 'undefined') {
        if (typeof open === 'function') {
            callback = open;
        } else {
            params.open = !!open;
        }
    }
    return this.makeRequest('clients', params).then(function (data) {
        return data.clients;
    }).nodeify(callback);
};

Tickspot.prototype.projects = function (project_id, open, project_billable, callback) {
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
    return this.makeRequest('projects', params).then(function (data) {
        return data.projects;
    }).nodeify(callback);
};

Tickspot.prototype.tasks = function (project_id, task_id, open, task_billable, callback) {
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
    return this.makeRequest('tasks', params).then(function (data) {
        return data.tasks;
    }).nodeify(callback);
};

Tickspot.prototype.clientsProjectsTasks = function (callback) {
    return this.makeRequest('clients_projects_tasks').then(function (data) {
        return data.clients;
    }).nodeify(callback);
};

Tickspot.prototype.entries = function (params, callback) {
    return this.makeRequest('entries', params).then(function (data) {
        return data.entries;
    }).nodeify(callback);
};

Tickspot.prototype.recentTasks = function (callback) {
    return this.makeRequest('recent_tasks').then(function (data) {
        return data.tasks;
    }).nodeify(callback);
};

Tickspot.prototype.users = function (project_id, callback) {
    var params = {};
    if (typeof project_id !== 'undefined') {
        if (typeof project_id === 'function') {
            callback = project_id;
        } else {
            params.project_id = project_id;
        }
    }
    return this.makeRequest('users', params).then(function (data) {
        return data.users;
    }).nodeify(callback);
};

Tickspot.prototype.createEntry = function (task_id, hours, date, notes, callback) {
    var params = {
        task_id: task_id,
        hours: hours,
        date: date
    };
    if (typeof notes !== 'undefined') {
        if (typeof notes === 'function') {
            callback = notes;
        } else {
            params.notes = notes;
        }
    }
    return this.makeRequest('create_entry', params).then(function (data) {
        return data.entry;
    }).nodeify(callback);
};

Tickspot.prototype.updateEntry = function (id, params, callback) {
    params = params || {};
    params.id = id;
    
    return this.makeRequest('update_entry', params).then(function (data) {
        return data.entry;
    }).nodeify(callback);
};

module.exports = Tickspot;