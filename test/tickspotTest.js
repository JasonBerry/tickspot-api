var Tickspot = require('../lib/tickspot'),
    nock = require('nock'),
    Q = require('q'),
    should = require('should');

describe('Tickspot', function () {
    var ts = new Tickspot('mycompany', 'myemail', 'mypassword');
    nock(ts.host)
        .persist()
        .post('/api/testAuth', 'email=' + ts.email + '&password=' + ts.password).reply(201, '<foo />')
        .post('/api/okay').reply(201, '<foo />')
        .post('/api/bad').reply(400, 'Bad Request')
        .post('/api/notXML').reply(201, 'foo')
        .post('/api/clients').reply(201, '<?xml version="1.0" encoding="UTF-8"?>\
            <clients type="array">\
              <client>\
                <id type="integer">12341</id>\
                <name>Starfleet Command</name>\
              </client>\
              <client>\
                <id type="integer">12342</id>\
                <name>The Vulcans</name>\
              </client>\
              <client>\
                <id type="integer">12343</id>\
                <name>The Cardassians</name>\
              </client>\
            </clients>');

    describe('#makeRequest()', function () {
        it('should add email and password to the request', function (done) {
            var req = ts.makeRequest('testAuth');
            req.then(function () {
                Q.isFulfilled(req).should.be.ok;
                done();
            });
        });
        it('should return a promise', function () {
            Q.isPromise(ts.makeRequest('okay')).should.be.ok;
        });
        it('should resolve the promise when parseable XML is returned', function (done) {
            var req = ts.makeRequest('okay');
            req.then(function () {
                Q.isFulfilled(req).should.be.ok;
                done();
            });
        });
        it('should reject the promise when the request returns an error', function (done) {
            var req = ts.makeRequest('bad');
            req.fail(function () {
                Q.isRejected(req).should.be.ok;
                done();
            });
        });

        it('should reject the promise when unparseable XML is returned', function (done) {
            var req = ts.makeRequest('notXML');
            req.fail(function () {
                Q.isRejected(req).should.be.ok;
                done();
            });
        });
        it('should reject the promise when an unexpected statusCode is returned');
    });

    describe('#clients()', function () {
        var clients = ts.clients();

        it('should return a promise', function (done) {
            Q.isPromise(clients).should.be.ok;
            clients.then(function () {
                done();
            });
        });
        it('should call a callback function', function (done) {
            ts.clients(done);
        });
        it('should return an array of clients', function (done) {
            clients.then(function (arr) {
                arr.should.eql([
                    {
                        id: '12341',
                        name: 'Starfleet Command'
                    },
                    {
                        id: '12342',
                        name: 'The Vulcans'
                    },
                    {
                        id: '12343',
                        name: 'The Cardassians'
                    }
                ]);
                done();
            });
        });
    });
});