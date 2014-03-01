var assert = require("assert");

var dbConnectionString = "postgres://macathon:12345@localhost:5432/macathon";
var pg;

function runSQL(sql) {
    pg.connect(dbConnectionString, function(err, client, done) {
        if (err != null) {
            console.log("ERROR: Can't connect to database " +
                        dbConnectionString + " (" + err + ")!");
            process.exit(1);
        }
        console.log("Connected to database " + dbConnectionString);
        console.log("Running SQL:\n" + sql);
        client.query(sql, function(err, result) {
            if (err != null) {
                console.log("ERROR: SQL query failed (" + err + ")!");
                process.exit(1);
            }
            done();
        });
    });
}

function runQuery(queryText, values, callback) {
    pg.connect(dbConnectionString, function(err, client, done) {
        if (err != null) {
            console.log("WARNING: Can't connect to database " +
                        dbConnectionString + " (" + err + ")!");
            callback(err, null);
            done();
        } else {
            console.log("Connected to database " + dbConnectionString);
            console.log("Running SQL:\n" + queryText);
            client.query(queryText, values, function(err, result) {
                if (err != null) {
                    console.log("WARNING: SQL query failed (" + err + ")!");
                }
                callback(err, result);
                done();
            });
        }
    });
}

exports = module.exports = function(_pg) {

    pg = _pg;

    sql = "";

    sql += "DROP TABLE IF EXISTS account, message, item, offer;\n";

    sql += "CREATE TABLE IF NOT EXISTS account\n"                    +
           "(\n"                                                     +
           "    id                SERIAL PRIMARY KEY,\n"             +
           "    email_address     VARCHAR(255) NOT NULL,\n"          +
           "    first_name        VARCHAR(64) NOT NULL,\n"           +
           "    last_name         VARCHAR(64) NOT NULL,\n"           +
           "    password_sha1     CHAR(40),\n"                       +
           "    time_created      TIMESTAMP,\n"                      +
           "    pending_key       CHAR(40),\n"                       +
           "    profile_picture   BYTEA\n"                           +
           ");\n";

    sql += "CREATE TABLE IF NOT EXISTS message\n"                    +
           "(\n"                                                     +
           "    id                SERIAL PRIMARY KEY,\n"             +
           "    time_sent         TIMESTAMP NOT NULL,\n"             +
           "    text              VARCHAR(255) NOT NULL,\n"          +
           "    notification_sent BOOLEAN NOT NULL,\n"               +
           "    to_account        INTEGER REFERENCES account(id),\n" +
           "    from_account      INTEGER REFERENCES account(id)\n" +
           ");\n";

    sql += "CREATE TABLE IF NOT EXISTS item\n"                       +
           "(\n"                                                     +
           "    id                SERIAL PRIMARY KEY,\n"             +
           "    name              VARCHAR(255) NOT NULL,\n"          +
           "    category          VARCHAR(64) NOT NULL,\n"           +
           "    seller            INTEGER REFERENCES account(id),\n" +
           "    price_in_cents    INTEGER NOT NULL,\n"               +
           "    time_posted       TIMESTAMP NOT NULL,\n"             +
           "    description       VARCHAR(2000),\n"                  +
           "    picture           BYTEA\n"                           +
           ");\n";

    sql += "CREATE TABLE IF NOT EXISTS offer\n"                      +
           "(\n"                                                     +
           "    id                SERIAL PRIMARY KEY,\n"             +
           "    price_in_cents    INTEGER NOT NULL,\n"               +
           "    item_id           INTEGER REFERENCES item(id),\n"    +
           "    account_id        INTEGER REFERENCES account(id)\n"  +
           ");\n";

    runSQL(sql);
}

exports.login = function(email, password, callback) {
}

exports.register = function() {
}

exports.postItem = function(accountID, item, callback) {
    runQuery("INSERT INTO item (name, category, seller, " +
                               "price_in_cents, time_posted, " +
                               "description, picture) " +
             "VALUES ($1, $2, $3, $4, $5, $6, $7)\n",
             [item.name, item.category,
              accountID, item.price_in_cents,
              item.time_posted, item.description, item.picture],
             callback);
}

exports.deleteItem = function(accountID, itemID, callback) {
    runQuery("DELETE FROM ITEM WHERE id = $1",
             [itemID],
             callback);
}

exports.loadAllItems = function() {
}
