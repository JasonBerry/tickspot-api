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
        var responses = ['clients-single', 'clients-multiple', 'projects-single', 'projects-multiple'].map(function (filename) {
            return readFile('./test/sample-responses/' + filename + '.xml', 'utf-8').then(function (data) {
                fakeResponses[filename] = data;
            });
        });

        Q.all(responses).then(function () { done(); });
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

        it('resolves with an array of clients', function (done) {
            fake.post('/api/clients').reply(201, fakeResponses['clients-multiple']);
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

        it('resolves with an array of projects', function (done) {
            fake.post('/api/projects').reply(201, fakeResponses['projects-multiple']);
            ts.projects().then(function (projects) {
                projects.should.be.an.instanceof(Array);
                done();
            });
        });
    });
});