var assert = require("assert");

var dbConnectionString = "postgres://macathon:12345@localhost:5432/macathon";
var pg;
var fs = require("fs");

/* Asynchronously runs the specified SQL query.
 * Usage:
 *
 * runQuery(queryText, callback);
 * runQuery(queryText, values, callback);  [ Parameterized query ]
 *
 * Calls the callback(err, result) when query finished or error occurred.
 */
function runQuery()
{
    var queryText;
    var values;
    var callback;
    if (arguments.length == 2) {
        queryText = arguments[0];
        values = null;
        callback = arguments[1];
    } else {
        queryText = arguments[0];
        values = arguments[1];
        callback = arguments[2];
    }
    pg.connect(dbConnectionString, function(err, client, done) {
        if (err) {
            console.log("WARNING: Can't connect to database " +
                        dbConnectionString + " (" + err + ")!");
            callback(err, null);
            done();
        } else {
            console.log("Connected to database " + dbConnectionString);
            console.log("Running SQL:\n" + queryText);
            if (values) {
                console.log("values: " + values);
                client.query(queryText, values, function(err, result) {
                    if (err) {
                        console.log("WARNING: SQL query failed (" + err + ")!");
                    }
                    callback(err, result);
                    done();
                });
            } else {
                client.query(queryText, function(err, result) {
                    if (err) {
                        console.log("WARNING: SQL query failed (" + err + ")!");
                    }
                    callback(err, result);
                    done();
                });
            }
        }
    });
}

exports = module.exports = function(_pg, callback)
{
    pg = _pg;

    sql = "";

    sql += "DROP TABLE IF EXISTS account, message, item, offer;\n";

    sql += "CREATE TABLE IF NOT EXISTS account\n"                    +
           "(\n"                                                     +
           "    id                SERIAL PRIMARY KEY,\n"             +
           "    email_address     VARCHAR(255) UNIQUE NOT NULL,\n"   +
           "    password_sha1     CHAR(40) NOT NULL,\n"              +
           "    first_name        VARCHAR(64) NOT NULL,\n"           +
           "    last_name         VARCHAR(64) NOT NULL,\n"           +
           "    time_created      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,\n"  +
           "    pending_key       CHAR(40),\n"                       +
           "    profile_picture   VARCHAR(200000)\n"                 +
           ");\n";

    sql += "CREATE TABLE IF NOT EXISTS message\n"                    +
           "(\n"                                                     +
           "    id                SERIAL PRIMARY KEY,\n"             +
           "    text              VARCHAR(2000) NOT NULL,\n"         +
           "    from_account      INTEGER REFERENCES account(id),\n" +
           "    to_account        INTEGER REFERENCES account(id),\n" +
           "    time_sent         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,\n" +
           "    notification_sent BOOLEAN NOT NULL\n"               +
           ");\n";

    sql += "CREATE TABLE IF NOT EXISTS item\n"                       +
           "(\n"                                                     +
           "    id                SERIAL PRIMARY KEY,\n"             +
           "    name              VARCHAR(255) NOT NULL,\n"          +
           "    category          VARCHAR(64) NOT NULL,\n"           +
           "    seller            INTEGER REFERENCES account(id),\n" +
           "    price_in_cents    INTEGER NOT NULL,\n"               +
           "    time_posted       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,\n" +
           "    description       VARCHAR(2000),\n"                  +
           "    picture           VARCHAR(1000000)\n"                +
           ");\n";

    sql += "CREATE TABLE IF NOT EXISTS offer\n"                      +
           "(\n"                                                     +
           "    id                SERIAL PRIMARY KEY,\n"             +
           "    item              INTEGER REFERENCES item(id),\n"    +
           "    account           INTEGER REFERENCES account(id),\n" +
           "    price_in_cents    INTEGER NOT NULL\n"               +
           ");\n";

    runQuery(sql, function(err, result) {
        storeTestData(callback);
    });
    return module.exports;
}


exports.login = function(email_address, password_sha1, callback)
{
    runQuery("SELECT * FROM account WHERE email_address = $1 " +
             "AND password_sha1 = $2;\n",
             [email_address, password_sha1],
             function(err, result)
    {
        if (!err && result.rows.length == 0) {
            err = "email address and/or password not found";
            result = null;
        }
        callback(err, (result ? result.rows[0] : null));
    });
}

exports.findAccountById = function(account_id, callback)
{
    runQuery("SELECT * FROM account WHERE id = $1;\n",
             [account_id],
             function(err, result)
    {
        if (!err && result.rows.length == 0) {
            err = "account not found";
            result = null;
        }
        callback(err, (result ? result.rows[0] : null));
    });
}

exports.register = function(email_address, password_sha1,
                            first_name, last_name, callback)
{
    runQuery("INSERT INTO account (email_address, password_sha1, " +
                                  "first_name, last_name) " +
             "VALUES ($1, $2, $3, $4);\n",
             [email_address, password_sha1, first_name, last_name],
             function(err, result)
    {
        callback(err);
    });
}

