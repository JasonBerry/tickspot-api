var Tickspot = require('../lib/tickspot'),
    nock = require('nock'),
    Q = require('q'),
    should = require('should');

describe('Tickspot', function () {
    var ts = new Tickspot('mycompany', 'myemail', 'mypassword');

    describe('#makeRequest()', function () {
        var method = 'foo';
        var scope = nock(ts.host)
                    .post('/api/' + method, 'email=' + ts.email + '&password=' + ts.password)
                    .reply(201, 'OK');
        var req = ts.makeRequest(method);

        it('should add email and password to every request', function () {
            scope.isDone().should.be.ok;
        });

        it('should return a promise', function () {
            req.should.be.an.instanceof(Q.makePromise);
        });

        it('should resolve the promise when parseable XML is returned');
        it('should reject the promise when unparseable XML is returned');
        it('should reject the promise when an unexpected statusCode is returned');
    });

    describe('#clients()', function () {
        var scope = nock(ts.host)
                    .post('/api/clients', 'email=' + ts.email + '&password=' + ts.password)
                    .reply(201, '<?xml version="1.0" encoding="UTF-8"?>\
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

        it('should return a promise', function () {
            var clients = ts.clients();
            clients.should.be.an.instanceof(Q.makePromise);
        });
    });
});