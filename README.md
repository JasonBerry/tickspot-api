# tickspot-api

A Node module wrapping the [Tickspot API](http://tickspot.com/api).

## Installation

<pre>
npm install tickspot-api
</pre>

## Usage

All calls to Tickspot's API are made over HTTPS.

```javascript
var Tickspot = require('tickspot-api');

var ts = new Tickspot('yourcompany', 'your@email', 'yourpassword');
```

Every method can use either the Node.js callback pattern, and/or use the promise returned by the method. The next two examples are equivalent.

```javascript
ts.recentTasks(function (error, tasks) {
    if (!error) {
        console.log(tasks); // Print the array of recent tasks
    }
});
```

```javascript
ts.recentTasks().then(function (tasks) {
    console.log(tasks); // Print the array of recent tasks
});
```

### Methods

There is an equivalent method for every endpoint listed at the [Tickspot API](http://tickspot.com/api).

* clients([options], [callback])
* projects([options], [callback])
* tasks(project_id, [options], [callback])
* clientsProjectsTasks([callback])
* entries(start_date, [end_date], [options], [callback])
* recentTasks([callback])
* users([options], [callback])
* createEntry(task_id, hours, date, [options], [callback])
* updateEntry(id, [options], [callback])
