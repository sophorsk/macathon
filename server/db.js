var assert = require("assert");

var dbConnectionString = "postgres://macathon:12345@localhost:5432/macathon";
var pg;

/* Synchronously runs the specified SQL statement(s), and aborts the application
 * if they fail.
 *
 * TODO: this isn't actually synchronous yet... */
function runSyncSQLOrDie(sql)
{
    pg.connect(dbConnectionString, function(err, client, done) {
        if (err) {
            console.log("ERROR: Can't connect to database " +
                        dbConnectionString + " (" + err + ")!");
            process.exit(1);
        }
        console.log("Connected to database " + dbConnectionString);
        console.log("Running SQL:\n" + sql);
        client.query(sql, function(err, result) {
            if (err) {
                console.log("ERROR: SQL query failed (" + err + ")!");
                process.exit(1);
            }
            done();
        });
    });
}

/* Asynchronously runs the specified parameterized SQL query.
 * Calls the callback(err, result) when query finished or error occurred.
 */
function runQuery(queryText, values, callback)
{
    pg.connect(dbConnectionString, function(err, client, done) {
        if (err) {
            console.log("WARNING: Can't connect to database " +
                        dbConnectionString + " (" + err + ")!");
            callback(err, null);
            done();
        } else {
            console.log("Connected to database " + dbConnectionString);
            console.log("Running SQL:\n" + queryText);
            console.log("values: " + values);
            client.query(queryText, values, function(err, result) {
                if (err) {
                    console.log("WARNING: SQL query failed (" + err + ")!");
                }
                callback(err, result);
                done();
            });
        }
    });
}

exports = module.exports = function(_pg)
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
           "    profile_picture   BYTEA\n"                           +
           ");\n";

    sql += "CREATE TABLE IF NOT EXISTS message\n"                    +
           "(\n"                                                     +
           "    id                SERIAL PRIMARY KEY,\n"             +
           "    text              VARCHAR(255) NOT NULL,\n"          +
           "    from_account      INTEGER REFERENCES account(id),\n"  +
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
           "    picture           BYTEA\n"                           +
           ");\n";

    sql += "CREATE TABLE IF NOT EXISTS offer\n"                      +
           "(\n"                                                     +
           "    id                SERIAL PRIMARY KEY,\n"             +
           "    item              INTEGER REFERENCES item(id),\n"    +
           "    account           INTEGER REFERENCES account(id),\n" +
           "    price_in_cents    INTEGER NOT NULL\n"               +
           ");\n";

    runSyncSQLOrDie(sql);

    storeTestData();

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
        if (!err && result.rows.length == 0) {
            err = "item not found";
            result = null;
        }
        callback(err, result);
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

storeTestData = function() {
    var email_address = "test@example.edu";
    var password_sha1 = "5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8";
    exports.register(email_address, password_sha1, "Joe", "Example", function(err) {
    exports.login(email_address, password_sha1, function(err, account) {
    exports.postItem(account.id, { name : "Essentials Watch",
                                   category : "Watches",
                                   price_in_cents : 4000}, function(err) {
    exports.postItem(account.id, { name : "Entrepreneurship Textbook",
                                   category : "Textbooks",
                                   price_in_cents : 9500}, function(err) {
    exports.postItem(account.id, { name : "Green chair",
                                   category : "Furniture",
                                   price_in_cents : 1500}, function(err) {
    exports.postItem(account.id, { name : "Backpack",
                                   category : "Backpacking",
                                   price_in_cents : 1000}, function(err) {
    exports.postItem(account.id, { name : "Basic Desk",
                                   category : "Furniture",
                                   price_in_cents : 9900}, function(err) {
    exports.postItem(account.id, { name : "Demi Lovato Tickets",
                                   category : "Tickets",
                                   description : "I have two tickets to Demi Lovato's " +
                                                 "Neon Lights Tour.  I am no longer able " +
                                                 "to go.  The seats are really good!\n\n" +
                                                 "Section 103 Row 6 Seat 19, 20 and two " +
                                                 "FLOOR CENTER SEATS.",
                                   price_in_cents : 6000}, function(err) {
    })})})})})})});});
}
