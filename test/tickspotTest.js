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
            </clients>')
        .post('/api/projects').reply(201, '<?xml version="1.0" encoding="UTF-8"?>\
            <projects type="array">\
              <project>\
                <id type="integer">7</id>\
                <name>Realign dilithium crystals</name>\
                <budget type="float">50</budget>\
                <client_id type="integer">4</client_id>\
                <owner_id type="integer">14</owner_id>\
                <opened_on type="date">2006-01-01</opened_on>\
                <closed_on type="date"></closed_on>\
                <created_at type="datetime">Tue, 07 Oct 2008 14:46:16 -0400</created_at>\
                <updated_at type="datetime">Tue, 07 Oct 2008 14:46:16 -0400</updated_at>\
                <client_name>Starfleet Command</client_name>\
                <sum_hours type="float">22.5</sum_hours>\
                <user_count type="integer">2</user_count>\
                <tasks type="array">\
                  <task>\
                    <id type="integer">14</id>\
                    <name>Remove converter assembly</name>\
                    <position type="integer">1</position>\
                    <project_id type="integer">2</project_id>\
                    <opened_on type="date">2006-01-01</opened_on>\
                    <closed_on type="date"></closed_on>\
                    <budget type="float">50</budget>\
                    <billable type="boolean">true</billable>\
                    <sum_hours type="float">22.5</sum_hours>\
                    <user_count type="integer">2</user_count>\
                  </task>\
                </tasks>\
              </project>\
              <project>\
                <id type="integer">7</id>\
                <name>Realign dilithium crystals</name>\
                <budget type="float">50</budget>\
                <client_id type="integer">4</client_id>\
                <owner_id type="integer">14</owner_id>\
                <opened_on type="date">2006-01-01</opened_on>\
                <closed_on type="date"></closed_on>\
                <created_at type="datetime">Tue, 07 Oct 2008 14:46:16 -0400</created_at>\
                <updated_at type="datetime">Tue, 07 Oct 2008 14:46:16 -0400</updated_at>\
                <client_name>Starfleet Command</client_name>\
                <sum_hours type="float">22.5</sum_hours>\
                <user_count type="integer">2</user_count>\
                <tasks type="array">\
                  <task>\
                    <id type="integer">14</id>\
                    <name>Remove converter assembly</name>\
                    <position type="integer">1</position>\
                    <project_id type="integer">2</project_id>\
                    <opened_on type="date">2006-01-01</opened_on>\
                    <closed_on type="date"></closed_on>\
                    <budget type="float">50</budget>\
                    <billable type="boolean">true</billable>\
                    <sum_hours type="float">22.5</sum_hours>\
                    <user_count type="integer">2</user_count>\
                  </task>\
                </tasks>\
              </project>\
            </projects>');

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

    describe('#projects()', function () {
        var projects = ts.projects();

        it('should return a promise', function (done) {
            Q.isPromise(projects).should.be.ok;
            projects.then(function () {
                done();
            });
        });
        it('should call a callback function', function (done) {
            ts.projects(done);
        });
        it('should return an array of projects', function (done) {
            projects.then(function (arr) {
                arr.should.be.an.instanceof(Array);
                done();
            });
        });
    });
});