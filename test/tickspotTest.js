var Tickspot = require('../lib/tickspot'),
    nock = require('nock'),
    Q = require('q'),
    should = require('should'),
    fs = require('fs');

describe('Tickspot', function () {
    var ts = new Tickspot('mycompany', 'myemail', 'mypassword');
    var fakeResponses = {};
    var fake = nock(ts.host)
        .post('/api/testAuth', 'email=' + ts.email + '&password=' + ts.password).reply(201, '<foo />')
        .post('/api/okay').reply(201, '<foo />')
        .post('/api/bad').reply(400, 'Bad Request')
        .post('/api/notXML').reply(201, 'foo');

    before(function (done) {
        var readFile = Q.denodeify(fs.readFile);
        var responses = ['clients-single', 'clients-multiple', 'projects-single', 'projects-multiple', 'tasks-single', 'tasks-multiple', 'clients-projects-tasks'].map(function (filename) {
            return readFile('./test/sample-responses/' + filename + '.xml', 'utf-8').then(function (data) {
                fakeResponses[filename] = data;
            });
        });

        Q.all(responses).then(function () { done(); });
    });

    describe('#_ensureArrayWrap()', function () {
        it('doesn\'t wrap array input in a second array', function () {
            var myArr = ['blah'];
            ts._ensureArrayWrap(myArr).should.eql(myArr);
        });
        it('wraps non-array input in an array', function () {
            ts._ensureArrayWrap('abc').should.eql(['abc']);
            ts._ensureArrayWrap(123).should.eql([123]);
            ts._ensureArrayWrap(true).should.eql([true]);
            ts._ensureArrayWrap({ 'foo': 'bar' }).should.eql([{ 'foo': 'bar' }]);
        });
    });

    describe('#_pad()', function () {
        it('pads values with leading zeroes', function () {
            ts._pad(5, 2).should.eql('05');
            ts._pad(15, 2).should.eql('15');
        });
        it('doesn\'t truncate numbers bigger than the supplied size', function () {
            ts._pad(1234, 2).should.eql('1234');
        });
    });

    describe('#_ensureDateString()', function () {
        it('doesn\'t touch a normal date-as-string', function () {
            var myDateString = '2013-07-27';
            ts._ensureDateString(myDateString).should.eql(myDateString);
        });
        it('converts a date to a string representation of that date', function () {
            ts._ensureDateString(new Date(2013, 6, 27)).should.eql('2013-07-27');
        });
    });

    describe('#makeRequest()', function () {
        it('adds email and password to the request', function (done) {
            var req = ts.makeRequest('testAuth');
            req.then(function () {
                Q.isFulfilled(req).should.be.ok;
                done();
            });
        });

        var okayRequest = ts.makeRequest('okay');
        it('returns a promise', function () {
            Q.isPromise(okayRequest).should.be.ok;
        });
        it('resolves the promise when parseable XML is returned', function (done) {
            okayRequest.then(function () {
                Q.isFulfilled(okayRequest).should.be.ok;
                done();
            });
        });

        it('rejects the promise when the request returns an error', function (done) {
            var req = ts.makeRequest('bad');
            req.fail(function () {
                Q.isRejected(req).should.be.ok;
                done();
            });
        });

        it('rejects the promise when unparseable XML is returned', function (done) {
            var req = ts.makeRequest('notXML');
            req.fail(function () {
                Q.isRejected(req).should.be.ok;
                done();
            });
        });
    });

    describe('#clients()', function () {
        it('calls a callback function', function (done) {
            fake.post('/api/clients').reply(201, fakeResponses['clients-single']);
            ts.clients(done);
        });

        it('returns a promise', function (done) {
            fake.post('/api/clients').reply(201, fakeResponses['clients-single']);
            Q.isPromise(ts.clients().then(function () { done(); })).should.be.ok;
        });

        it('resolves with an array of clients when response contains multiple clients', function (done) {
            fake.post('/api/clients').reply(201, fakeResponses['clients-multiple']);
            ts.clients().then(function (clients) {
                clients.should.be.an.instanceof(Array);
                done();
            });
        });
        it('resolves with an array of clients when response contains a single client', function (done) {
            fake.post('/api/clients').reply(201, fakeResponses['clients-single']);
            ts.clients().then(function (clients) {
                clients.should.be.an.instanceof(Array);
                done();
            });
        });
    });

    describe('#projects()', function () {
        it('calls a callback function', function (done) {
            fake.post('/api/projects').reply(201, fakeResponses['projects-single']);
            ts.projects(done);
        });

        it('returns a promise', function (done) {
            fake.post('/api/projects').reply(201, fakeResponses['projects-single']);
            Q.isPromise(ts.projects().then(function () { done(); })).should.be.ok;
        });

        it('resolves with an array of projects when response contains multiple projects', function (done) {
            fake.post('/api/projects').reply(201, fakeResponses['projects-multiple']);
            ts.projects().then(function (projects) {
                projects.should.be.an.instanceof(Array);
                done();
            });
        });
        it('resolves with an array of projects when response contains a single project', function (done) {
            fake.post('/api/projects').reply(201, fakeResponses['projects-single']);
            ts.projects().then(function (projects) {
                projects.should.be.an.instanceof(Array);
                done();
            });
        });
    });

    describe('#tasks()', function () {
        it('throws an error when project_id isn\'t a number', function () {
            (function () {
                ts.tasks();
            }).should.throwError(/project_id/);
        });

        it('calls a callback function', function (done) {
            fake.post('/api/tasks').reply(201, fakeResponses['tasks-single']);
            ts.tasks(0, done);
        });

        it('returns a promise', function (done) {
            fake.post('/api/tasks').reply(201, fakeResponses['tasks-single']);
            Q.isPromise(ts.tasks(0).then(function () { done(); })).should.be.ok;
        });

        it('resolves with an array of tasks when response contains multiple tasks', function (done) {
            fake.post('/api/tasks').reply(201, fakeResponses['tasks-multiple']);
            ts.tasks(0).then(function (tasks) {
                tasks.should.be.an.instanceof(Array);
                done();
            });
        });
        it('resolves with an array of tasks when response contains a single task', function (done) {
            fake.post('/api/tasks').reply(201, fakeResponses['tasks-single']);
            ts.tasks(0).then(function (tasks) {
                tasks.should.be.an.instanceof(Array);
                done();
            });
        });
    });
    
    describe('#clientsProjectsTasks()', function () {
        it('calls a callback function', function (done) {
            fake.post('/api/clients_projects_tasks').reply(201, fakeResponses['clients-projects-tasks']);
            ts.clientsProjectsTasks(done);
        });

        it('returns a promise', function (done) {
            fake.post('/api/clients_projects_tasks').reply(201, fakeResponses['clients-projects-tasks']);
            Q.isPromise(ts.clientsProjectsTasks().then(function () { done(); })).should.be.ok;
        });

        it('resolves with an array of clients, who have an array of projects, who have an array of tasks', function (done) {
            fake.post('/api/clients_projects_tasks').reply(201, fakeResponses['clients-projects-tasks']);
            ts.clientsProjectsTasks().then(function (clients) {
                clients.should.be.an.instanceof(Array);
                clients.length.should.eql(3);
                clients[0].projects.should.be.an.instanceof(Array);
                clients[0].projects.length.should.eql(2);
                clients[0].projects[0].tasks.should.be.an.instanceof(Array);
                clients[0].projects[0].tasks.length.should.eql(2);
                done();
            });
        });
    });

    describe('#entries()', function () {
        var fakeEntriesResponse = '<entries></entries>';
        it('throws an error when start_date isn\'t a date/string', function () {
            (function () {
                ts.entries();
            }).should.throwError(/start_date/);
        });
        it('does not throw an error when start_date is a date', function (done) {
            (function () {
                fake.post('/api/entries').reply(201, fakeEntriesResponse);
                ts.entries(new Date(2013, 1, 1), done);
            }).should.not.throwError(/start_date/);
        });
        it('throws an error when end_date isn\'t a date/string', function () {
            (function () {
                ts.entries(new Date(2013, 1, 1), {}, {}, function () {});
            }).should.throwError(/end_date/);
        });
        it('does not throw an error when end_date is a date', function (done) {
            (function () {
                fake.post('/api/entries').reply(201, fakeEntriesResponse);
                ts.entries(new Date(2013, 1, 1), new Date(2013, 1, 31), done);
            }).should.not.throwError(/end_date/);
        });

        it('calls a callback function', function (done) {
            fake.post('/api/entries').reply(201, fakeEntriesResponse);
            ts.entries(new Date(2013, 1, 1), done);
        });

        it('returns a promise', function (done) {
            fake.post('/api/entries').reply(201, fakeEntriesResponse);
            Q.isPromise(ts.entries(new Date(2013, 1, 1)).then(function () { done(); })).should.be.ok;
        });

        it('sends start_date param if end_date is supplied', function (done) {
            var startDate = '2013-01-01';
            var endDate = '2013-01-31';
            fake.post('/api/entries', 'email=' + ts.email + '&password=' + ts.password + '&start_date=' + startDate + '&end_date=' + endDate).reply(201, fakeEntriesResponse);
            ts.entries(startDate, endDate, done);
        });
        it('sends updated_at param if end_date is not supplied', function (done) {
            var updatedAt = '2013-01-01';
            fake.post('/api/entries', 'email=' + ts.email + '&password=' + ts.password + '&updated_at=' + updatedAt).reply(201, fakeEntriesResponse);
            ts.entries(updatedAt, done);
        });
    });
});