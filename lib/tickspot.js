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

Tickspot.prototype._ensureDateString = function (date) {
    return _.isDate(date) ? date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate() : date;
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
        if (!error && [200, 201, 204, 304].indexOf(response.statusCode) > -1) {
            if (body) {
                parseString(body, {
                    ignoreAttrs: true,
                    explicitArray: false,
                    validator: scope._xmlValidator.bind(scope)
                }, deferred.makeNodeResolver());
            } else {
                deferred.resolve();
            }
        } else {
            deferred.reject(error || body);
        }
    });
    return deferred.promise;
};

Tickspot.prototype.clients = function (options, callback) {
    if (!_.isUndefined(options) && _.isFunction(options)) {
        callback = options;
        options = void 0;
    }

    return this.makeRequest('clients', options).then(function (data) {
        return data.clients;
    }).nodeify(callback);
};

Tickspot.prototype.projects = function (options, callback) {
    if (!_.isUndefined(options) && _.isFunction(options)) {
        callback = options;
        options = void 0;
    }

    return this.makeRequest('projects', options).then(function (data) {
        return data.projects;
    }).nodeify(callback);
};

Tickspot.prototype.tasks = function (project_id, options, callback) {
    if (!_.isUndefined(options) && _.isFunction(options)) {
        callback = options;
        options = void 0;
    }
    options = options || {};

    if (!_.isNumber(project_id)) {
        throw new TypeError('project_id is not numerical');
    }
    options['project_id'] = project_id;

    return this.makeRequest('tasks', options).then(function (data) {
        return data.tasks;
    }).nodeify(callback);
};

Tickspot.prototype.clientsProjectsTasks = function (callback) {
    return this.makeRequest('clients_projects_tasks').then(function (data) {
        return data.clients;
    }).nodeify(callback);
};

Tickspot.prototype.entries = function (start_date, end_date, options, callback) {
    if (!_.isUndefined(options) && _.isFunction(options)) {
        callback = options;
        options = void 0;
    }
    if (!_.isUndefined(end_date)) {
        if (_.isFunction(end_date)) {
            callback = end_date;
            end_date = void 0;
        } else if (!_.isString(end_date) && !_.isDate(end_date)) {
            options = end_date;
            end_date = void 0;
        }
    }
    options = options || {};

    if (!_.isString(start_date) && !_.isDate(start_date)) {
        throw new TypeError('start_date is not a string or date');
    }
    if (!_.isUndefined(end_date) && !_.isString(end_date) && !_.isDate(end_date)) {
        throw new TypeError('end_date is not a string or date');
    }
    options[end_date ? 'start_date' : 'updated_at'] = this._ensureDateString(start_date);
    if (end_date) {
        options['end_date'] = this._ensureDateString(end_date);
    }

    return this.makeRequest('entries', options).then(function (data) {
        return data.entries;
    }).nodeify(callback);
};

Tickspot.prototype.recentTasks = function (callback) {
    return this.makeRequest('recent_tasks').then(function (data) {
        return data.tasks;
    }).nodeify(callback);
};

Tickspot.prototype.users = function (options, callback) {
    if (!_.isUndefined(options) && _.isFunction(options)) {
        callback = options;
        options = void 0;
    }

    return this.makeRequest('users', options).then(function (data) {
        return data.users;
    }).nodeify(callback);
};

Tickspot.prototype.createEntry = function (task_id, hours, date, options, callback) {
    if (!_.isUndefined(options) && _.isFunction(options)) {
        callback = options;
        options = void 0;
    }
    options = options || {};

    if (!_.isNumber(task_id)) {
        throw new TypeError('task_id is not numerical');
    }
    if (!_.isNumber(hours)) {
        throw new TypeError('hours is not numerical');
    }
    if (!_.isString(date) && !_.isDate(date)) {
        throw new TypeError('date is not a string or date');
    }
    options['task_id'] = task_id;
    options['hours'] = hours;
    options['date'] = this._ensureDateString(date);

    return this.makeRequest('create_entry', options).then(function (data) {
        return data.entry;
    }).nodeify(callback);
};

Tickspot.prototype.updateEntry = function (id, options, callback) {
    if (!_.isUndefined(options) && _.isFunction(options)) {
        callback = options;
        options = void 0;
    }
    options = options || {};

    if (!_.isNumber(id)) {
        throw new TypeError('id is not numerical');
    }
    options['id'] = id;
    
    return this.makeRequest('update_entry', options).nodeify(callback);
};

module.exports = Tickspot;