exports.searchItems = function(search_category, search_text, callback)
{
    queryText = "SELECT * FROM item WHERE ";
    values = [];

    if (search_category && search_category != "all") {
        values.push(search_category);
        queryText += "category = $" + values.length + " AND ";
    }

    if (search_text) {
        values.push("%" + search_text + "%");
        queryText += "name ILIKE $" + values.length;
    } else {
        queryText += "1 = 1";
    }

    queryText += ";\n";

    runQuery(queryText, values, function(err, result) {
        callback(err, (result ? result.rows : null));
    });
}

exports.findItemById = function(item_id, callback)
{
    runQuery("SELECT * FROM item WHERE id = $1;\n",
             [item_id],
             function(err, result)
    {
        if (!err && result.rows.length != 1) {
            err = "item not found";
            result = null;
        }
        callback(err, (result ? result.rows[0] : null));
    });
}

exports.findItemsBySeller = function(seller_id, callback)
{
    runQuery("SELECT * FROM item WHERE seller = $1;\n",
             [seller_id],
             function(err, result)
    {
        callback(err, result ? result.rows : null);
    });
}

exports.postItem = function(account_id, item, callback)
{
    runQuery("INSERT INTO item (name, category, seller, " +
                               "price_in_cents, description, picture) " +
             "VALUES ($1, $2, $3, $4, $5, $6);\n",
             [item.name, item.category,
              account_id, item.price_in_cents,
              item.description, item.picture],
             function(err, result)
    {
        callback(err);
    });
}

exports.makeOffer = function(item_id, account_id, price_in_cents, callback)
{
    runQuery("INSERT INTO offer (item, account, price_in_cents) " +
             "VALUES ($1, $2, $3);\n",
             [item_id, account_id, price_in_cents],
             function(err, result)
    {
        callback(err);
    });
}

exports.getBuyerOffers = function(buyer_account_id, callback)
{
    runQuery("SELECT * FROM offer WHERE account = $1\n",
             [buyer_account_id],
             function(err, result)
    {
        callback(err, (result ? result.rows : null));
    });
}

exports.getSellerOffers = function(seller_account_id, callback)
{
    runQuery("SELECT offer.* FROM offer, item " +
             "WHERE item.seller = $1 AND offer.item = item.id;\n",
             [seller_account_id],
             function(err, result)
    {
        callback(err, (result ? result.rows : null));
    });
}

exports.sendMessage = function(message_text, from_account_id, to_account_id,
                               callback)
{
    runQuery("INSERT INTO message (text, from_account, to_account, " +
                                  "notification_sent) " +
             "VALUES ($1, $2, $3, $4);\n",
             [message_text, from_account_id, to_account_id, false],
             function(err, result)
    {
        callback(err);
    });
}

exports.getIncomingMessages = function(account_id, callback)
{
    runQuery("SELECT * FROM message WHERE to_account = $1;\n",
             [account_id],
             function(err, result)
    {
        callback(err, (result ? result.rows : null));
    });
}

exports.deleteItem = function(account_id, item_id, callback)
{
    runQuery("DELETE FROM item WHERE id = $1 AND seller = $2;\n",
             [item_id, account_id],
             function(err, result)
    {
        callback(err);
    });
}

loadTestImage = function(name) {
    return fs.readFileSync("server/test_images/" + name + ".png").toString("base64");
}

storeTestData = function(callback) {
    var email_address_1 = "test@example.edu";
    var email_address_2 = "test2@example.edu";
    var password_sha1 = "5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8"; // "password"

    exports.register(email_address_1, password_sha1, "Joe", "Example", function(err) {
    exports.register(email_address_2, password_sha1, "Bob", "Testing", function(err) {
    exports.login(email_address_1, password_sha1, function(err, account) {
    exports.postItem(account.id, { name : "Essentials Watch",
                                   category : "Watches",
                                   price_in_cents : 4000,
                                   picture : loadTestImage("watch")},
                                   function(err) {
    exports.postItem(account.id, { name : "Entrepreneurship Textbook",
                                   category : "Textbooks",
                                   price_in_cents : 9500,
                                   picture : loadTestImage("book")},
                                   function(err) {
    exports.postItem(account.id, { name : "Green chair",
                                   category : "Furniture",
                                   price_in_cents : 1500,
                                   picture: loadTestImage("chair")},
                                   function(err) {
    exports.login(email_address_2, password_sha1, function(err, account) {
    exports.postItem(account.id, { name : "Backpack",
                                   category : "Backpacking",
                                   price_in_cents : 1000,
                                   picture : loadTestImage("backpack")},
                                   function(err) {
    exports.postItem(account.id, { name : "Basic Desk",
                                   category : "Furniture",
                                   price_in_cents : 9900,
                                   picture : loadTestImage("ikea desk")},
                                   function(err) {
    exports.postItem(account.id, { name : "Demi Lovato Tickets",
                                   category : "Tickets",
                                   description : "I have two tickets to Demi Lovato's " +
                                                 "Neon Lights Tour.  I am no longer able " +
                                                 "to go.  The seats are really good!\n\n" +
                                                 "Section 103 Row 6 Seat 19, 20 and two " +
                                                 "FLOOR CENTER SEATS.",
                                   price_in_cents : 6000}, function(err) {
        callback();
    })})})})})})})})})});
}
